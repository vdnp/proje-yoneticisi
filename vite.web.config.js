import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Standalone renderer build for previewing the UI in a plain browser
// (no Electron). window.api is undefined here, so the renderer falls back
// to the mock backend in src/renderer/src/lib/mockApi.js.
export default defineConfig({
  root: resolve(__dirname, 'src/renderer'),
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer/src')
    }
  },
  server: {
    port: 5199,
    strictPort: true
  },
  build: {
    outDir: resolve(__dirname, 'dist-web')
  }
})
