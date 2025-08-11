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
  const [googleDriveTestStatus, setGoogleDriveTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  
  const handleIncrement = () => {
    setCount(count + 1);
  };

  const handleTestGoogleDriveAPI = async() => {
    setGoogleDriveTestStatus('testing');
    
    try {
      const response: unknown = await chrome.runtime.sendMessage({
        action: 'testGoogleDriveConnection'
      });
      
      console.log('Google Drive API テスト結果:', response);
      
      if (response && typeof response === 'object' && 'success' in response && 
          typeof (response as { success: boolean }).success === 'boolean' && 
          (response as { success: boolean }).success) {
        console.log('✅ Google Drive API テスト成功');
        setGoogleDriveTestStatus('success');
        // 3秒後に元の状態に戻す
        setTimeout(() => setGoogleDriveTestStatus('idle'), 3000);
      } else {
        console.log('❌ Google Drive API テスト失敗');
        setGoogleDriveTestStatus('error');
        setTimeout(() => setGoogleDriveTestStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Google Drive APIテスト実行エラー:', error);
      setGoogleDriveTestStatus('error');
      setTimeout(() => setGoogleDriveTestStatus('idle'), 3000);
    }
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
        className={`text-white p-2 cursor-pointer text-xs text-center ${
          googleDriveTestStatus === 'testing'
            ? 'bg-yellow-500'
            : googleDriveTestStatus === 'success'
              ? 'bg-green-500'
              : googleDriveTestStatus === 'error'
                ? 'bg-red-500'
                : 'bg-blue-500'
        }`}
        onClick={() => {
          if (googleDriveTestStatus === 'testing') return; // テスト中は無効化
          void handleTestGoogleDriveAPI();
        }}
      >
        {googleDriveTestStatus === 'testing'
          ? 'Testing...'
          : googleDriveTestStatus === 'success'
            ? '✅ Success'
            : googleDriveTestStatus === 'error'
              ? '❌ Error'
              : 'Test Google Drive API'
        }
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

// グローバル関数の型定義
declare global {
  interface Window {
    testGoogleDriveConnection: () => Promise<unknown>;
    checkTestFunction: () => void;
  }
}

window.testGoogleDriveConnection = async() => {
  try {
    console.log('testGoogleDriveConnection関数が呼び出されました');
    const response: unknown = await chrome.runtime.sendMessage({
      action: 'testGoogleDriveConnection'
    });
    console.log('テスト結果:', response);
    return response;
  } catch (error) {
    console.error('テスト実行エラー:', error);
    throw error;
  }
};

window.checkTestFunction = () => {
  console.log('testGoogleDriveConnection関数の存在確認:');
  console.log('typeof testGoogleDriveConnection:', typeof window.testGoogleDriveConnection);
  console.log('window.testGoogleDriveConnection:', window.testGoogleDriveConnection);
  console.log('globalThis.testGoogleDriveConnection:', (globalThis as { testGoogleDriveConnection?: () => Promise<unknown> }).testGoogleDriveConnection);
};

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
  console.log('Initializing dev features UI...');
  initializeDevApp();
}

// メッセージ受信は残しても良いが、content.tsx側で一元管理する方がベター
chrome.runtime.onMessage.addListener((message: { action: string; count?: number; selectionText?: string }) => {
  if (message.action === 'updateCount' && message.count !== undefined) {
    updateCount(message.count);
  }
});

console.log('Development Content script module loaded');
