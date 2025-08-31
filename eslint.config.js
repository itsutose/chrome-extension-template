/**
 * ESLint設定ファイル (フラット設定形式) - 最適化版
 * 
 * このファイルは、Chrome拡張機能プロジェクト用のESLint設定です。
 * フラット設定形式（ESLint v9以降）を使用しており、ファイルタイプ別に
 * 異なるルールを適用しています。
 * 
 * パフォーマンス最適化:
 * - キャッシュ機能を有効化
 * - 並列処理を有効化
 * - 不要なルールを無効化
 */

// ESLintの基本設定とプラグインのインポート
import js from '@eslint/js'; // ESLintの推奨JavaScriptルール
import prettierConfig from 'eslint-config-prettier'; // prettierとの競合を回避
import reactHooks from 'eslint-plugin-react-hooks'; // React Hooks用のルール
import reactRefresh from 'eslint-plugin-react-refresh'; // React Fast Refresh用のルール
import { globalIgnores } from 'eslint/config'; // グローバル除外設定
import globals from 'globals'; // グローバル変数の定義
import tseslint from 'typescript-eslint'; // TypeScript用のESLint設定

/**
 * メイン設定オブジェクト
 * 複数の設定オブジェクトを配列で定義し、ファイルパターンに応じて適用
 */
export default tseslint.config([
  
  /**
   * 1. グローバル除外設定
   * これらのディレクトリ・ファイルはESLintの対象外
   */
  globalIgnores([
    'dist',        // ビルド出力ディレクトリ
    'node_modules', // npmパッケージディレクトリ
    '.vscode',     // VSCode設定ディレクトリ（外部ファイルが含まれるため）
    '.eslintcache', // ESLintキャッシュファイル
    '*.cache',     // その他のキャッシュファイル
  ]),
  
  /**
   * 2. ESLint設定ファイル自体のルール
   * このファイル（eslint.config.js）にのみ適用される設定
   */
  {
    files: ['eslint.config.js'],
    rules: {
      // インポート順序のルールを無効化（設定ファイルでは不要）
      'sort-imports': 'off',
    },
  },
  
  /**
   * 3. 開発用スクリプトファイルの設定
   * scripts/ディレクトリ内のJavaScriptファイルに適用
   * 開発用ツールなので、比較的緩い設定
   */
  {
    files: ['scripts/**/*.{js,jsx}'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      'no-console': 'off',
      'no-debugger': 'off',
      'no-unused-vars': 'warn',
    },
  },
  
  /**
     * 4. TypeScript/TSXファイルの設定 (src/**)
     * - これがメインの設定
     */
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs['recommended-latest'],
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        chrome: 'readonly',
      },
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      // --- ここからが重要 ---
      // Prettierに任せるフォーマット関連のルールは全て削除し、
      // コードの品質に関するルールのみを残す。

      // React Fast Refreshルール
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // TypeScript固有の品質ルール
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      
      // 一般的な品質・バグ防止ルール
      'no-debugger': 'warn', // debugger文は警告
      'no-console': ['warn', { allow: ['warn', 'error'] }], // console.logは警告
      'prefer-const': 'error', // constの使用を推奨
      'no-var': 'error', // varの使用を禁止
      'no-unreachable': 'error', // 到達不能コードをエラー
    },
  },

  
  /**
   * 5. Prettierとの競合ルールを無効化する設定 (最重要)
   * - この設定は必ず配列の最後に配置する
   */
  prettierConfig,
]);