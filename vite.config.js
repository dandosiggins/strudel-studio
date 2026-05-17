import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api/strudel': {
        target: 'https://strudel.cc',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/strudel/, ''),
      },
    },
  },
  preview: {
    host: true,
    port: parseInt(process.env.PORT) || 4173,
    strictPort: false,
    allowedHosts: ['strudel-studio-production.up.railway.app'],
  },
});
