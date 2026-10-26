import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import https from 'node:https';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      proxy: {
        '/api/fd': {
          target: 'https://api.football-data.org',
          changeOrigin: true,
          // keeps the connection open, so repeat requests are faster
          agent: new https.Agent({ keepAlive: true, maxSockets: 4, family: 4 }),
          timeout: 20000,
          proxyTimeout: 20000,
          rewrite: (path) => path.replace(/^\/api\/fd/, '/v4'),
          headers: { 'X-Auth-Token': env.FOOTBALL_DATA_KEY || '' },
        },
      },
    },
  };
});