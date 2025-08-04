import { useState } from 'react';
import { createRoot } from 'react-dom/client';

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
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: '10000',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}
    >
      <div
        style={{
          background: '#007bff',
          color: 'white',
          padding: '8px',
          cursor: 'pointer'
        }}
        onClick={handleIncrement}
      >
        Count: {count}
      </div>
      <div
        style={{
          background: '#28a745',
          color: 'white',
          padding: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          textAlign: 'center'
        }}
        onClick={() => {
          void handleTestFiles();
        }}
      >
        Test All Files
      </div>
      <div
        style={{
          background: '#dc3545',
          color: 'white',
          padding: '8px',
          cursor: 'pointer',
          fontSize: '11px',
          textAlign: 'center'
        }}
        onClick={() => {
          void handleClearAuth();
        }}
      >
        Clear Auth
      </div>
      <div
        style={{
          background: '#6f42c1',
          color: 'white',
          padding: '8px',
          cursor: 'pointer',
          fontSize: '11px',
          textAlign: 'center'
        }}
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

// テスト関数をグローバルに公開（Background Scriptにメッセージを送信）
(window as any).testGoogleDriveConnection = async() => {
  try {
    console.log('testGoogleDriveConnection関数が呼び出されました');
    const response = await chrome.runtime.sendMessage({
      action: 'testGoogleDriveConnection'
    });
    console.log('テスト結果:', response);
    return response;
  } catch (error) {
    console.error('テスト実行エラー:', error);
    throw error;
  }
};

// デバッグ用：関数の存在確認
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
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 10px 15px;
    background: #4285f4;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  `;

  button.onclick = async() => {
    button.textContent = 'Testing...';
    button.disabled = true;
    
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'testGoogleDriveConnection'
      });
      
      console.log('Google Drive API テスト結果:', response);
      
      if (response.success) {
        button.textContent = '✅ Test Success';
        button.style.background = '#34a853';
        setTimeout(() => {
          button.textContent = 'Test Google Drive API';
          button.style.background = '#4285f4';
          button.disabled = false;
        }, 3000);
      } else {
        button.textContent = '❌ Test Failed';
        button.style.background = '#ea4335';
        setTimeout(() => {
          button.textContent = 'Test Google Drive API';
          button.style.background = '#4285f4';
          button.disabled = false;
        }, 3000);
      }
    } catch (error) {
      console.error('Google Drive APIテスト実行エラー:', error);
      button.textContent = '❌ Error';
      button.style.background = '#ea4335';
      setTimeout(() => {
        button.textContent = 'Test Google Drive API';
        button.style.background = '#4285f4';
        button.disabled = false;
      }, 3000);
    }
  };

  document.body.appendChild(button);
  console.log('Google Drive APIテストボタンを作成しました');
}

// 開発用アプリの初期化
function initializeDevApp() {
  const existing = document.getElementById('content-dev-app');
  if (existing) existing.remove();

  const root = document.createElement('div');
  root.id = 'dev-root';
  document.body.appendChild(root);
  
  const reactRoot = createRoot(root);
  reactRoot.render(<DevContentApp />);
}

// 開発用初期化
initializeDevApp();
createTestButton();

// メッセージ受信（開発用）
chrome.runtime.onMessage.addListener((message: { action: string; count?: number; selectionText?: string }) => {
  if (message.action === 'updateCount' && message.count !== undefined) {
    updateCount(message.count);
  }
  // 他のメッセージは本番用content scriptで処理
});

console.log('Development Content script ready with testing features');