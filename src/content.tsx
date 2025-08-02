import { useState } from 'react';
import { createRoot } from 'react-dom/client';
// import { PositionValidator } from './utils/positionValidator';
import { RestoreSimulator } from './utils/restoreSimulator';
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

// 背景色変更コンポーネント
function ColorButtonComponent() {
  const handleClick = () => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1'];
    document.body.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '50px',
        right: '10px',
        background: '#28a745',
        color: 'white',
        padding: '8px',
        cursor: 'pointer',
        zIndex: '10000'
      }}
      onClick={handleClick}
    >
      Change Color
    </div>
  );
}

// メインアプリコンポーネント
function ContentApp() {
  return (
    <div id="content-app">
      <CountComponent />
      <ColorButtonComponent />
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
      // テストモード時の自動検証
      console.log('=== テストモード: 自動検証開始 ===');

      try {
        // RestoreSimulatorでシミュレーション
        const simulationResult = RestoreSimulator.simulateRestoreWithVisualization(currentSelection);
        console.log('RestoreSimulator結果:', simulationResult);

        // 結果の要約
        console.log('=== 検証結果要約 ===');
        // console.log(`精度: ${validationResult.accuracy.toFixed(3)}`);
        console.log(`処理時間: ${simulationResult.processingTime}ms`);
        console.log(`成功: ${simulationResult.success ? 'YES' : 'NO'}`);
        console.log('========================');
      } catch (error) {
        console.error('テスト検証中にエラーが発生:', error);
      }
      
      // TODO: メモ作成UIの表示（002番のissueで実装予定）
      // 現在はログ出力のみ
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

// 初期化
initializeApp();
initializeTextSelectionWatcher();

// メッセージ受信
chrome.runtime.onMessage.addListener((message: { action: string; count?: number; selectionText?: string }) => {
  if (message.action === 'updateCount' && message.count !== undefined) {
    updateCount(message.count);
  } else if (message.action === 'createMemo' && message.selectionText) {
    handleCreateMemo(message.selectionText);
  }
});

console.log('Content script ready with text selection monitoring');
