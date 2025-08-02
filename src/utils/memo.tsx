import type { TextSelectionInfo } from '../types/memo';

/**
 * メモ表示UIを作成する関数
 */
export function createMemoDisplay(selectionInfo: TextSelectionInfo, memoText: string) {
  // 既存のメモ表示を削除
  const existingMemo = document.getElementById('memo-display');
  if (existingMemo) {
    existingMemo.remove();
  }

  // メモ表示用の要素を作成
  const memoElement = document.createElement('div');
  memoElement.id = 'memo-display';
  memoElement.style.cssText = `
    position: absolute;
    left: ${selectionInfo.boundingRect.x}px;
    top: ${selectionInfo.boundingRect.bottom + 5}px;
    width: 300px;
    min-height: 150px;
    background: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    line-height: 1.4;
    color: #333;
    padding: 12px;
    display: flex;
    flex-direction: column;
  `;

  // メモヘッダー
  const header = document.createElement('div');
  header.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid #f0f0f0;
  `;
  
  const title = document.createElement('span');
  title.textContent = 'メモ';
  title.style.cssText = `
    font-weight: 600;
    color: #666;
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    background: none;
    border: none;
    font-size: 18px;
    cursor: pointer;
    color: #999;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  closeBtn.onclick = () => memoElement.remove();
  
  header.appendChild(title);
  header.appendChild(closeBtn);

  // メモ内容
  const content = document.createElement('div');
  content.style.cssText = `
    flex: 1;
    min-height: 100px;
    outline: none;
    word-wrap: break-word;
  `;
  content.contentEditable = 'true';
  content.textContent = `選択テキスト: "${memoText}"\n\nここにメモを入力してください...`;

  // 選択テキストに編みかけ（インジケーター）を追加
  addMemoIndicator(selectionInfo);

  memoElement.appendChild(header);
  memoElement.appendChild(content);
  document.body.appendChild(memoElement);

  // フォーカスを設定
  content.focus();
  
  console.log('メモ表示UIを作成しました:', {
    position: {
      x: selectionInfo.boundingRect.x,
      y: selectionInfo.boundingRect.bottom + 5
    },
    text: memoText
  });
}

/**
 * 選択テキストに編みかけ（インジケーター）を追加
 */
function addMemoIndicator(selectionInfo: TextSelectionInfo) {
  // 既存のインジケーターを削除
  const existingIndicator = document.getElementById('memo-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }

  const indicator = document.createElement('div');
  indicator.id = 'memo-indicator';
  indicator.style.cssText = `
    position: absolute;
    left: ${selectionInfo.boundingRect.right - 20}px;
    top: ${selectionInfo.boundingRect.top - 5}px;
    width: 8px;
    height: 8px;
    background: #4285f4;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    cursor: pointer;
    transition: all 0.2s ease;
  `;
  
  indicator.title = 'メモがあります';
  
  // ホバー効果
  indicator.onmouseenter = () => {
    indicator.style.transform = 'scale(1.2)';
    indicator.style.background = '#1a73e8';
  };
  
  indicator.onmouseleave = () => {
    indicator.style.transform = 'scale(1)';
    indicator.style.background = '#4285f4';
  };
  
  // クリックでメモの表示/非表示を切り替え
  indicator.onclick = () => {
    const memoDisplay = document.getElementById('memo-display');
    if (memoDisplay) {
      memoDisplay.style.display = memoDisplay.style.display === 'none' ? 'flex' : 'none';
    }
  };

  document.body.appendChild(indicator);
}
