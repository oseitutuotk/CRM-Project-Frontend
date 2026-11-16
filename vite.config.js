import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://vcc4ftq2-7293.uks1.devtunnels.ms',
        changeOrigin: true,
        secure: false,
        headers: {
          'X-Tunnel-Skip-Anti-Abuse-Page': 'true',
        },
      },
    },
  },
})
