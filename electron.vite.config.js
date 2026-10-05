import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

// The app has no runtime `dependencies` (everything is bundled), so there is
// nothing to externalize for main/preload.
export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.js')
        }
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.js')
        }
      }
    }
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/renderer/index.html')
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
