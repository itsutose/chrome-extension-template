---
title: Vite + React + TypeScript で作る Chrome 拡張のデバッグ実践ガイド（汎用）
date: 2025-08-11
tags: [ChromeExtension, MV3, Vite, React, TypeScript, SourceMap, Debugging, VSCode]
keywords: [manifest v3, content script, background service worker, popup, sourcemap inline, external sourcemap, sourceMapPathOverrides]
---

## 問題・質問
- Vite + React + TypeScript で構築した Manifest V3 の Chrome 拡張を、VS Code からブレークポイントで安定してデバッグする方法は？
- SourceMap の設定（inline/外部 .map）や `sourceMapPathOverrides` の考え方は？
- Content Script / Background(Service Worker) / Popup それぞれの適切なデバッグ手順は？

## 原因分析
- ブレークポイントが効くかどうかは、ビルド成果物（JS）と元ソース（TS/TSX）を結びつける SourceMap の品質と、デバッガがそれを正しく解決できるかに依存する。
- Vite の `build.sourcemap` は複数モードがあり、それぞれ生成物の形が異なる：
  - `sourcemap: 'inline'`: JS 末尾に `data:application/json;base64,...` として SourceMap JSON が埋め込まれる（外部 `.js.map` は出ない）
  - `sourcemap: true`: 外部 `*.js.map` が生成され、JS は `//# sourceMappingURL=*.js.map` を参照
  - `sourcemap: 'hidden'`: 外部 `.map` は生成されるが、JS に参照コメントは付かない
- VS Code/Chrome DevTools は、inline/外部のどちらでも、SourceMap の `sources` に記載されたパスをもとに元ファイルへマッピングする。
- ただし、`sources` が相対・仮想・URL 形式（例: `../../../src/...`, `vite://...`, `webpack:///src/...`）の場合、VS Code 側の `launch.json` で `sourceMapPathOverrides` を適切に指定してワークスペース上のパスへ解決する必要がある。


## 解決策

### 1) Vite の基本設定
```ts
// vite.config.ts（例）
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import webExtension from 'vite-plugin-web-extension'

export default defineConfig({
  plugins: [
    react(),
    webExtension({ manifest: 'public/manifest.json' })
  ],
  build: {
    // 開発時は 'inline' または true を推奨。運用で不要なら false/'hidden' へ
    sourcemap: 'inline',
    minify: false
  }
})
```

### 2) Manifest V3 の主要ポイント
```json
// public/manifest.json（例・要点のみ）
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0.0",
  "action": { "default_popup": "src/core/popup.html" },
  "background": { "service_worker": "src/core/background.js" },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/core/content.js"],
      "run_at": "document_start"
    }
  ],
  "permissions": ["storage", "activeTab"]
}
```

### 3) VS Code からの起動/接続設定
```json
// .vscode/launch.json（例）
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Extension (Chrome)",
      "type": "pwa-chrome",
      "request": "launch",
      "url": "chrome://extensions/",
      "webRoot": "${workspaceFolder}",
      "runtimeExecutable": "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "runtimeArgs": [
        "--remote-debugging-port=9222",
        "--load-extension=${workspaceFolder}/dist",
        "--disable-extensions-except=${workspaceFolder}/dist"
      ],
      "sourceMaps": true,
      "sourceMapPathOverrides": {
        // *.js.mapのパス : ワークスペースの対応してほしいファイルのパス
        "../../../src/*": "${workspaceFolder}/src/*", ← これがvite.config.jsonのビルドの生成ファイルに含まれるパスと合えば良い
        // "*/src/*": "${workspaceFolder}/src/*",
        // "webpack:///src/*": "${workspaceFolder}/src/*",
        // "vite:///*": "${workspaceFolder}/*"
      }
    }
  ]
}
```
- 重要: `sourceMapPathOverrides` は、実際に生成される SourceMap の `sources` に合わせて調整すること。

### 4) 各コンテキストのデバッグ要点
- Content Script
  - 対象タブの DevTools で「Sources → Extensions」配下、または VS Code 経由でブレーク。
  - `run_at` と DOM 準備後の初期化タイミングを意識。
- Background (Service Worker)
  - `chrome://extensions` → 対象拡張 → Service Worker の「検査」で DevTools。
  - ライフサイクルはイベント駆動で短命。`chrome.runtime.onInstalled` などでトリガを作ると良い。
- Popup
  - ポップアップを開いてから DevTools を開く（閉じるとコンテキストも終了）。

### 5) inline/外部 SourceMap の中身を確認する
```sh
# inline の場合（macOS）: JS 末尾の data URL をデコードして sources を確認
tail -n 1 dist/path/to/file.js | sed 's/.*base64,//' | base64 -D | jq .sources

# GNU 系の場合
# tail -n 1 dist/path/to/file.js | sed 's/.*base64,//' | base64 -d | jq .sources

# 外部 .map の場合
tail -n +1 dist/path/to/file.js.map | jq .sources
```

### 6) よくある不具合と対処
- ブレークポイントが灰色/無効
  - コードがまだ実行されていない（Service Worker/Popup のライフサイクル）。
  - SourceMap と `sourceMapPathOverrides` の不一致。
  - Page コンテキストと Content Script を取り違えている。
- 意図しないファイルにマップされる
  - `sources` の形式が想定と異なる。`sourceMapPathOverrides` をより具体的に（相対パスや仮想プロトコルに合わせる）。
- 変更が反映されない
  - `chrome://extensions` で拡張を「更新」。Service Worker はキャッシュに注意。
  - クリーンビルド（例: `rm -rf dist && vite build`）。

### 7) 開発・本番の切り替え指針
- 開発: `sourcemap: 'inline' | true`, `minify: false`, 追加ログを有効化。
- 本番: `sourcemap: false | 'hidden'`（必要性に応じて）、ログ削減、dev 依存の除外。

## 参考リンク
- Chrome Extensions (Manifest V3) Docs: `https://developer.chrome.com/docs/extensions`
- Chrome DevTools — Source Maps: `https://developer.chrome.com/docs/devtools/javascript/source-maps`
- Vite Config — build.sourcemap: `https://vitejs.dev/config/build-options.html#build-sourcemap`
- vite-plugin-web-extension: `https://github.com/aklinker1/vite-plugin-web-extension`

## 関連ファイル
- `vite.config.ts`（Vite ビルド/SourceMap 設定）
- `public/manifest.json`（MV3 マニフェスト）
- `.vscode/launch.json`（ブラウザ起動と SourceMap パス変換）
- `src/core/content.tsx|ts`（Content Script）
- `src/core/background.ts|js`（Service Worker）
- `src/core/popup.html|tsx`（Popup UI）
