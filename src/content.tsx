import { useState } from 'react';
import { createRoot } from 'react-dom/client';

debugger;

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

// メッセージ受信
chrome.runtime.onMessage.addListener((message: { action: string; count: number }) => {
  if (message.action === 'updateCount') {
    updateCount(message.count);
  }
});

console.log('Content script ready');
