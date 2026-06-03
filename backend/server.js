import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Buffer } from 'node:buffer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// ── Serve static frontend in production ────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Raw body capture for multipart forwarding (transcription endpoint)
const rawBodyForMultipart = express.raw({ type: '*/*', limit: '50mb' });

// ── Groq Chat Completions ────────────────────────────────────────────────
app.post('/api/groq/chat', async (req, res) => {
  const { prompt, model = 'llama-3.3-70b-versatile', temperature = 0.7, max_tokens = 2048 } = req.body;

  if (!prompt) return res.status(400).json({ error: 'prompt is required' });

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Groq Whisper Transcription ───────────────────────────────────────────
app.post('/api/groq/transcribe', rawBodyForMultipart, async (req, res) => {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': req.headers['content-type'],
      },
      body: req.body, // Buffer from express.raw()
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Speechmatics Temporary Key ──────────────────────────────────────────
app.post('/api/speechmatics/key', async (req, res) => {
  try {
    const response = await fetch('https://mp.speechmatics.com/v1/api_keys?type=rt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SPEECHMATICS_API_KEY}`,
      },
      body: JSON.stringify({ ttl: 3600 }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Health Check ────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    groq: !!process.env.GROQ_API_KEY,
    speechmatics: !!process.env.SPEECHMATICS_API_KEY,
  });
});

// ── Catch-all: serve React app for client-side routing ──────────────────
if (process.env.NODE_ENV === 'production') {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Backend proxy running on http://localhost:${PORT}`);
});
