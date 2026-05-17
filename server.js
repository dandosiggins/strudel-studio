import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Proxy /api/strudel/* → https://strudel.cc/* server-side (no browser CORS)
app.use(
  '/api/strudel',
  createProxyMiddleware({
    target: 'https://strudel.cc',
    changeOrigin: true,
    pathRewrite: { '^/api/strudel': '' },
  }),
);

// Serve built Vite output
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback — express.static calls next() for unknown paths,
// so this handler catches all non-asset routes and returns index.html
app.use((_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
