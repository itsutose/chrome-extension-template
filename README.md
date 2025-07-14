# Chrome Extension Vite Sample

TypeScript + React + Vite を使用したChrome拡張機能の開発環境です。Braveブラウザでのデバッグに対応しています。

## 🚀 機能

- **TypeScript** + **React** + **Vite** による開発環境
- **Braveブラウザ**でのデバッグ対応
- **ホットリロード**対応
- **ソースマップ**対応
- **Cursor/VSCode**でのブレークポイントデバッグ
- **ポート9222でのプロセス管理**（通常のBraveブラウザに影響なし）
- **デバッグプロファイル管理**（保持・リセット機能）

## 📋 前提条件

- Node.js 18以上
- pnpm
- Brave Browser

## 🛠️ セットアップ

```bash
# 依存関係のインストール
pnpm install

# 開発用ビルド
npm run build
```

## 🐛 デバッグ方法

### 1. 拡張機能のビルド
```bash
# 開発モード（監視モード）
npm run dev:extension

# 本番モード
npm run build:extension
```

### 2. ホットリロード機能

Chrome拡張機能の開発では、ファイル変更時に自動的に拡張機能をリロードする機能を提供しています。

#### 基本的な自動リロード
```bash
npm run auto-reload
```

#### 高度な自動リロード（Chrome拡張機能ページを自動で開く）
```bash
npm run auto-reload:advanced
```

#### 完全な開発環境（ビルド監視 + 自動リロード）
```bash
npm run dev:full
```

**注意**: Chrome拡張機能の特性上、完全なホットリロードは制限があります：
- Service Worker（background script）は手動リロードが必要
- Content Scriptsはページリロード時に再読み込み
- Popupは拡張機能の再読み込みが必要

### 3. Braveをデバッグモードで起動
```bash
npm run start:brave:debug
# または
./start-brave-debug.sh
```

### 4. Cursor/VSCodeでデバッグ
1. サイドバーの「Run and Debug」を開く
2. 「Launch Brave Extension」または「Attach to Brave Extension」を選択
3. ▶️ボタンでデバッグ開始

### 5. デバッグ終了
```bash
npm run stop:brave:debug
# または
./stop-brave-debug.sh
```

### 6. デバッグ環境リセット（オプション）
```bash
npm run reset:brave:debug
# または
./reset-brave-debug.sh
```

### 7. ブレークポイントの設定
- `src/background.ts`、`src/popup.tsx`、`src/content.ts`にブレークポイントを設定
- `debugger;`文を使用して強制的に停止することも可能

## 📁 プロジェクト構造

```
chrome-extension-vite-sample/
├── src/
│   ├── background.ts      # バックグラウンドスクリプト
│   ├── content.ts         # コンテンツスクリプト
│   ├── popup.tsx          # ポップアップUI
│   └── popup.css          # ポップアップスタイル
├── public/
│   ├── manifest.json      # 拡張機能マニフェスト
│   └── popup.html         # ポップアップHTML
├── dist/                  # ビルド出力（自動生成）
├── .vscode/
│   ├── launch.json        # デバッグ設定
│   └── brave-debug-profile/ # デバッグ用プロファイル
└── start-brave-debug.sh   # Brave起動スクリプト
```

## 🔧 設定ファイル

### launch.json
- **Launch Brave Extension**: 専用プロファイルで新しいBraveを起動
- **Attach to Brave Extension**: 既存のBraveプロセスに接続（ポート9222）
- **skipFiles**: React内部処理やVMファイルをスキップ

### vite.config.ts
- ソースマップ有効
- 圧縮無効（デバッグ用）
- Chrome拡張機能用プラグイン設定

## 🎯 デバッグのポイント

### ブレークポイントが灰色になる場合
1. `webRoot`の設定を確認（`${workspaceFolder}/src`）
2. ソースマップが正しく生成されているか確認
3. ビルド後のファイルパスを確認

### ポップアップが表示されない場合
1. `manifest.json`の`default_popup`パスを確認
2. ビルド後のファイル構造を確認

### React内部処理をスキップしたい場合
1. `debugger;`文を使用
2. `skipFiles`設定を活用
3. 条件付きブレークポイントを設定

## 🚨 トラブルシューティング

### 企業管理Chromeの制限
- Braveブラウザを使用して制限を回避
- 専用プロファイルで開発環境を分離

### デバッグ設定が認識されない
- ワークスペースを`chrome-extension-vite-sample`直下で開く
- `.vscode/launch.json`のパス設定を確認

### 拡張機能が読み込まれない
- `dist/`ディレクトリが存在するか確認
- `npm run build`を実行
- Braveの拡張機能ページでリロード

## 📝 開発メモ

### マイルストーン: デバッグ環境完成
- ✅ TypeScript + React + Vite環境構築
- ✅ Braveブラウザでのデバッグ対応
- ✅ Cursor/VSCodeでのブレークポイントデバッグ
- ✅ ソースマップ対応
- ✅ 専用プロファイルでの開発環境分離
- ✅ React内部処理のスキップ設定

## 📄 ライセンス

MIT License
