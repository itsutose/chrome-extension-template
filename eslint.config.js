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
    extends: [
      js.configs.recommended,  // ESLintの推奨JavaScriptルール
    ],
    languageOptions: {
      ecmaVersion: 2020,  // ES2020の機能を使用可能
      globals: {
        ...globals.node,  // Node.jsのグローバル変数（process, __dirname等）
        process: 'readonly',  // processオブジェクトを読み取り専用として定義
      },
    },
    rules: {
      // 開発用スクリプトではconsole文を許可（デバッグ用）
      'no-console': 'off',
      'no-debugger': 'off',  // debugger文
      
      // 未使用変数を警告に変更（エラーではなく警告）
      'no-unused-vars': 'warn',
      'no-undef': 'error',    // 未定義変数はエラー
      
      // 基本的なフォーマットルール
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1, maxBOF: 0 }],  // 最大2行の空行まで許可
      'eol-last': 'error',    // ファイル末尾に改行を要求
      'no-trailing-spaces': 'error',  // 行末の空白を禁止
      'no-mixed-spaces-and-tabs': 'error',  // スペースとタブの混在を禁止
      
      // 重複インポートを禁止
      'no-duplicate-imports': 'error',
    },
  },
  
  /**
   * 4. TypeScript/TSXファイルの設定
   * src/ディレクトリ内のTypeScriptファイルに適用
   * 最も厳格な設定（型チェック含む）
   */
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,                    // ESLintの推奨JavaScriptルール
      tseslint.configs.recommended,              // TypeScript ESLintの推奨ルール
      tseslint.configs.recommendedTypeChecked,   // 型チェック付きの推奨ルール
      reactHooks.configs['recommended-latest'],  // React Hooksの最新推奨ルール
      reactRefresh.configs.vite,                 // Vite用のReact Fast Refreshルール
    ],
    languageOptions: {
      ecmaVersion: 2020,  // ES2020の機能を使用可能
      globals: {
        ...globals.browser,  // ブラウザのグローバル変数（window, document等）
        chrome: 'readonly',  // Chrome拡張機能APIを読み取り専用として定義
      },
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json'],  // TypeScript設定ファイル
        tsconfigRootDir: import.meta.dirname,  // 設定ファイルのルートディレクトリ
      },
    },
    rules: {
      // TypeScript固有のルール
      '@typescript-eslint/no-unused-vars': 'error',      // 未使用変数をエラー
      '@typescript-eslint/no-explicit-any': 'warn',      // any型の使用を警告
      '@typescript-eslint/no-non-null-assertion': 'warn', // !演算子の使用を警告
      
      // React Fast Refreshルール
      'react-refresh/only-export-components': 'warn',    // Fast refreshを警告に変更
      
      // 一般的なエラーハンドリング
      'no-debugger': 'warn',    // debugger文を警告
      'no-console': 'warn',      // console文を警告（開発中は許可）
      'no-alert': 'error',       // alert文をエラー
      
      // 変数宣言の推奨
      'prefer-const': 'error',   // constの使用を推奨
      'no-var': 'error',         // varの使用を禁止
      'no-let': 'off',           // letの使用は許可
      
      // 基本的なフォーマットルール（緩和版）
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1, maxBOF: 0 }],  // 最大2行の空行まで許可
      'eol-last': 'error',       // ファイル末尾に改行を要求
      'no-trailing-spaces': 'error',  // 行末の空白を禁止
      'no-mixed-spaces-and-tabs': 'error',  // スペースとタブの混在を禁止
      
      // オブジェクト・配列のスペースルール
      'object-curly-spacing': ['error', 'always'],  // オブジェクトリテラルの波括弧内にスペース
      'array-bracket-spacing': ['error', 'never'],  // 配列リテラルの角括弧内にスペースなし
      
      // 演算子のスペースルール
      'space-infix-ops': 'error',  // 演算子の前後にスペース
      
      // 追加の自動修正可能なルール
      'comma-spacing': ['error', { before: false, after: true }],  // カンマの後のスペース
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],  // オブジェクトキーのスペース
      'keyword-spacing': ['error', { before: true, after: true }],  // キーワードのスペース
      'space-before-blocks': 'error',  // ブロックの前のスペース
      'space-before-function-paren': ['error', 'never'],  // 関数名と括弧の間にスペースなし
      'space-in-parens': ['error', 'never'],  // 括弧内のスペース
      'space-unary-ops': ['error', { words: true, nonwords: false }],  // 単項演算子のスペース
      'indent': ['error', 2],  // インデント（2スペース）
      'quotes': ['error', 'single'],  // シングルクォート
      'semi': ['error', 'always'],  // セミコロン
      'comma-dangle': ['off', 'always-multiline'],  // マルチラインでの末尾カンマ
      'no-multi-spaces': 'error',  // 複数のスペース
      'no-irregular-whitespace': 'error',  // 不正な空白文字
      
      // インポート順序ルール（緩和版）
      'sort-imports': ['warn', {
        ignoreCase: false,           // 大文字小文字を区別
        ignoreDeclarationSort: false, // インポート宣言の順序をチェック
        ignoreMemberSort: false,     // メンバーの順序はチェック
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],  // メンバー構文の順序
        allowSeparatedGroups: true,  // グループ間の分離を許可
      }],
      
      // その他の一般的なルール
      'no-duplicate-imports': 'error',      // 重複インポートを禁止
      'no-unreachable': 'error',            // 到達不能コードをエラー
      'no-unreachable-loop': 'error',       // 到達不能ループをエラー
    },
  },
  
  /**
   * 5. アプリケーション用JavaScript/JSXファイルの設定
   * src/とpublic/ディレクトリ内のJavaScriptファイルに適用
   * TypeScriptファイルよりは緩いが、基本的な品質チェック
   */
  {
    files: ['src/**/*.{js,jsx}', 'public/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,                    // ESLintの推奨JavaScriptルール
      reactHooks.configs['recommended-latest'],  // React Hooksの最新推奨ルール
      reactRefresh.configs.vite,                 // Vite用のReact Fast Refreshルール
    ],
    languageOptions: {
      ecmaVersion: 2020,  // ES2020の機能を使用可能
      globals: {
        ...globals.browser,  // ブラウザのグローバル変数（window, document等）
        chrome: 'readonly',  // Chrome拡張機能APIを読み取り専用として定義
        process: 'readonly', // processオブジェクトを読み取り専用として定義
      },
    },
    rules: {
      // JavaScript固有のルール
      'no-unused-vars': 'error',  // 未使用変数をエラー
      'no-undef': 'error',        // 未定義変数をエラー
      
      // React Fast Refreshルール
      'react-refresh/only-export-components': 'warn',    // Fast refreshを警告に変更
      
      // 一般的なエラーハンドリング
      'no-debugger': 'error',     // debugger文をエラー
      'no-console': 'warn',       // console文を警告（開発中は許可）
      'no-alert': 'error',        // alert文をエラー
      
      // 変数宣言の推奨
      'prefer-const': 'error',    // constの使用を推奨
      'no-var': 'error',          // varの使用を禁止
      
      // 基本的なフォーマットルール（緩和版）
      'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1, maxBOF: 0 }],  // 最大2行の空行まで許可
      'eol-last': 'error',        // ファイル末尾に改行を要求
      'no-trailing-spaces': 'error',  // 行末の空白を禁止
      'no-mixed-spaces-and-tabs': 'error',  // スペースとタブの混在を禁止
      
      // オブジェクト・配列のスペースルール
      'object-curly-spacing': ['error', 'always'],  // オブジェクトリテラルの波括弧内にスペース
      'array-bracket-spacing': ['error', 'never'],  // 配列リテラルの角括弧内にスペースなし
      
      // 演算子のスペースルール
      'space-infix-ops': 'error',  // 演算子の前後にスペース
      
      // 追加の自動修正可能なルール
      'comma-spacing': ['error', { before: false, after: true }],  // カンマの後のスペース
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],  // オブジェクトキーのスペース
      'keyword-spacing': ['error', { before: true, after: true }],  // キーワードのスペース
      'space-before-blocks': 'error',  // ブロックの前のスペース
      'space-before-function-paren': ['error', 'never'],  // 関数名と括弧の間にスペースなし
      'space-in-parens': ['error', 'never'],  // 括弧内のスペース
      'space-unary-ops': ['error', { words: true, nonwords: false }],  // 単項演算子のスペース
      'indent': ['error', 2],  // インデント（2スペース）
      'quotes': ['error', 'single'],  // シングルクォート
      'semi': ['error', 'always'],  // セミコロン
      'comma-dangle': ['error', 'always-multiline'],  // マルチラインでの末尾カンマ
      'no-multi-spaces': 'error',  // 複数のスペース
      'no-irregular-whitespace': 'error',  // 不正な空白文字
      
      // インポート順序ルール（緩和版）
      'sort-imports': ['warn', {
        ignoreCase: false,           // 大文字小文字を区別
        ignoreDeclarationSort: true, // インポート宣言の順序は無視
        ignoreMemberSort: false,     // メンバーの順序はチェック
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],  // メンバー構文の順序
        allowSeparatedGroups: true,  // グループ間の分離を許可
      }],
      
      // その他の一般的なルール
      'no-duplicate-imports': 'error',      // 重複インポートを禁止
      'no-unreachable': 'error',            // 到達不能コードをエラー
      'no-unreachable-loop': 'error',       // 到達不能ループをエラー
    },
  },
])
