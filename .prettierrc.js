export default {
  // セミコロンを文の末尾に自動追加
  semi: true,
  
  // ES5で有効な場所でのみ末尾カンマを追加（オブジェクト、配列など）
  trailingComma: 'es5',
  
  // 文字列をシングルクォートで囲む（ダブルクォートではなく）
  singleQuote: true,
  
  // 行の最大幅（80文字を超えると改行）
  printWidth: 80,
  
  // インデントの幅（1つのインデントは2スペース）
  tabWidth: 2,
  
  // タブではなくスペースを使用
  useTabs: false,
  
  // オブジェクトリテラルの括弧内にスペースを追加 { foo: bar }
  bracketSpacing: true,
  
  // JSXの閉じ括弧を改行して配置
  bracketSameLine: false,
  
  // アロー関数の単一パラメータで括弧を省略 param => {} の形式
  arrowParens: 'avoid',
  
  // 改行コードをUnix形式（LF）に統一
  endOfLine: 'lf',
}; 