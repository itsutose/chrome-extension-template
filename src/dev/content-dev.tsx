import { createRoot } from 'react-dom/client';
import { useState } from 'react';

import { debugDriveAPI, testDetailedFileList } from './driveAPITest';
import { clearAuthToken } from '../features/auth/oauth';

/**
 * 開発・テスト専用のContent Script
 * 本番環境では読み込まれない
 */

// カウントコンポーネント（テスト機能付き）
function CountComponent() {
  const [count, setCount] = useState(0);
  
  const handleIncrement = () => {
    setCount(count + 1);
  };

  const handleTestFiles = async() => {
    await testDetailedFileList();
  };

  const handleClearAuth = async() => {
    await clearAuthToken();
    // Chrome拡張のキャッシュもクリア
    if (chrome?.identity?.clearAllCachedAuthTokens) {
      chrome.identity.clearAllCachedAuthTokens(() => {
        console.log('全認証キャッシュをクリアしました');
        console.log('認証キャッシュをクリアしました。次回のテストで新しい権限で認証されます。');
      });
    }
  };

  const handleDebugAPI = async() => {
    await debugDriveAPI();
  };
  
  return (
    <div className="fixed top-2.5 right-2.5 z-[10000] flex flex-col gap-1">
      <div
        className="bg-blue-500 text-white p-2 cursor-pointer"
        onClick={handleIncrement}
      >
        Count: {count}
      </div>
      <div
        className="bg-green-500 text-white p-2 cursor-pointer text-xs text-center"
        onClick={() => {
          void handleTestFiles();
        }}
      >
        Test All Files
      </div>
      <div
        className="bg-red-500 text-white p-2 cursor-pointer text-xs text-center"
        onClick={() => {
          void handleClearAuth();
        }}
      >
        Clear Auth
      </div>
      <div
        className="bg-purple-500 text-white p-2 cursor-pointer text-xs text-center"
        onClick={() => {
          void handleDebugAPI();
        }}
      >
        Debug API
      </div>
    </div>
  );
}

// 開発用アプリコンポーネント
function DevContentApp() {
  return (
    <div id="content-dev-app">
      <CountComponent />
    </div>
  );
}

// 外部からのカウント更新（テスト用）
function updateCount(newCount: number) {
  // Reactの状態を更新するロジック
  console.log('Updating count to:', newCount);
}

(window as any).testGoogleDriveConnection = async() => {
  try {
    console.log('testGoogleDriveConnection関数が呼び出されました');
    const response = await chrome.runtime.sendMessage({
      action: 'testGoogleDriveConnection'
    }) as unknown;
    console.log('テスト結果:', response);
    return response;
  } catch (error) {
    console.error('テスト実行エラー:', error);
    throw error;
  }
};

(window as any).checkTestFunction = () => {
  console.log('testGoogleDriveConnection関数の存在確認:');
  console.log('typeof testGoogleDriveConnection:', typeof (window as any).testGoogleDriveConnection);
  console.log('window.testGoogleDriveConnection:', (window as any).testGoogleDriveConnection);
  console.log('globalThis.testGoogleDriveConnection:', (globalThis as any).testGoogleDriveConnection);
};

// Google Drive APIテスト用ボタンを作成
function createTestButton() {
  // 既存のボタンがあれば削除
  const existingButton = document.getElementById('google-drive-test-button');
  if (existingButton) {
    existingButton.remove();
  }

  const button = document.createElement('button');
  button.id = 'google-drive-test-button';
  button.textContent = 'Test Google Drive API';
  button.className = `
    fixed top-5 right-5 z-[10000] px-4 py-2.5 bg-blue-500 text-white border-none rounded cursor-pointer
    font-sans text-sm shadow-lg
  `.trim().replace(/\s+/g, ' ');

  button.onclick = async() => {
    button.textContent = 'Testing...';
    button.disabled = true;
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'testGoogleDriveConnection'
      }) as { success: boolean };
      
      console.log('Google Drive API テスト結果:', response);
      
      if (response.success) {
        button.textContent = '✅ Test Success';
        button.className = button.className.replace('bg-blue-500', 'bg-green-500');
        setTimeout(() => {
          button.textContent = 'Test Google Drive API';
          button.className = button.className.replace('bg-green-500', 'bg-blue-500');
          button.disabled = false;
        }, 3000);
      } else {
        button.textContent = '❌ Test Failed';
        button.className = button.className.replace('bg-blue-500', 'bg-red-500');
        setTimeout(() => {
          button.textContent = 'Test Google Drive API';
          button.className = button.className.replace('bg-red-500', 'bg-blue-500');
          button.disabled = false;
        }, 3000);
      }
    } catch (error) {
      console.error('Google Drive APIテスト実行エラー:', error);
      button.textContent = '❌ Error';
      button.className = button.className.replace('bg-blue-500', 'bg-red-500');
      setTimeout(() => {
        button.textContent = 'Test Google Drive API';
        button.className = button.className.replace('bg-red-500', 'bg-blue-500');
        button.disabled = false;
      }, 3000);
    }
  };

  document.body.appendChild(button);
  console.log('Google Drive APIテストボタンを作成しました');
}

function initializeDevApp() {
  const existing = document.getElementById('content-dev-app');
  if (existing) existing.remove();

  const root = document.createElement('div');
  root.id = 'dev-root';
  document.body.appendChild(root);
  
  const reactRoot = createRoot(root);
  reactRoot.render(<DevContentApp />);
}

export function initializeDevFeatures() {
  console.log("Initializing dev features UI...");
  initializeDevApp();
  createTestButton();
}

// メッセージ受信は残しても良いが、content.tsx側で一元管理する方がベター
chrome.runtime.onMessage.addListener((message: { action: string; count?: number; selectionText?: string }) => {
  if (message.action === 'updateCount' && message.count !== undefined) {
    updateCount(message.count);
  }
});

console.log('Development Content script module loaded');
