import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // The frontend never talks to Groq or YouTube directly anymore —
      // every AI/YouTube call goes through our own backend, which is
      // the only thing that holds the real API keys. This proxy just
      // avoids CORS during development; in production you'd point
      // VITE_API_URL at the deployed backend URL instead.
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
