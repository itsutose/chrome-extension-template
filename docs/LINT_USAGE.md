# ESLint自動修正機能の使用方法

## 概要
このプロジェクトでは、ESLintの自動修正機能を効率的に使用できるよう、複数の方法を提供しています。

## 自動保存機能
- **自動保存**: ファイルの変更後1秒で自動保存されます
- **保存時の自動修正**: 保存時にESLintの自動修正が実行されます
- **フォーマット**: Prettierによる自動フォーマットも同時に実行されます

## 自動保存機能
- **自動保存**: ファイルの変更後1秒で自動保存されます
- **保存時の自動修正**: 保存時にESLintの自動修正が実行されます
- **フォーマット**: Prettierによる自動フォーマットも同時に実行されます

## コマンドラインでの使用

### 基本的なlintコマンド
```bash
# lintエラーの確認（修正なし）
make lint-check

# 厳格lintエラーの確認（修正なし）
make lint-check-strict

# 自動修正付きlint
make lint-fix

# 厳格自動修正付きlint
make lint-fix-strict

# 特定ファイルのlint修正
make lint-file FILE=src/popup.tsx

# 特定ファイルの厳格lint修正
make lint-file-strict FILE=src/popup.tsx

# 全ファイルのlint修正
make lint-all

# 全ファイルの厳格lint修正
make lint-all-strict
```

### npmスクリプト
```bash
# 基本的なlint
npm run lint

# 厳格lint
npm run lint:strict

# 自動修正付きlint
npm run lint:fix

# 厳格自動修正付きlint
npm run lint:fix:strict
```

## パフォーマンス最適化

### キャッシュ機能
- ESLintのキャッシュが有効化されており、2回目以降の実行が高速化されます
- キャッシュファイル: `.eslintcache`

### 最適化された設定
- 重いルール（sort-imports等）を無効化
- 並列処理の有効化
- リアルタイムlint実行

### 厳格モード
- `--max-warnings 0`オプションにより、警告がある場合はエラーとして扱います
- 警告を完全に排除したい場合に使用
- 通常の開発では通常モード（警告を許可）の方が実用的

## 設定ファイル

### VSCode/Cursor設定
- `.vscode/settings.json`: エディタの動作設定
- `.vscode/keybindings.json`: キーボードショートカット

### ESLint設定
- `eslint.config.js`: ESLintのルール設定
- `.prettierrc.js`: Prettierのフォーマット設定

## トラブルシューティング

### lintが遅い場合
1. キャッシュをクリア: `make clean`
2. 高速lintを使用: `make lint-check-fast`
3. 特定ファイルのみlint: `make lint-file FILE=ファイル名`

### 自動修正が動作しない場合
1. VSCode/CursorのESLint拡張機能が有効か確認
2. 設定ファイルの構文エラーを確認
3. ターミナルで`npm run lint:fix`を実行して動作確認

### 自動修正が動作しない場合
1. VSCode/CursorのESLint拡張機能が有効か確認
2. 設定ファイルの構文エラーを確認
3. ターミナルで`npm run lint:fix`を実行して動作確認 