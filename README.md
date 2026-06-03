# Articulate

AI-powered speech coaching app. Record yourself speaking, get instant transcription, analysis, and personalized coaching feedback.

## What It Does

1. **Practice** -- Pick a prompt or freestyle. Record up to 2 minutes of speech.
2. **Transcription** -- Real-time filler word detection (um, uh, like) via Speechmatics. Full transcription via Groq Whisper after recording.
3. **Analysis** -- LLM scores your speech on clarity, grammar, vocabulary, structure, engagement, and filler word usage. Radar chart visualization.
4. **AI Coach** -- Chat with a coach that knows your analysis history and helps you improve.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS 4, Recharts, Framer Motion
- **Backend:** Express proxy (API keys stay server-side)
- **AI:** Groq (Whisper + Llama 3.3), Speechmatics (real-time transcription)
- **Data:** localStorage (no database)

Frontend runs on `http://localhost:5173`, backend proxy on `http://localhost:3001`.

## Environment Variables

| Key | Purpose |
|-----|---------|
| `GROQ_API_KEY` | Groq API for Whisper transcription and LLM analysis |
| `SPEECHMATICS_API_KEY` | Speechmatics for real-time filler word detection |

API keys are stored in `backend/.env` (server-side only) -- never exposed to the browser.


Deployed as a single service on Render. Set `NODE_ENV=production` and your API keys in the Render dashboard.

## License

Private
