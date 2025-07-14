// コンテンツスクリプト
console.log('Content script loaded on:', window.location.href);

// Background scriptからのメッセージを受信
chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'displayCount') {
    // ここでブレークポイントを設定できます
    const count = request.count;
    
    // カウントを画面に表示
    displayCountOnPage(count);
  }
  
  return true;
});

// ページにカウントを表示する関数
function displayCountOnPage(count: number) {
  // 既存の表示を削除
  const existingDisplay = document.getElementById('chrome-extension-count-display');
  if (existingDisplay) {
    existingDisplay.remove();
  }
  
  // カウント表示用のdiv要素を作成
  const countDisplay = document.createElement('div');
  countDisplay.id = 'chrome-extension-count-display';
  countDisplay.style.position = 'fixed';
  countDisplay.style.top = '10px';
  countDisplay.style.right = '10px';
  countDisplay.style.backgroundColor = '#4CAF50';
  countDisplay.style.color = 'white';
  countDisplay.style.padding = '10px';
  countDisplay.style.borderRadius = '4px';
  countDisplay.style.fontSize = '14px';
  countDisplay.style.zIndex = '9999';
  countDisplay.style.fontFamily = 'Arial, sans-serif';
  countDisplay.textContent = `カウント: ${count}`;
  
  // ページに追加
  document.body.appendChild(countDisplay);
  
  // 3秒後に自動的に削除
  setTimeout(() => {
    const display = document.getElementById('chrome-extension-count-display');
    if (display) {
      display.remove();
    }
  }, 3000);
}

// デバッグ用の関数
function debugFunction() {
  console.log('Debug function called');
  
  // ここにブレークポイントを設定してデバッグできます
  const currentUrl = window.location.href;
  const pageTitle = document.title;
  
  console.log('Current URL:', currentUrl);
  console.log('Page title:', pageTitle);
  
  return {
    url: currentUrl,
    title: pageTitle,
    timestamp: new Date().toISOString()
  };
}

// DOM読み込み完了時の処理
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded in content script');
  debugFunction();
}); 