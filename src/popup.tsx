import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import './popup.css';

export const Popup: React.FC = () => {
  // eslint-disable-next-line no-console
  console.log('Popup component rendering...'); // デバッグ用

  const [count, setCount] = useState(0);
  const [currentTab, setCurrentTab] = useState<string>('');

  const a = 1 + 2;
  // eslint-disable-next-line no-console
  console.log(a);

  useEffect(() => {
    // eslint-disable-next-line no-console
    console.log('useEffect running...'); // デバッグ用

    // 現在のタブ情報を取得
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      // eslint-disable-next-line no-console
      console.log('Tabs query result:', tabs); // デバッグ用
      if (tabs[0]) {
        setCurrentTab(tabs[0].url || '');
      }
    });

    // カウントを保存から読み込み
    chrome.storage.sync.get(['count'], result => {
      // eslint-disable-next-line no-console
      console.log('Storage get result:', result); // デバッグ用
      if (result.count) {
        setCount(result.count as number);
      }
    });
  }, []);

  const handleCountClick = async () => {
    // ここにブレークポイントを設定（React内部処理をスキップ）
    // debugger; // 強制的にここで停止

    // eslint-disable-next-line no-console
    console.log('Button clicked, current count:', count); // デバッグ用

    const newCount = count + 1;
    setCount(newCount);

    // カウントを保存
    await chrome.storage.sync.set({ count: newCount });

    // Background scriptにメッセージを送信
    await chrome.runtime.sendMessage({
      action: 'updateCount',
      count: newCount,
    });
  };

  const handleCountClick2 = async () => {
    const newCount = count - 1;
    setCount(newCount);
    await chrome.storage.sync.set({ count: newCount });
    await chrome.runtime.sendMessage({
      action: 'updateCount',
      count: newCount,
    });
  };

  return (
    <div className="popup-container">
      <h1>Chrome Extension Debug Sample - HOT</h1>
      <div className="tab-info">
        <p>現在のタブ: {currentTab}</p>
      </div>
      <div className="counter-section">
        <button onClick={() => void handleCountClick()}>
          カウント: {count}
        </button>
        <p>ボタンをクリックしてカウントを増やす ああああ</p>
      </div>
      <div className="counter-section">
        <button onClick={() => void handleCountClick2()}>
          カウント: {count}
        </button>
        <p>ボタンをクリックしてカウントを減らす</p>
      </div>
    </div>
  );
};

// ポップアップをレンダリング
// eslint-disable-next-line no-console
console.log('Starting popup rendering...'); // デバッグ用
const container = document.getElementById('root');
if (container) {
  // eslint-disable-next-line no-console
  console.log('Container found, creating root...'); // デバッグ用
  const root = createRoot(container);
  root.render(<Popup />);
} else {
  // eslint-disable-next-line no-console
  console.error('Popup root element not found!'); // デバッグ用
}
