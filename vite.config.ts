import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import webExtension from 'vite-plugin-web-extension'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: 'public/manifest.json',
      browser: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser'
    })
  ],
  build: {
    sourcemap: true,
    minify: false,
    rollupOptions: {
      output: {
        sourcemapExcludeSources: false
      }
    }
  }
})
