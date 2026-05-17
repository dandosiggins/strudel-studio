import express from 'express';
import https from 'https';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Health-check — confirm Express is running
app.get('/api/test', (_req, res) =>
  res.json({ status: 'proxy server running', node: process.version }),
);

// Connectivity diagnostic — shows exactly what strudel.cc returns server-side
app.get('/api/test-connectivity', async (_req, res) => {
  try {
    const r = await fetch('https://strudel.cc/strudel.json');
    const text = await r.text();
    res.json({
      targetStatus: r.status,
      contentType: r.headers.get('content-type'),
      bodyPreview: text.slice(0, 300),
    });
  } catch (err) {
    res.status(502).json({ error: err.message, code: err.code });
  }
});

// Proxy /api/strudel/* → https://strudel.cc/* using Node's built-in https
// (avoids http-proxy-middleware compatibility issues with Express 5 / httpxy)
app.use('/api/strudel', (req, res, next) => {
  const targetPath = req.url || '/'; // Express already stripped /api/strudel

  const proxyReq = https.request(
    {
      hostname: 'strudel.cc',
      path: targetPath,
      method: req.method,
      headers: { host: 'strudel.cc' },
    },
    (proxyRes) => {
      // Forward all headers except hop-by-hop ones
      const forward = {};
      for (const [k, v] of Object.entries(proxyRes.headers)) {
        if (!['transfer-encoding', 'connection', 'keep-alive'].includes(k.toLowerCase())) {
          forward[k] = v;
        }
      }
      // Allow same-origin browser access (no CORS restriction on our own proxy)
      forward['access-control-allow-origin'] = '*';

      res.writeHead(proxyRes.statusCode, forward);
      proxyRes.pipe(res, { end: true });
    },
  );

  proxyReq.on('error', (err) => {
    console.error('[proxy] error reaching strudel.cc:', err.message);
    next(err);
  });

  proxyReq.end();
});

// Serve built Vite output
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback
app.use((_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// Express error handler — returns JSON so errors are visible in browser
app.use((err, _req, res, _next) => {
  res.status(502).json({ error: 'proxy error', message: err.message });
});

app.listen(PORT, () =>
  console.log(`Express proxy server running on port ${PORT} (node ${process.version})`),
);
