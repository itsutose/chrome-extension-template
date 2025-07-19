// コンテンツスクリプト
console.log('Content script loaded! - HOT RELOAD TEST');

type Message = {
  action: 'updateCount';
  count: number;
}

// Background scriptからのメッセージを受信
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  console.log('Content script received message:', message);

  if (message.action === 'updateCount') {
    console.log('Displaying count:', message.count);

    // ページにカウントを表示
    const countElement = document.getElementById('extension-count');
    if (countElement) {
      countElement.textContent = `Extension Count: ${message.count}`;
    } else {
      // 要素が存在しない場合は作成
      const newElement = document.createElement('div');
      newElement.id = 'extension-count';
      newElement.textContent = `Extension Count: ${message.count}`;
      newElement.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #007bff;
        color: white;
        padding: 10px;
        border-radius: 5px;
        z-index: 10000;
        font-family: Arial, sans-serif;
      `;
      document.body.appendChild(newElement);
    }

    sendResponse({ success: true });
  }
});

// ページ読み込み完了時の処理
console.log('Content script initialized on:', window.location.href);
