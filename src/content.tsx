/**
 * Content Script メインファイル
 * 環境変数により本番用/開発用機能を切り替え
 */

// 環境判定
const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true';

console.log('Content script loading...', { isDevelopment });

if (isDevelopment) {
  // 開発環境：テスト機能付きのContent Scriptを読み込み
  console.log('Loading development content script with test features...');
  import('./content-dev').then(() => {
    console.log('✅ Development content script loaded');
  }).catch(error => {
    console.error('❌ Failed to load development content script:', error);
  });
} else {
  // 本番環境：本番用のContent Scriptを読み込み
  console.log('Loading production content script...');
  import('./content-production').then(() => {
    console.log('✅ Production content script loaded');
  }).catch(error => {
    console.error('❌ Failed to load production content script:', error);
  });
}
