// バックグラウンドスクリプト
console.log("background script loaded!");

// 拡張機能のインストール時
chrome.runtime.onInstalled.addListener(() => {
  console.log("onInstalled event fired!");
  
  // 初期設定
  chrome.storage.sync.set({ count: 0 });
});

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.action === 'updateCount') {
    console.log('Count updated to:', request.count);
    
    // ここでブレークポイントを設定できます
    const newCount = request.count;
    
    // Content scriptにメッセージを送信
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'displayCount',
          count: newCount
        });
      }
    });
  }
  
  // 非同期応答の場合はtrueを返す
  return true;
});

// タブの更新をリッスン
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab updated:', tab.url);
  }
});

// アクションボタンのクリック
chrome.action.onClicked.addListener((tab) => {
  console.log('Action button clicked on tab:', tab.url);
}); 