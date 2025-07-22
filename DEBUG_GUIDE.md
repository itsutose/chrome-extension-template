# Chrome Extension Debug Guide

## 統合デバッグ設定

このプロジェクトでは、Content ScriptとPopupを同時にデバッグできる統合設定を提供しています。

### デバッグ設定の種類

1. **🔧 Debug Extension (Content + Popup)** - 統合デバッグ（推奨）
2. **🔧 Debug Extension (Attach Mode)** - アタッチモード
3. **🐛 Debug Content Script** - Content Script専用
4. **🚀 Launch Brave Extension** - 基本設定

### 統合デバッグの使用方法

#### 1. 統合デバッグの開始
1. VS Codeで "🔧 Debug Extension (Content + Popup)" を選択
2. デバッグを開始
3. ブラウザが開き、拡張機能が読み込まれる

#### 2. ブレークポイントの設定
- **Content Script**: `src/content.tsx` にブレークポイントを設定
- **Popup**: `src/popup.tsx` にブレークポイントを設定
- **Background**: `src/background.ts` にブレークポイントを設定

#### 3. デバッグの実行
1. **Popupのデバッグ**:
   - 拡張機能アイコンをクリック
   - Popupが開くとブレークポイントで停止

2. **Content Scriptのデバッグ**:
   - 任意のWebページに移動
   - Content Scriptが読み込まれるとブレークポイントで停止

3. **同時デバッグ**:
   - PopupとContent Scriptの両方にブレークポイントを設定
   - 両方のコンテキストで同時にデバッグ可能

4. **backgroundのデバッグ**
   - popup, content で処理を進めていくといつかdevtool の Sources で background が現れる
   - devtool側でブレークポイントを設定した部分で停止させられる

#### 従来の分離デバッグとの違い
- **分離デバッグ**: 各コンポーネントを個別にデバッグ
- **統合デバッグ**: 全体を統合的にデバッグ

### トラブルシューティング

#### ブレークポイントが動作しない場合
1. 拡張機能を再ビルド: `npm run build`
2. ブラウザを再起動
3. デバッグセッションを再開始

#### ソースマップの問題
1. `vite.config.ts`で`sourcemap: 'inline'`が設定されていることを確認
2. ビルド出力の`dist`フォルダに`.map`ファイルが生成されていることを確認

### 推奨ワークフロー

1. **開発開始時**:
   - "🔧 Debug Extension (Content + Popup)" でデバッグ開始
   - 主要なコンポーネントにブレークポイントを設定

2. **開発中**:
   - コードを変更
   - 自動リロードで変更を確認
   - ブレークポイントで動作を確認

3. **問題解決時**:
   - 統合デバッグで全体の流れを把握
   - 必要に応じて個別デバッグを使用

### 注意事項

- Background Scriptは別のプロセスで動作するため、統合デバッグには含まれません
- メッセージ通信のデバッグは、統合デバッグで最も効果的です
- パフォーマンスの問題がある場合は、個別デバッグを使用してください 