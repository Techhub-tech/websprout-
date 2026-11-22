import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves this site from /Websprout-V1-hub/ (not the domain root),
// so production builds need that base path. Local dev (npm run dev) stays at "/".
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/Websprout-V1-hub/' : '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
}));
