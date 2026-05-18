import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const AI_SYSTEM_PROMPT = `You are a Strudel live coding music expert.
Generate Strudel pattern code based on the user's description.

Available instruments: piano, bd (kick), sd (snare), hh (hi-hat),
gtr, jvbass, bass1, moog, juno, sitar, supersaw

Available effects: .room() .delay() .lpf() .gain() .pan() .slow() .fast()

CRITICAL RULES:
- Return ONLY raw Strudel code
- NO markdown formatting
- NO \`\`\`javascript or \`\`\` code fences
- NO explanation text before or after the code
- NO comments unless they are // BPM suggestions
- The response must be immediately runnable in a Strudel editor

Additional rules:
- Always use stack() for multiple layers
- Keep patterns musical and interesting
- Match the mood and style described

Example output for "jazzy piano":
// Try BPM: 90
stack(
  note("<c4 eb4 g4 bb4> <f4 ab4 c5>").sound("piano").slow(2).room(0.6),
  sound("bd sd").gain(0.6),
  sound("hh*8").gain(0.25)
)`;

app.post('/api/ai-pattern', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server' });
  }

  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: AI_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt.trim() }],
      }),
    });

    if (!upstream.ok) {
      const data = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({ error: data.error?.message || `Anthropic API error ${upstream.status}` });
    }

    const data = await upstream.json();
    const code = data.content?.[0]?.text?.trim() ?? '';
    res.json({ code });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get('/api/test', (_req, res) =>
  res.json({ status: 'server running', node: process.version }),
);

app.use(express.static(join(__dirname, 'dist')));

app.use((_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT} (node ${process.version})`),
);
