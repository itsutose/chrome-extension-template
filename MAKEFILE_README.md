# Makefile for Chrome Extension Lint Operations

このプロジェクトには、lint操作を簡単に実行するための包括的なMakefileが含まれています。

## 🚀 基本コマンド

### ヘルプ表示
```bash
make help
```
利用可能な全コマンドとその説明を表示します。

### 基本的なlint操作
```bash
# lintエラーの確認（修正なし）
make lint-check

# 自動修正可能な問題を修正
make lint-fix

# 全ファイルのlint（自動修正付き）
make lint-all
```

## 📁 ディレクトリ別lint

### srcディレクトリ（TypeScript/TSXファイル）
```bash
make lint-src
```
`src/`ディレクトリ内の`.ts`と`.tsx`ファイルのみをlintします。

### scriptsディレクトリ（JavaScriptファイル）
```bash
make lint-scripts
```
`scripts/`ディレクトリ内の`.js`と`.jsx`ファイルのみをlintします。

### publicディレクトリ（JavaScriptファイル）
```bash
make lint-public
```
`public/`ディレクトリ内の`.js`と`.jsx`ファイルのみをlintします。

## 📄 ファイル別lint

### 特定ファイルのlint
```bash
make lint-file FILE=src/popup.tsx
```
指定したファイルのみをlintします。

**使用例:**
```bash
make lint-file FILE=src/background.ts
make lint-file FILE=src/content.ts
make lint-file FILE=src/App.tsx
```

## 🔍 高度なlint操作

### 詳細なlintレポート
```bash
make lint-detail
```
lintエラーの詳細なレポートを表示します。

### 未修正の問題のみ表示
```bash
make lint-unfixed
```
自動修正できない問題のみを表示します。

### 現在のlintルール設定確認
```bash
make lint-rules
```
現在適用されているESLintルールの設定を確認します。

### ファイル変更監視
```bash
make lint-watch
```
ファイル変更を監視し、変更があった場合に自動でlintを実行します。
`Ctrl+C`で停止できます。

## 🛠️ ユーティリティコマンド

### 依存関係の確認
```bash
make check-deps
```
必要なESLint関連の依存関係がインストールされているか確認します。

### 一時ファイルの削除
```bash
make clean
```
`.log`ファイルや`.eslintcache`などの一時ファイルを削除します。

### 設定ファイルのバックアップ
```bash
make backup-config
```
現在のESLint設定ファイル（`eslint.config.js`）をタイムスタンプ付きでバックアップします。

### 設定ファイルの復元
```bash
make restore-config
```
最新のバックアップからESLint設定ファイルを復元します。

## 📋 使用例

### 開発時の一般的なワークフロー
```bash
# 1. 現在のlint状況を確認
make lint-check

# 2. 自動修正可能な問題を修正
make lint-fix

# 3. 残りの問題を確認
make lint-unfixed

# 4. 特定ファイルを修正
make lint-file FILE=src/popup.tsx
```

### 新機能開発時
```bash
# 1. ファイル変更を監視しながら開発
make lint-watch

# 2. 開発完了後、全体をlint
make lint-all
```

### 設定変更時
```bash
# 1. 現在の設定をバックアップ
make backup-config

# 2. 設定を変更してテスト
# ... 設定ファイルを編集 ...

# 3. 問題があれば復元
make restore-config
```

## 🎨 出力の色分け

Makefileは見やすい色分けを使用しています：
- 🟢 **緑色**: 成功メッセージ、進行状況
- 🟡 **黄色**: 警告、注意事項
- 🔴 **赤色**: エラー、重要な問題

## ⚠️ トラブルシューティング

### 権限エラー
```bash
chmod +x Makefile
```

### makeコマンドが見つからない
**macOS (Homebrew):**
```bash
brew install make
```

**Ubuntu/Debian:**
```bash
sudo apt-get install make
```

**CentOS/RHEL:**
```bash
sudo yum install make
```

### ESLintエラー
```bash
# 依存関係を確認
make check-deps

# 必要に応じて再インストール
npm install
```

### パターンマッチングエラー
特定のディレクトリでlintが失敗する場合：
```bash
# ファイルの存在確認
ls -la src/
ls -la scripts/

# 手動でESLintを実行して確認
npx eslint src/
```

## 🔧 カスタマイズ

### 新しいlintターゲットの追加
Makefileに新しいターゲットを追加できます：

```makefile
## カスタムlintターゲット
lint-custom: ## カスタムlint操作
	@echo "$(GREEN)Custom lint operation...$(NC)"
	@npx eslint your-custom-pattern --fix
```

### 変数の変更
Makefileの上部で変数を変更できます：

```makefile
# 変数定義
SRC_DIR := src
SCRIPTS_DIR := scripts
PUBLIC_DIR := public
EXTENSIONS := ts,tsx,js,jsx
```

## 📊 現在のlint状況

プロジェクトの現在のlint状況：
- **自動修正可能**: 32件
- **手動修正必要**: 24件（主にconsole文と未使用変数）

### 残っている主な問題
1. **console文**: デバッグ用のconsole.log文
2. **未使用変数**: 定義されているが使用されていない変数
3. **重複import**: 同じモジュールの重複インポート

## 🎯 ベストプラクティス

### 開発時の推奨ワークフロー
1. **開発開始前**: `make lint-check`で現在の状況を確認
2. **開発中**: `make lint-watch`でリアルタイムlint
3. **コミット前**: `make lint-fix`で自動修正
4. **最終確認**: `make lint-unfixed`で残りの問題を確認

### チーム開発での活用
- プルリクエスト前に`make lint-check`を実行
- CI/CDパイプラインに`make lint-check`を組み込み
- コードレビュー時に`make lint-detail`の結果を共有

## 📝 注意事項

- **自動修正**: `--fix`オプションは安全ですが、重要な変更の前にバックアップを取ることを推奨
- **ファイル監視**: `lint-watch`は大量のファイルがある場合にパフォーマンスに影響する可能性
- **設定変更**: 重要な設定変更前には必ず`make backup-config`を実行

## 🔗 関連ファイル

- `Makefile`: メインのMakefile
- `eslint.config.js`: ESLint設定ファイル
- `package.json`: 依存関係とスクリプト定義
- `tsconfig.json`: TypeScript設定ファイル 