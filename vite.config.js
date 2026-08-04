import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/zalo-oauth': {
        target: 'https://oauth.zaloapp.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/zalo-oauth/, '')
      },
      '/zalo-graph': {
        target: 'https://graph.zalo.me',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/zalo-graph/, '')
      }
    }
  }
})
