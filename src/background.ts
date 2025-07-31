// バックグラウンドスクリプト
console.log('background script loaded!');

debugger;

// 右クリックメニューの作成
chrome.runtime.onInstalled.addListener(() => {
  // 既存のメニューを削除
  chrome.contextMenus.removeAll(() => {
    // メモ作成メニューを追加
    chrome.contextMenus.create({
      id: 'createMemo',
      title: 'メモを作成',
      contexts: ['selection']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to create context menu:', chrome.runtime.lastError);
      } else {
        console.log('Context menu created successfully');
      }
    });
  });
});

// 拡張機能のインストール時
chrome.runtime.onInstalled.addListener(() => {
  console.log('onInstalled event fired!');

  // 初期設定mM
  chrome.storage.sync.set({ count: 0 }).catch((error) => {
    console.error('Failed to set initial count:', error);
  });
});

type Message = {
  action: 'updateCount';
  count: number;
  // sender: {
  //   tab: {
  //     id: number;
  //   };
  // };
}

// 右クリックメニューのクリックイベント
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked:', info.menuItemId);

  if (info.menuItemId === 'createMemo' && tab?.id) {
    console.log('Creating memo for selection:', info.selectionText);

    // Content scriptにメモ作成メッセージを送信
    chrome.tabs.sendMessage(tab.id, {
      action: 'createMemo',
      selectionText: info.selectionText
    }).catch((error) => {
      console.error('Failed to send message to content script:', error);
    });
  }
});

// メッセージ受信
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.action === 'updateCount') {
    // debugger; // Service Workerでも確実に停止

    console.log('Count updated to:', message.count);

    // Content scriptにメッセージを送信（エラーハンドリング付き）
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateCount',
          count: message.count,
        }).catch((error) => {
          console.log('Content script not available:', error instanceof Error ? error.message : String(error));
        });
      }
    });
    sendResponse({ success: true });
  }
});

// タブ更新時の処理
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
  }
});

// アクションボタンのクリック
chrome.action.onClicked.addListener((tab) => {
  console.log('Action button clicked on tab:', tab.url);
});
