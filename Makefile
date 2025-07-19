# Chrome Extension Lint Makefile
# 使用方法: make [ターゲット]

# デフォルトターゲット
.DEFAULT_GOAL := help

# 変数定義
SRC_DIR := src
SCRIPTS_DIR := scripts
PUBLIC_DIR := public
EXTENSIONS := ts,tsx,js,jsx

# 色付き出力用
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color

.PHONY: help lint lint-fix lint-check lint-src lint-scripts lint-all clean

## ヘルプ表示
help: ## 利用可能なコマンドを表示
	@echo "$(GREEN)Chrome Extension Lint Commands:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(GREEN)Examples:$(NC)"
	@echo "  make lint-check    # lintエラーの確認"
	@echo "  make lint-fix      # 自動修正可能な問題を修正"
	@echo "  make lint-src      # srcディレクトリのみlint"
	@echo "  make lint-scripts  # scriptsディレクトリのみlint"

## lintエラーの確認（修正なし）
lint-check: ## lintエラーの確認
	@echo "$(GREEN)Checking lint errors...$(NC)"
	@npm run lint

## 自動修正付きlint
lint-fix: ## 自動修正可能な問題を修正
	@echo "$(GREEN)Fixing lint errors automatically...$(NC)"
	@npm run lint -- --fix

## srcディレクトリのみlint
lint-src: ## srcディレクトリのファイルのみlint
	@echo "$(GREEN)Linting src directory...$(NC)"
	@npx eslint $(SRC_DIR)/**/*.{ts,tsx} --fix

## scriptsディレクトリのみlint
lint-scripts: ## scriptsディレクトリのファイルのみlint
	@echo "$(GREEN)Linting scripts directory...$(NC)"
	@npx eslint $(SCRIPTS_DIR)/**/*.{js,jsx} --fix

## publicディレクトリのみlint
lint-public: ## publicディレクトリのファイルのみlint
	@echo "$(GREEN)Linting public directory...$(NC)"
	@npx eslint $(PUBLIC_DIR)/**/*.{js,jsx} --fix

## 特定ファイルのlint
lint-file: ## 特定ファイルのlint（使用方法: make lint-file FILE=src/popup.tsx）
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)Error: FILE parameter is required$(NC)"; \
		echo "Usage: make lint-file FILE=src/popup.tsx"; \
		exit 1; \
	fi
	@echo "$(GREEN)Linting file: $(FILE)$(NC)"
	@npx eslint $(FILE) --fix

## 全ファイルのlint（自動修正付き）
lint-all: ## 全ファイルのlint（自動修正付き）
	@echo "$(GREEN)Linting all files with auto-fix...$(NC)"
	@npx eslint . --fix

## lintエラーの詳細表示
lint-detail: ## lintエラーの詳細表示
	@echo "$(GREEN)Detailed lint report...$(NC)"
	@npm run lint -- --format=stylish

## 特定のlintルールの確認
lint-rules: ## 現在のlintルール設定を確認
	@echo "$(GREEN)Current ESLint configuration:$(NC)"
	@npx eslint --print-config src/popup.tsx | head -20

## 未修正の問題のみ表示
lint-unfixed: ## 自動修正できない問題のみ表示
	@echo "$(YELLOW)Problems that cannot be auto-fixed:$(NC)"
	@npm run lint -- --fix --quiet

## 開発用：watchモードでlint
lint-watch: ## ファイル変更を監視してlint実行
	@echo "$(GREEN)Watching for file changes and running lint...$(NC)"
	@echo "$(YELLOW)Press Ctrl+C to stop$(NC)"
	@npx chokidar "$(SRC_DIR)/**/*.{$(EXTENSIONS)}" -c "make lint-src"

## クリーンアップ
clean: ## 一時ファイルの削除
	@echo "$(GREEN)Cleaning up...$(NC)"
	@find . -name "*.log" -delete
	@find . -name ".eslintcache" -delete

## インストール確認
check-deps: ## 必要な依存関係の確認
	@echo "$(GREEN)Checking dependencies...$(NC)"
	@npm list eslint --depth=0 || echo "$(YELLOW)ESLint not found$(NC)"
	@npm list typescript-eslint --depth=0 || echo "$(YELLOW)TypeScript ESLint not found$(NC)"
	@npm list eslint-plugin-react-hooks --depth=0 || echo "$(YELLOW)React Hooks plugin not found$(NC)"
	@npm list eslint-plugin-react-refresh --depth=0 || echo "$(YELLOW)React Refresh plugin not found$(NC)"

## 設定ファイルのバックアップ
backup-config: ## ESLint設定ファイルのバックアップ
	@echo "$(GREEN)Backing up ESLint configuration...$(NC)"
	@cp eslint.config.js eslint.config.js.backup.$$(date +%Y%m%d_%H%M%S)

## 設定ファイルの復元
restore-config: ## バックアップからESLint設定を復元
	@echo "$(GREEN)Restoring ESLint configuration...$(NC)"
	@ls -la eslint.config.js.backup.* 2>/dev/null || (echo "$(RED)No backup files found$(NC)" && exit 1)
	@cp eslint.config.js.backup.$$(ls eslint.config.js.backup.* | tail -1 | sed 's/.*backup\.//') eslint.config.js
	@echo "$(GREEN)Configuration restored$(NC)"

## Prettier関連コマンド

## Prettierでコード整形
prettier-format: ## Prettierでコード整形
	@echo "$(GREEN)Formatting code with Prettier...$(NC)"
	@npx prettier --write .

## Prettierで特定ファイルを整形
prettier-format-file: ## 特定ファイルをPrettierで整形（使用方法: make prettier-format-file FILE=src/popup.tsx）
	@if [ -z "$(FILE)" ]; then \
		echo "$(RED)Error: FILE parameter is required$(NC)"; \
		echo "Usage: make prettier-format-file FILE=src/popup.tsx"; \
		exit 1; \
	fi
	@echo "$(GREEN)Formatting file with Prettier: $(FILE)$(NC)"
	@npx prettier --write $(FILE)

## Prettierで整形チェック（修正なし）
prettier-check: ## Prettierで整形チェック（修正なし）
	@echo "$(GREEN)Checking code formatting with Prettier...$(NC)"
	@npx prettier --check .

## Prettier設定の確認
prettier-config: ## 現在のPrettier設定を確認
	@echo "$(GREEN)Current Prettier configuration:$(NC)"
	@cat .prettierrc.js

## ESLint + Prettierの統合実行
format-all: ## ESLintとPrettierを順次実行
	@echo "$(GREEN)Running ESLint and Prettier...$(NC)"
	@make lint-fix
	@make prettier-format
	@echo "$(GREEN)Formatting complete!$(NC)" 