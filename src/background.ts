// バックグラウンドスクリプト
console.log("background script loaded!");

// 拡張機能のインストール時
chrome.runtime.onInstalled.addListener(() => {
  console.log("onInstalled event fired!");
  
  // 初期設定
  chrome.storage.sync.set({ count: 0 });
});

// メッセージ受信
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log("Background received message:", message);
  
  if (message.action === 'updateCount') {
    console.log("Count updated to:", message.count);
    
    // Content scriptにメッセージを送信（エラーハンドリング付き）
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { 
          action: 'updateCount', 
          count: message.count 
        }).catch((error) => {
          console.log("Content script not available:", error.message);
        });
      }
    });
    
    sendResponse({ success: true });
  }
});

// タブ更新時の処理
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log("Tab updated:", tab.url);
  }
});

// アクションボタンのクリック
chrome.action.onClicked.addListener((tab) => {
  console.log('Action button clicked on tab:', tab.url);
}); 