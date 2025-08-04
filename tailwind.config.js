/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.html",
  ],
  theme: {
    extend: {
      // Chrome拡張機能用のカスタムテーマ
      colors: {
        'extension-bg': '#f8fafc',
        'extension-border': '#e2e8f0',
        'memo-bg': '#ffffff',
        'memo-shadow': 'rgba(0, 0, 0, 0.1)',
      },
      fontSize: {
        'memo': ['14px', '20px'],
      },
      borderRadius: {
        'memo': '8px',
      },
      boxShadow: {
        'memo': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'memo-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      zIndex: {
        'memo': '10000',
        'memo-modal': '10001',
      },
    },
  },
  plugins: [],
}