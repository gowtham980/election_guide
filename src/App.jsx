import React, { useCallback, useEffect, useRef, useState, Suspense, useMemo } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { logEvent } from 'firebase/analytics';
import { analytics } from './utils/firebase';
import './App.css';
import { translations } from './utils/translations';
import kbData from './data/knowledge_base.json';

const ChatPane = React.lazy(() => import('./components/ChatPane'));
const CountdownWidget = React.lazy(() => import('./components/CountdownWidget'));
const TimelineRoadmap = React.lazy(() => import('./components/TimelineRoadmap'));

// ─── CivicGuide System Prompt ────────────────────────────────────────────────
const SYSTEM_PROMPT = `[ROLE & IDENTITY]
You are CivicGuide, an interactive, strictly non-partisan, and highly accessible Indian election assistant. Your primary purpose is to help users understand the democratic election process in India, critical timelines, and the step-by-step actions required to participate. You translate complex electoral jargon into simple, digestible, and engaging conversations.

All information you provide is grounded in official sources from the Election Commission of India (ECI): eci.gov.in and voters.eci.gov.in.

[TONE & PERSONALITY]
- Neutral & Objective: You show zero bias toward any political party, candidate, or ideology.
- Encouraging & Patient: You empower users by making civic participation feel achievable and important.
- Clear & Accessible: Use simple language. Avoid dense paragraphs. Use formatting (bullet points, bold text, emojis) to make reading easy.
- Interactive: You do not just lecture. You ask guiding questions to keep the user engaged.
- Always greet users with "Jai Hind! 🇮🇳" in your very first message.

[CORE OBJECTIVES]
1. Explain the Process: Break down how Indian elections work (voter registration, campaigning, polling day, vote counting, result declaration).
2. Clarify Timelines: Provide clear chronological phases for upcoming elections.
3. Guide Actionable Steps: Walk users through personal steps — how to check voter status, what ID to bring to the polling booth, how to find their polling station using voters.eci.gov.in.
4. Cover key topics: EPIC/Voter ID, Form 6, Electoral Roll, Polling Booth, EVM, NOTA, NRI voting, Model Code of Conduct.

[INTERACTION FRAMEWORK & BEHAVIOR RULES]
- The "Chunking" Rule: Never give the user a wall of text. Break complex answers into 2-3 short steps or bullet points, then ask a confirmation or follow-up question (e.g., "Would you like me to explain how to check your name on the voter list next?").
- The "Progressive Disclosure" Method: Start with a high-level summary. Only dive into complex legal or procedural details if the user explicitly asks.
- Interactive Quizzes: If the user is curious or a student, offer a quick, fun knowledge check about Indian elections (e.g., "Did you know India has the world's largest voter base? Want a quick 3-question trivia?").
- Always suggest the next logical step in the voter journey.

[INTERACTIVE MOCK SIMULATION (EVM PRACTICE)]
If the user asks to "Practice Voting", asks "how to vote", or asks about the EVM, trigger an interactive EVM simulation.
- Start by describing the physical EVM machine and VVPAT.
- Ask the user step-by-step questions to test their knowledge (e.g., "You see the blue button next to your candidate's symbol. What do you do next?").
- Wait for their answer, guide them interactively, until they press the button, hear the "beep", and verify the VVPAT slip. Make it a fun, immersive text-adventure.

[ROADMAP TRACKING — INTERNAL INSTRUCTION]
At the END of every single response, append ONE line that indicates the current stage in the voter journey. The line MUST be formatted EXACTLY like this, with no other text on that line:
ROADMAP_STEP:[STEP_NUMBER]
Where STEP_NUMBER is:
- 0 = Voter Registration & EPIC check
- 1 = Electoral Roll verification
- 2 = Finding Polling Booth
- 3 = Candidate Research
- 4 = Voting Day & Preparation

Pick the step that best matches what you just explained. If the conversation is about general intro or greetings, use 0.

[QUICK REPLIES — INTERNAL INSTRUCTION]
After the ROADMAP_STEP, append ONE line with 2-3 short quick reply suggestions for the user. Format it EXACTLY as a JSON array like this:
SUGGESTIONS:["Yes, what's next?", "How do I check my name?"]

[STRICT SAFETY & COMPLIANCE GUARDRAILS]
- NO ENDORSEMENTS: Under no circumstances will you endorse, criticize, or analyze a specific political party, candidate, or political platform.
- NO PREDICTIONS: You will not predict election outcomes, discuss polling data, or speculate on winners.
- NO DEBATE: If a user attempts to bait you into a political debate, you must politely pivot: "I'm here to provide administrative and procedural information about the Indian election process. How can I help you with your voting steps today?"
- SOURCE RELIANCE: When providing specific dates or legal requirements, always remind the user to verify with voters.eci.gov.in or eci.gov.in.
- INDIA ONLY: You only answer questions about Indian elections and the ECI process.`;

// ─── Gemini client (lazy-initialized) ────────────────────────────────────────
let genAI = null;
let chatSession = null;

function getChat() {
  if (!chatSession) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      throw new Error('MISSING_API_KEY');
    }
    genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      systemInstruction: SYSTEM_PROMPT + `\n\n[OFFICIAL ELECTION DATA KNOWLEDGE BASE]\nHere is the latest official data for upcoming elections. ALWAYS consult this data first when answering questions about dates, phases, or timelines:\n${JSON.stringify(kbData, null, 2)}`,
    });
    chatSession = model.startChat({ history: [] });
  }
  return chatSession;
}

// ─── Pure helper functions (outside component for stable references) ─────────
export function extractRoadmapStep(text) {
  const match = text.match(/ROADMAP_STEP:(\d)/);
  return match ? parseInt(match[1], 10) : null;
}

export function extractSuggestions(text) {
  // Use [\s\S] to match across newlines in case the AI wraps the JSON
  const match = text.match(/SUGGESTIONS:(\[[\s\S]*?\])/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      return [];
    }
  }
  return [];
}

export function cleanText(text) {
  return text
    .replace(/ROADMAP_STEP:\d\s*/g, '')
    .replace(/SUGGESTIONS:\[[\s\S]*?\]\s*/g, '')
    .trimEnd();
}

function getWelcomeMessage(t) {
  return {
    role: 'model',
    parts: [
      {
        text: `Jai Hind! 🇮🇳 I'm **CivicGuide**, your interactive Indian election assistant.\n\nI'm here to help you with everything about the Indian electoral process — from registering as a voter to casting your ballot on election day.\n\nAll information is sourced from the **Election Commission of India (ECI)**.\n\n**${t.placeholder}**\n- 📋 ${t.roadmap[0]}\n- 🔍 ${t.roadmap[1]}\n- 📍 ${t.roadmap[2]}\n- 👥 ${t.roadmap[3]}\n- 🗳️ ${t.roadmap[4]}`,
      },
    ],
  };
}

function getInitialSuggestions(t) {
  return [
    `📋 ${t.roadmap[0]}`,
    `🔍 ${t.roadmap[1]}`,
    `📍 ${t.roadmap[2]}`,
    `👥 ${t.roadmap[3]}`,
    `🗳️ ${t.roadmap[4]}`,
  ];
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [language, setLanguage] = useState('English');
  const t = translations[language] || translations['English'];

  const [messages, setMessages] = useState(() => [getWelcomeMessage(translations['English'])]);
  const [roadmapStep, setRoadmapStep] = useState(0);
  const [suggestions, setSuggestions] = useState(() => getInitialSuggestions(translations['English']));

  const ROADMAP_STAGES = useMemo(() => [
    { id: 0, label: t.roadmap[0], icon: '📋', detail: t.details[0] },
    { id: 1, label: t.roadmap[1], icon: '🔍', detail: t.details[1] },
    { id: 2, label: t.roadmap[2], icon: '📍', detail: t.details[2] },
    { id: 3, label: t.roadmap[3], icon: '👥', detail: t.details[3] },
    { id: 4, label: t.roadmap[4], icon: '🗳️', detail: t.details[4] },
  ], [t]);

  // Reset chat session + UI when language changes so the AI context is fresh
  useEffect(() => {
    chatSession = null;
    setMessages([getWelcomeMessage(t)]);
    setSuggestions(getInitialSuggestions(t));
    setRoadmapStep(0);
  }, [language]); // eslint-disable-line react-hooks/exhaustive-deps

  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyMissing, setApiKeyMissing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [textSize, setTextSize] = useState('normal');
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    document.body.className = '';
    if (textSize === 'large') document.body.classList.add('text-large');
    if (highContrast) document.body.classList.add('high-contrast');
  }, [textSize, highContrast]);

  const sendMessage = useCallback(async (userText) => {
    if (!userText.trim() || isLoading) return;

    if (analytics) logEvent(analytics, 'chat_message_sent', { text_length: userText.length });

    const userMsg = { role: 'user', parts: [{ text: userText }] };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const chat = getChat();
      const promptContext = language === 'English'
        ? userText
        : `[CRITICAL INSTRUCTION: The user prefers ${language}. You MUST respond entirely in ${language}. Also ensure your quick reply SUGGESTIONS are translated to ${language}.]\n\nUser: ${userText}`;
      const result = await chat.sendMessage(promptContext);
      const rawText = result.response.text();

      const step = extractRoadmapStep(rawText);
      if (step !== null) {
        setRoadmapStep(step);
        if (analytics) logEvent(analytics, 'roadmap_step_changed', { step });
      }

      const newSuggestions = extractSuggestions(rawText);
      setSuggestions(newSuggestions);

      const modelMsg = {
        role: 'model',
        parts: [{ text: cleanText(rawText) }],
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (err) {
      if (err.message === 'MISSING_API_KEY') {
        setApiKeyMissing(true);
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            parts: [{ text: '⚠️ **API Key not configured.** Please add your Gemini API key to the `.env.local` file:\n```\nVITE_GEMINI_API_KEY=your_key_here\n```\nThen restart the dev server.' }],
          },
        ]);
      } else {
        console.error('Gemini API Error:', err);
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            parts: [{ text: `⚠️ **Connection Error:** \`${err.message}\`\n\nPlease check your browser console for more details. If you just added the API key, try restarting the dev server.` }],
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, language]);

  return (
    <div className="app-container">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-brand">
          <span className="header-flag">🇮🇳</span>
          <div>
            <h1 className="header-title">ElectionGuide India</h1>
            <p className="header-subtitle">Powered by CivicGuide AI · Official ECI Data</p>
          </div>
        </div>
        <div className="header-badges">
          <button 
            className="a11y-toggle" 
            onClick={() => setTextSize(s => s === 'normal' ? 'large' : 'normal')}
            title="Toggle Text Size"
          >
            {textSize === 'large' ? 'A-' : 'A+'}
          </button>
          <button 
            className="a11y-toggle" 
            onClick={() => setHighContrast(!highContrast)}
            title="Toggle High Contrast"
            aria-label="Toggle High Contrast"
            tabIndex="0"
          >
            🌓
          </button>
          <select 
            className="language-selector" 
            value={language} 
            onChange={(e) => {
              setLanguage(e.target.value);
              if (analytics) logEvent(analytics, 'language_changed', { language: e.target.value });
            }}
            aria-label="Select Language"
            tabIndex="0"
          >
            {Object.keys(translations).map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
          <button 
            className="sidebar-toggle" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-expanded={isSidebarOpen}
            aria-label="Toggle Sidebar Roadmap"
            tabIndex="0"
          >
            {isSidebarOpen ? '✕ Close' : '🗺️ Roadmap'}
          </button>
          <span className="badge badge-eci" aria-label="ECI Verified">ECI Verified</span>
          <span className="badge badge-ai" aria-label="Gemini AI Powered">Gemini AI</span>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <main className="app-main">
        {/* Left: Chat */}
        <section className="chat-section" aria-live="polite">
          {apiKeyMissing && (
            <div className="api-key-banner" role="alert">
              🔑 Add <code>VITE_GEMINI_API_KEY</code> to <code>.env.local</code> and restart the server
            </div>
          )}
          <Suspense fallback={<div className="loading-fallback" aria-label="Loading chat interface...">Loading...</div>}>
            <ChatPane
              messages={messages}
              onSend={sendMessage}
              isLoading={isLoading}
              suggestions={suggestions}
              placeholder={t.placeholder}
              sendLabel={t.send}
              language={language}
            />
          </Suspense>
        </section>

        {/* Right: Sidebar */}
        <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`} aria-label="Election Roadmap Sidebar">
          <Suspense fallback={<div className="loading-fallback" aria-label="Loading roadmap...">Loading roadmap...</div>}>
            <CountdownWidget title={t.countdownTitle} daysLabel={t.days} hoursLabel={t.hours} minsLabel={t.minutes} secsLabel={t.seconds} />
            <TimelineRoadmap stages={ROADMAP_STAGES} currentStep={roadmapStep} title={t.roadmapTitle} />
          </Suspense>

          <div className="official-links">
            <h3 className="links-title">🔗 Official ECI Portals</h3>
            <a href="https://voters.eci.gov.in" target="_blank" rel="noreferrer" className="link-card">
              <span className="link-icon">🗳️</span>
              <span>Voters' Services Portal</span>
            </a>
            <a href="https://electoralsearch.eci.gov.in" target="_blank" rel="noreferrer" className="link-card">
              <span className="link-icon">🔍</span>
              <span>Electoral Roll Search</span>
            </a>
            <a href="https://myneta.info" target="_blank" rel="noreferrer" className="link-card">
              <span className="link-icon">👤</span>
              <span>Candidate Info (Myneta)</span>
            </a>
            <a href="https://eci.gov.in" target="_blank" rel="noreferrer" className="link-card">
              <span className="link-icon">🏛️</span>
              <span>Election Commission of India</span>
            </a>
          </div>
        </aside>
      </main>
    </div>
  );
}
