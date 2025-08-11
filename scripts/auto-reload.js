#!/usr/bin/env node

import { exec } from 'child_process';
import { watch } from 'fs';
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

// 拡張機能をリロードする関数
function reloadExtension() {
  if (isReloading) return;

  isReloading = true;
  console.log('🔄 Reloading extension...');

  // ビルド前にディレクトリを削除
  exec('rm -rf dist/*', { cwd: projectRoot }, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Directory deletion failed:', error);
    }
  });

  // ビルドを実行
  exec('npm run build:extension', { cwd: projectRoot }, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Build failed:', error);
      isReloading = false;
      return;
    }

    console.log('✅ Build completed');

    // Chrome拡張機能をリロード
    exec('osascript -e \'tell application "Brave Browser" to activate\'', () => {
      console.log('🔄 Extension reloaded. Please refresh the extension in Brave Browser.');
      console.log('   - Right-click on the extension icon');
      console.log('   - Select "Remove from Brave Browser"');
      console.log('   - Then reload the extension from chrome://extensions/');
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
      reloadExtension();
    }, 1000); // 1秒のデバウンス
  });
}

// メイン処理
console.log('🚀 Starting auto-reload for Chrome Extension...');
console.log('📁 Project root:', projectRoot);

// 各ディレクトリを監視
WATCH_DIRS.forEach(dir => {
  const fullPath = join(projectRoot, dir);
  watchDirectory(fullPath);
});

console.log('✅ Auto-reload is active!');
console.log('   Press Ctrl+C to stop');

// エラーハンドリング
process.on('SIGINT', () => {
  console.log('\n👋 Stopping auto-reload...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});
