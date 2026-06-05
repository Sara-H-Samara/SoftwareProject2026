import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      // ─── Azurite blob proxy ───────────────────────────────────────────────
      '/blob-proxy': {
        target: 'http://127.0.0.1:10000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/blob-proxy/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})