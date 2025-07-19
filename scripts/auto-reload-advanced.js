#!/usr/bin/env node

import { exec } from 'child_process';
import { readFileSync, watch } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// 監視対象のディレクトリ
const WATCH_DIRS = [
  'src',
  'public'
];

// 除外するファイル
const IGNORE_PATTERNS = [
  /\.git/,
  /node_modules/,
  /dist/,
  /\.DS_Store/
];

let isReloading = false;
let reloadTimeout = null;

// 拡張機能IDを取得する関数
function getExtensionId() {
  try {
    const manifestPath = join(projectRoot, 'dist', 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));


    // 開発モードでは拡張機能IDは動的に生成されるため、
    // chrome://extensions/で確認する必要があります
    return null;
  } catch (error) {
    console.log('⚠️  Could not read manifest.json, extension ID will be detected automatically');
    return null;
  }
}

// Chrome拡張機能をリロードする関数（より高度な版）
function reloadExtensionAdvanced() {
  if (isReloading) return;

  isReloading = true;
  console.log('🔄 Reloading extension...');

  // ビルドを実行
  exec('npm run build:extension', { cwd: projectRoot }, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Build failed:', error);
      isReloading = false;
      return;
    }

    console.log('✅ Build completed');

    // Brave Browserをアクティブにして拡張機能ページを開く
    const appleScript = `
      tell application "Brave Browser"
        activate
        delay 1
        tell application "System Events"
          keystroke "t" using command down
          delay 0.5
          keystroke "chrome://extensions/"
          delay 0.5
          key code 36
          delay 1
          -- 拡張機能のリロードボタンをクリック（位置は環境によって異なる場合があります）
          -- この部分は手動でリロードボタンをクリックする必要があります
        end tell
      end tell
    `;

    exec(`osascript -e '${appleScript}'`, (error) => {
      if (error) {
        console.log('⚠️  Could not automatically reload extension');
        console.log('   Please manually reload the extension:');
        console.log('   1. Go to chrome://extensions/');
        console.log('   2. Find your extension');
        console.log('   3. Click the reload button (🔄)');
      } else {
        console.log('🔄 Extension reload initiated');
        console.log('   Please click the reload button (🔄) on chrome://extensions/');
      }
    });

    isReloading = false;
  });
}

// ファイル変更を監視する関数
function watchDirectory(dirPath) {
  console.log(`👀 Watching directory: ${dirPath}`);

  watch(dirPath, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    // 除外パターンをチェック
    if (IGNORE_PATTERNS.some(pattern => pattern.test(filename))) {
      return;
    }

    console.log(`📝 File changed: ${filename}`);

    // デバウンス処理（連続した変更をまとめる）
    if (reloadTimeout) {
      clearTimeout(reloadTimeout);
    }

    reloadTimeout = setTimeout(() => {
      reloadExtensionAdvanced();
    }, 1000); // 1秒のデバウンス
  });
}

// メイン処理
console.log('🚀 Starting advanced auto-reload for Chrome Extension...');
console.log('📁 Project root:', projectRoot);

// 各ディレクトリを監視
WATCH_DIRS.forEach(dir => {
  const fullPath = join(projectRoot, dir);
  watchDirectory(fullPath);
});

console.log('✅ Advanced auto-reload is active!');
console.log('   Press Ctrl+C to stop');
console.log('   Note: You may need to manually click the reload button on chrome://extensions/');

// エラーハンドリング
process.on('SIGINT', () => {
  console.log('\n👋 Stopping auto-reload...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});
