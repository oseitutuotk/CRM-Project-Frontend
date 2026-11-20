import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawTarget = env.VITE_BACKEND_URL || 'https://wc9bcwdn-7293.uks1.devtunnels.ms/';
  const backendTarget = rawTarget.trim().replace(/\/$/, '');

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
          headers: {
            'X-Tunnel-Skip-Anti-Abuse-Page': 'true',
          },
        },
      },
    },
  };
})
