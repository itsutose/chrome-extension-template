import { createRoot } from 'react-dom/client';

import { createMemo, createMemoDisplay, placeMemo } from '../features/memo/memo';
import { RestoreMemoPosition } from '../features/memo/restoreMemoPosition';
import { TextSelectionWatcher } from '../features/memo/textSelection';

/**
 * Content Scriptのメインエントリーポイント
 * DOMの準備が完了してから全ての処理を開始する
 */
function main() {
  // --- これより下に、既存のcontent.tsxのコードを全て移動させる ---

  // メインアプリコンポーネント（本番用 - テスト機能なし）
  function ContentApp() {
    return (
      <div id="content-app">
        {/* 本番環境ではテストコンポーネントは表示しない */}
      </div>
    );
  }

  // テキスト選択監視の初期化
  let textSelectionWatcher: TextSelectionWatcher | null = null;

  function initializeTextSelectionWatcher() {
    textSelectionWatcher = new TextSelectionWatcher((selection) => {
      if (selection) {
        console.log('Text selection changed:', selection.text);
      } else {
        console.log('Text selection cleared');
      }
    });
  }

  // メモ作成ハンドラー
  function handleCreateMemo(selectionText: string) {
    console.log('Creating memo for text:', selectionText);
    
    if (textSelectionWatcher) {
      const currentSelection = textSelectionWatcher.getCurrentSelection();
      if (currentSelection) {
        console.log('Memo creation initiated with selection info:', {
          text: currentSelection.text,
          position: {
            x: currentSelection.boundingRect.x,
            y: currentSelection.boundingRect.y
          }
        });

        try {
          // 1. メモを作成（位置情報なし）
          const memo = createMemo('新しいメモ', selectionText);
          
          // 2. 復元アルゴリズムで位置を特定
          const position = RestoreMemoPosition.findRestoredInfo(currentSelection);
          if (position) {
            const restoreInfo = RestoreMemoPosition.createRestoreInfo(position, currentSelection);
            const success = RestoreMemoPosition.restorePosition(restoreInfo, memo.id);
            console.log('復元結果:', { success, restoreInfo });
            
            // 3. メモを特定位置に配置
            if (success && restoreInfo) {
              const memoPosition = placeMemo(memo.id, restoreInfo);
              // 4. メモ表示UIを作成
              createMemoDisplay(memo, memoPosition);
            }
          } else {
            console.log('復元位置が見つかりませんでした');
            // 現在の選択位置にメモを配置
            const memoPosition = placeMemo(memo.id, currentSelection);
            createMemoDisplay(memo, memoPosition);
          }
        } catch (error) {
          console.error('メモ作成中にエラーが発生:', error);
          // エラー時はメモのみ作成（位置指定なし）
          const memo = createMemo('新しいメモ', selectionText);
          createMemoDisplay(memo);
        }
      } else {
        console.warn('No current selection available for memo creation');
      }
    }
  }

  // アプリの初期化（本番用）
  function initializeApp() {
    const existing = document.getElementById('content-app');
    if (existing) existing.remove();

    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);
    
    const reactRoot = createRoot(root);
    reactRoot.render(<ContentApp />);
  }

  initializeTextSelectionWatcher();

  const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true' || true;

  if (isDevelopment) {
    console.log('Loading development features...');
    // ★★★ 変更点：import成功後、エクスポートされた関数を呼び出す ★★★
    import('../dev/content-dev').then((devModule) => {
      devModule.initializeDevFeatures(); // ここでUIの初期化を実行
      console.log('✅ Development features loaded and initialized');
    }).catch(error => {
      console.warn('⚠️ Development features not available:', error);
    });
  } else {
    initializeApp();
  }

  chrome.runtime.onMessage.addListener((message: { action: string; count?: number; selectionText?: string }) => {
    if (message.action === 'createMemo' && message.selectionText) {
      handleCreateMemo(message.selectionText);
    }
  });

  console.log('Content script has been initialized after DOM is ready!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
