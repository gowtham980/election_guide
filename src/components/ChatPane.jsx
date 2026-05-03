import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

const langMap = {
  English: 'en-IN',
  Hindi: 'hi-IN',
  Tamil: 'ta-IN',
  Telugu: 'te-IN',
  Bengali: 'bn-IN',
  Marathi: 'mr-IN',
};

export default function ChatPane({ messages, onSend, isLoading, suggestions = [], placeholder = 'Ask anything...', sendLabel = 'Send', language = 'English' }) {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + (prev ? ' ' : '') + transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.lang = langMap[language] || 'en-IN';
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert("Speech recognition not supported in this browser.");
      }
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop current speaking
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langMap[language] || 'en-IN';
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech not supported in this browser.");
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = (text) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setInput('');
    onSend(msg);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-pane">
      {/* Message List */}
      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isBot = msg.role === 'model';
          const text = msg.parts?.[0]?.text ?? '';

          return (
            <div key={i} className={`message-row ${isBot ? 'bot-row' : 'user-row'}`}>
              {isBot && (
                <div className="bot-avatar" title="CivicGuide AI">🇮🇳</div>
              )}
              <div className={`message-bubble ${isBot ? 'bot-bubble' : 'user-bubble'}`}>
                {isBot ? (
                  <ReactMarkdown
                    components={{
                      a: ({ href, children }) => (
                        <a href={href} target="_blank" rel="noreferrer" className="md-link">
                          {children}
                        </a>
                      ),
                      code: ({ children }) => (
                        <code className="md-code">{children}</code>
                      ),
                    }}
                  >
                    {text}
                  </ReactMarkdown>
                ) : (
                  <p>{text}</p>
                )}
              </div>
              {isBot && (
                <button 
                  className="tts-btn" 
                  onClick={() => speakText(text)}
                  title="Read aloud"
                >
                  🔊
                </button>
              )}
              {!isBot && (
                <div className="user-avatar" title="You">👤</div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="message-row bot-row">
            <div className="bot-avatar">🇮🇳</div>
            <div className="message-bubble bot-bubble typing-bubble">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Quick-reply suggestions */}
      {suggestions.length > 0 && (
        <div className="suggestions-bar">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              className="suggestion-chip"
              onClick={() => handleSend(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      <div className="chat-input-bar">
        <button 
          className={`mic-btn ${isListening ? 'listening' : ''}`}
          onClick={toggleListen}
          title="Voice Input"
          disabled={isLoading}
        >
          {isListening ? '🔴' : '🎤'}
        </button>
        <textarea
          className="chat-input"
          rows={1}
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          disabled={isLoading}
        />
        <button
          className="send-btn"
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          title={sendLabel}
        >
          {isLoading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
}
