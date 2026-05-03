# 🇮🇳 ElectionGuide India - Project Instructions

ElectionGuide India is a dual-interface web application (Chat AI + Visual Roadmap) designed to guide users through the Indian electoral process. Built with React and powered by Gemini AI, it provides a highly accessible, localized, and interactive experience to educate voters and simulate the voting journey.

## 🏗️ Project Overview

- **Core Goal:** Simplify the Indian voting process for first-time and experienced voters using AI-driven guidance.
- **Main Interface:** A chat-based assistant ("CivicGuide") paired with a dynamic visual roadmap that updates based on the conversation context.
- **Tech Stack:**
    - **Framework:** React 19 (via Vite)
    - **AI:** Google Gemini API (`@google/generative-ai`)
    - **Styling:** Vanilla CSS (no CSS-in-JS or Utility-first frameworks)
    - **Testing:** Vitest + React Testing Library
    - **Deployment:** Docker + Nginx on Google Cloud Run

## 🛠️ Key Commands

- **Local Development:** `npm run dev` - Starts the Vite development server.
- **Build Production:** `npm run build` - Generates a production-ready build in `dist/`.
- **Run Tests:** `npm test` - Executes unit and integration tests using Vitest.
- **Linting:** `npm run lint` - Runs ESLint checks.
- **Deployment (Local Docker):**
    ```bash
    docker build -t electionguide .
    docker run -p 8080:80 electionguide
    ```

## 🧬 Architecture & Conventions

### 1. AI Integration (`CivicGuide`)
The AI assistant's personality and rules are defined in `src/App.jsx` within the `SYSTEM_PROMPT`. 
- **System Instructions:** Enforces strict neutrality, prohibits political endorsements, and mandates grounding in ECI data.
- **Response Format:** The AI must append `ROADMAP_STEP:[0-4]` and `SUGGESTIONS:[...]` to every response for UI synchronization.
- **Data Grounding:** `src/data/knowledge_base.json` is injected into the prompt as a "RAG-lite" context to ensure factual accuracy regarding election dates and phases.

### 2. UI & Styling
- **Vanilla CSS:** All styles are in `*.css` files. Adhere to the established CSS variable system in `App.css` and `index.css`.
- **Accessibility (A11y):** The app supports "Elderly Mode" (large text) and "High-Contrast" mode. These are toggled via classes on `document.body`.
- **Localization:** All UI strings must be sourced from `src/utils/translations.js`.

### 3. State Management
- Primarily uses standard React hooks (`useState`, `useReducer` where needed, `useCallback`).
- Chat history and roadmap progress are managed in the top-level `App.jsx`.

### 4. Components
- **`ChatPane.jsx`:** Handles message rendering, voice input (Web Speech API), and text-to-speech functionality.
- **`TimelineRoadmap.jsx`:** A visual representation of the 5-step voter journey.
- **`CountdownWidget.jsx`:** Displays time remaining until the next major election.

## 🧪 Testing Guidelines
- Use **Vitest** for all tests.
- Mock all external service calls, especially the `@google/generative-ai` SDK.
- Tests should focus on:
    - Language switching logic.
    - Message rendering accuracy.
    - Roadmap state transitions based on AI output tags.

## 📜 Development Workflow
- **Neutrality:** When modifying the chat logic, ensure the assistant remains non-partisan.
- **Environment:** Always use `import.meta.env.VITE_GEMINI_API_KEY` for API access.
- **Data Updates:** Update `src/data/knowledge_base.json` when new official ECI dates are announced.

---
*Note: This file serves as a guide for Gemini CLI interactions. For general project setup, see [README.md](./README.md).*
