import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../index.css';

debugger;

export const Popup: React.FC = () => {
   
  console.log('Popup component rendering...'); // デバッグ用

  const [count, setCount] = useState(0);
  const [currentTab, setCurrentTab] = useState<string>('');

  const a = 1 + 2;
   
  console.log(a);

  useEffect(() => {
     
    console.log('useEffect running...'); // デバッグ用

    // 現在のタブ情報を取得
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
       
      console.log('Tabs query result:', tabs); // デバッグ用
      if (tabs[0]) {
        setCurrentTab(tabs[0].url || '');
      }
    });

    // カウントを保存から読み込み
    chrome.storage.sync.get(['count'], result => {
       
      console.log('Storage get result:', result); // デバッグ用
      if (result.count) {
        setCount(result.count as number);
      }
    });
  }, []);

  const handleCountClick = async() => {
    // ここにブレークポイントを設定（React内部処理をスキップ）
    // debugger; // 強制的にここで停止

     
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

  const handleCountClick2 = async() => {
    const newCount = count - 1;
    setCount(newCount);
    await chrome.storage.sync.set({ count: newCount });
    await chrome.runtime.sendMessage({
      action: 'updateCount',
      count: newCount,
    });
  };

  return (
    <div className="extension-popup">
      <h1 className="text-xl font-bold text-gray-800 mb-4">Chrome Extension Debug Sample - HOT</h1>
      <div className="bg-gray-100 rounded-lg p-3 mb-4">
        <p className="text-sm text-gray-700">現在のタブ: {currentTab}</p>
      </div>
      <div className="mb-4">
        <button 
          className="extension-button mr-3"
          onClick={() => void handleCountClick()}
        >
          カウント: {count}
        </button>
        <p className="text-sm text-gray-600 mt-2">ボタンをクリックしてカウントを増やす いいい</p>
      </div>
      <div className="mb-4">
        <button 
          className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition-colors duration-200 mr-3"
          onClick={() => void handleCountClick2()}
        >
          カウント: {count}
        </button>
        <p className="text-sm text-gray-600 mt-2">ボタンをクリックしてカウントを減らす</p>
      </div>
    </div>
  );
};

// ポップアップをレンダリング
 
console.log('Starting popup rendering...'); // デバッグ用
const container = document.getElementById('root');
if (container) {
   
  console.log('Container found, creating root...'); // デバッグ用
  const root = createRoot(container);
  root.render(<Popup />);
} else {
   
  console.error('Popup root element not found!'); // デバッグ用
}
