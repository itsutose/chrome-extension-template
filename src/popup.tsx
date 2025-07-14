import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './popup.css';

const Popup: React.FC = () => {
  console.log("Popup component rendering..."); // デバッグ用
  
  const [count, setCount] = useState(0);
  const [currentTab, setCurrentTab] = useState<string>('');

  useEffect(() => {
    console.log("useEffect running..."); // デバッグ用
    
    // 現在のタブ情報を取得
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log("Tabs query result:", tabs); // デバッグ用
      if (tabs[0]) {
        setCurrentTab(tabs[0].url || '');
      }
    });

    // カウントを保存から読み込み
    chrome.storage.sync.get(['count'], (result) => {
      console.log("Storage get result:", result); // デバッグ用
      if (result.count) {
        setCount(result.count);
      }
    });
  }, []);

  const handleCountClick = () => {
    // ここにブレークポイントを設定（React内部処理をスキップ）
    debugger; // 強制的にここで停止
    
    console.log("Button clicked, current count:", count); // デバッグ用
    
    const newCount = count + 1;
    setCount(newCount);
    
    // カウントを保存
    chrome.storage.sync.set({ count: newCount });
    
    // Background scriptにメッセージを送信
    chrome.runtime.sendMessage({ action: 'updateCount', count: newCount });
  };

  return (
    <div className="popup-container">
      <h1>Chrome Extension Debug Sample</h1>
      <div className="tab-info">
        <p>現在のタブ: {currentTab}</p>
      </div>
      <div className="counter-section">
        <button onClick={handleCountClick}>
          カウント: {count}
        </button>
        <p>ボタンをクリックしてカウントを増やす</p>
      </div>
    </div>
  );
};

// ポップアップをレンダリング
console.log("Starting popup rendering..."); // デバッグ用
const container = document.getElementById('popup-root');
if (container) {
  console.log("Container found, creating root..."); // デバッグ用
  const root = createRoot(container);
  root.render(<Popup />);
} else {
  console.error("Popup root element not found!"); // デバッグ用
} 