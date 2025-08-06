import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import webExtension from 'vite-plugin-web-extension';

// https://vite.dev/config/
export default defineConfig({
  // プラグイン設定
  plugins: [
    react(),                    // React用プラグイン
    webExtension({              // Chrome Extension用プラグイン
      manifest: 'public/manifest.json', // Chrome Extensionのマニフェストファイルのパス
      // browser: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser', // ブラウザのパス
    })
  ],
  
  // CSS設定（Tailwind CSS用）
  css: {
    postcss: './postcss.config.js',
  },
  
  // ビルド設定
  build: {
    sourcemap: 'inline', // ソースマップを埋め込み、デバッグ時に変換後のJSファイルから元のTSファイルを特定できる
    minify: false, // コード（変数、関数名）圧縮なし、デバッグ時にコードを読みやすくするため
    rollupOptions: {
      external: process.env.NODE_ENV === 'production' ? ['src/dev/**'] : [],
    }
  },
  
  // define, server設定 (変更なし)
  define: {
    __DEV__: true
  },
  server: {
    hmr: {
      port: 24678
    }
  }
})
