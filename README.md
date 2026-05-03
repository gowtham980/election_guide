# 🇮🇳 ElectionGuide India

ElectionGuide India is a dual-interface web application (Chat AI + Visual Roadmap) designed to guide users through the Indian electoral process. Built with React and powered by Gemini AI, it provides a highly accessible, localized, and interactive experience to educate voters and simulate the voting journey.

**Live Demo:** [https://electionguide-1035020186370.us-central1.run.app](https://electionguide-1035020186370.us-central1.run.app)

## 🎯 Chosen Vertical
**GovTech & Social Impact (CivicTech)**  
This project targets the massive demographic of first-time and rural voters in India. By bridging the information gap regarding electoral procedures through an accessible, multilingual AI companion, it aims to increase voter turnout and reduce the friction caused by complex bureaucratic jargon.

## 🧠 Approach and Logic
The core logic revolves around translating a rigid, procedural system into an empathetic, conversational journey. 
- **RAG-lite Grounding:** Rather than letting the LLM hallucinate election procedures, we anchor the Gemini AI with a local JSON knowledge base containing official Election Commission of India (ECI) data, dates, and forms.
- **State Machine UI:** The conversation drives a 5-step state machine (Registration, Find Booth, Candidate Info, Polling Day, Vote Cast). The AI is prompted to return specific hidden tags (e.g., `ROADMAP_STEP:[0-4]`) which the React frontend parses to sync the visual "subway map" tracker on the sidebar.
- **Accessibility-First:** We approached the UI by assuming low tech-literacy. This dictated the inclusion of voice-to-text, text-to-speech, High-Contrast modes, and an "Elderly Mode" for enhanced readability. We also use a custom inline UI banner to gracefully handle browsers that lack Web Speech API support.
- **Test-Driven Reliability:** Core utilities (like parsing AI responses and roadmap steps) are decoupled from React components and rigorously tested using Vitest to ensure stability across complex, multiline AI outputs.

## ⚙️ How the Solution Works
1. **User Interaction:** The user speaks or types their query in one of four supported languages (English, Hindi, Tamil, Telugu). Changing the language dynamically resets the AI's context to ensure pure, localized responses.
2. **AI Processing:** The frontend sends the query along with a strictly engineered `SYSTEM_PROMPT` to the Gemini API. The prompt instructs the AI to be non-partisan, informative, and to append UI-syncing tags.
3. **UI Synchronization:** As the stream returns, the React app extracts the conversational text to display in the chat pane, whilst stripping out the metadata tags (`ROADMAP_STEP`, `SUGGESTIONS`) to update the roadmap progress and quick-reply buttons in real-time.
4. **Interactive Simulation:** When reaching step 4, the AI guides the user through a mock EVM/VVPAT interaction via text, culminating in a triumphant "Victory Modal" with confetti once the vote is successfully "cast".
5. **Analytics & Deployment:** User interactions are securely tracked via Firebase Analytics (configured with strict CSP headers in Nginx), and the entire application is containerized and served via Google Cloud Run for fast, secure, and scalable access.

## 💭 Assumptions Made
- **Neutrality by Prompting:** We assume the LLM will successfully adhere to the strict non-partisan guidelines set in the system prompt without requiring an external moderation layer for the scope of this prototype.
- **Network Availability:** The current architecture assumes the user has an active internet connection to communicate with the Gemini API and Firebase Analytics. Offline fallback is not currently supported.
- **Browser Capabilities:** The voice input and text-to-speech features assume the user is on a modern browser that supports the Web Speech API. If unsupported, we assume the user can still interact via the text input fallback gracefully provided by our error-handling UI.

## 🏆 Key Highlights (Hackathon Criteria)
- **Effective use of Google Services:** Deeply integrates the **Google Gemini API** for its core conversational logic (RAG-lite), deploys seamlessly via **Google Cloud Run** for scalable and secure hosting, and leverages **Firebase Analytics** to track user engagement and accessibility preferences.
- **Practical and real-world usability:** Solves a genuine civic problem by simplifying the complex Indian voter journey. It includes multi-lingual support (English, Hindi, Tamil, Telugu), an "Elderly Mode" (high-contrast + large text), and voice interactions, ensuring it is highly accessible to users regardless of their tech-literacy.
- **Clean and maintainable code:** Follows modern React best practices with highly modular components (`ChatPane`, `TimelineRoadmap`). It employs Vite for rapid builds, Vitest for robust testing, and a streamlined Docker/Nginx configuration with strict security headers, ensuring the architecture is easy to maintain and scale.

## ✨ Features

- **Conversational AI:** Integrated with Gemini (via `@google/generative-ai`) using a custom `CivicGuide` system prompt that enforces strict neutrality and grounds responses in official Election Commission of India (ECI) data.
- **Visual Roadmap:** A dynamic "subway map" style tracker that updates in real-time as the user progresses through their voter journey.
- **Accessibility & Localization:** 
  - Full support for **English, Hindi, Tamil, and Telugu**.
  - Voice input (via Web Speech API) and Text-to-Speech (read-aloud) capabilities.
  - "Elderly Mode" with text size toggles and a High-Contrast mode for visually impaired users.
- **Interactive Simulation:** A text-based EVM/VVPAT simulation to familiarize first-time voters with the physical voting process.
- **Data Grounding (RAG-lite):** A local `knowledge_base.json` guarantees factual accuracy regarding recent and upcoming state elections.
- **Victory Modal:** A high-impact "Completion Celebration" featuring staggered tricolor confetti cannons, a stats board, and official ECI Call-To-Actions triggered upon reaching the final step.

## 🛠️ Tech Stack

- **Frontend:** React, Vite, Vanilla CSS
- **AI Integration:** Google Gemini API (`@google/generative-ai`)
- **Deployment:** Docker, Nginx, Google Cloud Run

## 🚀 Local Development

### Prerequisites
- Node.js (v20 or higher)
- A Google Gemini API Key

### Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd election
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and add your Gemini API key:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## ☁️ Deployment (Google Cloud Run)

The application is containerized using Docker and served via Nginx. To deploy to Google Cloud Run from source:

1. **Ensure you have the Google Cloud CLI installed and authenticated:**
   ```bash
   gcloud auth login
   gcloud config set project your-project-id
   ```

2. **Deploy directly from source:**
   ```bash
   gcloud run deploy electionguide \
     --source . \
     --region us-central1 \
     --allow-unauthenticated \
     --set-build-env-vars="VITE_GEMINI_API_KEY=your_gemini_api_key_here"
   ```

*Note: Ensure `.dockerignore` does not exclude `.env.local` if you are relying on local environment variables during the build phase (though passing it via `--set-build-env-vars` is the recommended approach for Cloud Run).*
