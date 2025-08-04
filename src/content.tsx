import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createMemo, createMemoDisplay, placeMemo } from './utils/memo';
import { RestoreMemoPosition } from './utils/restoreMemoPosition';
import { TextSelectionWatcher } from './utils/textSelection';

// debugger;

// カウントコンポーネント
function CountComponent() {
  const [count, setCount] = useState(0);
  
  const handleIncrement = () => {
    setCount(count + 1);
  };
  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: '#007bff',
        color: 'white',
        padding: '8px',
        cursor: 'pointer',
        zIndex: '10000'
      }}
      onClick={handleIncrement}
    >
      Count: {count}
    </div>
  );
}

// メインアプリコンポーネント
function ContentApp() {
  return (
    <div id="content-app">
      <CountComponent />
    </div>
  );
}

// テキスト選択監視の初期化
let textSelectionWatcher: TextSelectionWatcher | null = null;

function initializeTextSelectionWatcher() {
  textSelectionWatcher = new TextSelectionWatcher((selection) => {
    if (selection) {
      console.log('Text selection changed:', selection.text);
    } else {
      console.log('Text selection cleared');
    }
  });
}

// メモ作成ハンドラー
function handleCreateMemo(selectionText: string) {
  console.log('Creating memo for text:', selectionText);
  
  if (textSelectionWatcher) {
    const currentSelection = textSelectionWatcher.getCurrentSelection();
    if (currentSelection) {
      console.log('Memo creation initiated with selection info:', {
        text: currentSelection.text,
        position: {
          x: currentSelection.boundingRect.x,
          y: currentSelection.boundingRect.y
        }
      });

      try {
        // 1. メモを作成（位置情報なし）
        const memo = createMemo('新しいメモ', selectionText);
        
        // 2. 復元アルゴリズムで位置を特定
        const position = RestoreMemoPosition.findRestoredInfo(currentSelection);
        if (position) {
          const restoreInfo = RestoreMemoPosition.createRestoreInfo(position, currentSelection);
          const success = RestoreMemoPosition.restorePosition(restoreInfo);
          console.log('復元結果:', { success, restoreInfo });
          
          // 3. メモを特定位置に配置
          if (success && restoreInfo) {
            const memoPosition = placeMemo(memo.id, restoreInfo);
            // 4. メモ表示UIを作成
            createMemoDisplay(memo, memoPosition);
          }
        } else {
          console.log('復元位置が見つかりませんでした');
          // 現在の選択位置にメモを配置
          const memoPosition = placeMemo(memo.id, currentSelection);
          createMemoDisplay(memo, memoPosition);
        }
      } catch (error) {
        console.error('メモ作成中にエラーが発生:', error);
        // エラー時はメモのみ作成（位置指定なし）
        const memo = createMemo('新しいメモ', selectionText);
        createMemoDisplay(memo);
      }
    } else {
      console.warn('No current selection available for memo creation');
    }
  }
}

// アプリの初期化
function initializeApp() {
  const existing = document.getElementById('content-app');
  if (existing) existing.remove();

  const root = document.createElement('div');
  root.id = 'root';
  document.body.appendChild(root);
  
  const reactRoot = createRoot(root);
  reactRoot.render(<ContentApp />);
}

// 外部からのカウント更新
function updateCount(newCount: number) {
  // Reactの状態を更新するロジック
  console.log('Updating count to:', newCount);
}

// テスト関数をグローバルに公開（Background Scriptにメッセージを送信）
(window as any).testGoogleDriveConnection = async () => {
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

  button.onclick = async () => {
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

// 初期化
initializeApp();
initializeTextSelectionWatcher();
createTestButton();

// メッセージ受信
chrome.runtime.onMessage.addListener((message: { action: string; count?: number; selectionText?: string }) => {
  if (message.action === 'updateCount' && message.count !== undefined) {
    updateCount(message.count);
  } else if (message.action === 'createMemo' && message.selectionText) {
    handleCreateMemo(message.selectionText);
  }
});

console.log('Content script ready with text selection monitoring');
