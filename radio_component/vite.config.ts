import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: true },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        // Keep three out of the entry chunk so the poster paints before it lands.
        manualChunks: { three: ['three'] },
      },
    },
  },
})
