# 🇮🇳 ElectionGuide India

ElectionGuide India is a dual-interface web application (Chat AI + Visual Roadmap) designed to guide users through the Indian electoral process. Built with React and powered by Gemini AI, it provides a highly accessible, localized, and interactive experience to educate voters and simulate the voting journey.

**Live Demo:** [https://electionguide-1035020186370.us-central1.run.app](https://electionguide-1035020186370.us-central1.run.app)

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
