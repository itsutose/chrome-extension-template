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
    sourcemap: 'inline',
    minify: false,
    rollupOptions: {
      output: {
        sourcemapExcludeSources: false,
        sourcemapPathTransform: (relativeSourcePath) => {
          return relativeSourcePath.replace(/^\.\.\//, '');
        }
      }
    }
  },
  server: {
    hmr: {
      port: 24678
    }
  },
  define: {
    __DEV__: true
  }
})
