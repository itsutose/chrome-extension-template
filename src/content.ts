// コンテンツスクリプト - シンプル版
console.log('Content script loaded!');

// デバッグ用
debugger;

// シンプルな状態管理
class SimpleContentManager {
  private count = 0;
  private countElement: HTMLElement;
  private colorButton: HTMLElement;

  constructor() {
    this.createElements();
    this.setupEvents();
  }

  // 要素を作成
  private createElements() {
    // カウント表示
    this.countElement = document.createElement('div');
    this.countElement.textContent = 'Count: 0';
    this.countElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: #007bff;
      color: white;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      z-index: 10000;
    `;

    // 背景色変更ボタン
    this.colorButton = document.createElement('div');
    this.colorButton.textContent = 'Change Color';
    this.colorButton.style.cssText = `
      position: fixed;
      top: 50px;
      right: 10px;
      background: #28a745;
      color: white;
      padding: 8px;
      border-radius: 4px;
      cursor: pointer;
      z-index: 10000;
    `;

    document.body.appendChild(this.countElement);
    document.body.appendChild(this.colorButton);
  }

  // イベント設定
  private setupEvents() {
    // カウントクリック
    this.countElement.addEventListener('click', () => {
      this.count++;
      this.updateDisplay();
    });

    // 背景色変更クリック
    this.colorButton.addEventListener('click', () => {
      const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      document.body.style.backgroundColor = randomColor;
    });

    // キーボードショートカット
    document.addEventListener('keydown', (event) => {
      // Cmd+Shift+R で背景色リセット
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'R') {
        document.body.style.backgroundColor = '';
      }
    });
  }

  // 表示更新
  private updateDisplay() {
    this.countElement.textContent = `Count: ${this.count}`;
  }

  // 外部からのカウント更新
  public setCount(count: number) {
    this.count = count;
    this.updateDisplay();
  }
}

// インスタンス作成
const contentManager = new SimpleContentManager();

// メッセージ受信
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateCount') {
    contentManager.setCount(message.count);
    sendResponse({ success: true });
  }
});

console.log('Content script ready');
