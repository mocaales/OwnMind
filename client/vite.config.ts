import { defineConfig, loadEnv } from 'vite';
import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const clientEnv = loadEnv(mode, '.', 'VITE_API_TARGET');
  let serverPort = '10000';
  try {
    const serverEnv = readFileSync(new URL('../server/.env', import.meta.url), 'utf8');
    serverPort = serverEnv.match(/^PORT\s*=\s*(\d+)\s*$/m)?.[1] || serverPort;
  } catch {
    // The example/default server port is used when no local server environment exists.
  }
  const apiTarget = clientEnv.VITE_API_TARGET || `http://localhost:${serverPort}`;

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': apiTarget
      }
    }
  };
});
