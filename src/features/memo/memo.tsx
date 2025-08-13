import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import type { MemoData, MemoPosition, TextSelectionInfo } from '../../shared/types/memo';
import { MemoUIRegistry, type MemoPositionUpdater } from './memoUIRegistry';

// ユーティリティ関数
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// MemoDisplayコンポーネント
interface MemoDisplayProps {
  memoId: string;
  selectionInfo: TextSelectionInfo;
  memoText: string;
  onClose: () => void;
}

// 位置計算のヘルパー関数
const calculatePositionFromRect = (rect: DOMRect) => {
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const scrollY = window.pageYOffset || document.documentElement.scrollTop;
  return {
    x: rect.x + scrollX,
    y: rect.bottom + scrollY
  };
};

const MemoDisplay: React.FC<MemoDisplayProps> = ({ memoId, selectionInfo, memoText, onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState(() => {
    // 初期位置は span の現在位置を取得を試行、取得できなければ fallback
    const spanElement = document.querySelector(`span[data-memo-id="${memoId}"]`) as HTMLElement ||
                       Array.from(document.querySelectorAll('span')).find(span => 
                         span.style.cursor === 'pointer' && span.textContent?.includes(selectionInfo.text)
                       );
    
    if (spanElement) {
      const rect = spanElement.getBoundingClientRect();
      return calculatePositionFromRect(rect);
    }
    
    // fallback: 古い位置情報を使用
    return calculatePositionFromRect(selectionInfo.boundingRect);
  });
  const [isPositionReady, setIsPositionReady] = React.useState(() => {
    // 初期化時に span が見つかった場合は即座に表示可能
    return !!document.querySelector(`span[data-memo-id="${memoId}"]`);
  });

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.focus();
    }
  }, []);

  // 位置更新とイベント監視の統合セットアップ
  useEffect(() => {
    const positionUpdater: MemoPositionUpdater = (rect: DOMRect) => {
      setPosition(calculatePositionFromRect(rect));
      setIsPositionReady(true);
    };

    // レジストリに位置更新関数を登録
    MemoUIRegistry.registerPositionUpdater(memoId, positionUpdater);
    
    // マウント時に即座に位置を更新（再表示時の古い位置問題を解決）
    const hasUpdated = MemoUIRegistry.updateMemoPosition(memoId);
    if (!hasUpdated) {
      // span が見つからない場合は現在の位置で表示
      setIsPositionReady(true);
    }

    // スクロール・リサイズ時の位置更新ハンドラー
    const handleUpdate = () => {
      MemoUIRegistry.updateMemoPosition(memoId);
    };

    window.addEventListener('scroll', handleUpdate, { passive: true });
    window.addEventListener('resize', handleUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
      // cleanup は MemoContainer で一括実行されるため、ここでは何もしない
    };
  }, [memoId]);

  return (
    <div
      id="memo-display"
      className="memo-card"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        position: 'absolute',
        width: '300px',
        minHeight: '150px',
        opacity: isPositionReady ? 1 : 0,
        transition: isPositionReady ? 'opacity 0.15s ease-in' : 'none',
      }}
    >
      {/* メモヘッダー */}
      <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200 dark:border-gray-600">
        <span className="font-semibold text-gray-600 dark:text-gray-300">メモ</span>
        <button 
          className="bg-none border-none text-lg cursor-pointer text-gray-400 dark:text-gray-500 p-0 w-5 h-5 flex items-center justify-center transition-colors duration-200 hover:text-gray-600 dark:hover:text-gray-300"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      {/* メモ内容 */}
      <div
        ref={contentRef}
        className="flex-1 min-h-[100px] outline-none break-words border-none resize-none font-inherit text-inherit leading-inherit focus:outline-none"
        contentEditable
        suppressContentEditableWarning
      >
        {`選択テキスト: "${memoText}"\n\nここにメモを入力してください...`}
      </div>
    </div>
  );
};

// インジケーターは使用しない（選択テキストのハイライトクリックでトグル）

// MemoContainerコンポーネント
interface MemoContainerProps {
  memoId: string;
  selectionInfo: TextSelectionInfo;
  memoText: string;
  onClose: () => void;
}

const MemoContainer: React.FC<MemoContainerProps> = ({ memoId, selectionInfo, memoText, onClose }) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleToggle = React.useCallback(() => setIsVisible((v) => !v), []);

  // レジストリにトグルハンドラを登録/クリーンアップ
  useEffect(() => {
    MemoUIRegistry.registerToggleHandler(memoId, handleToggle);
    return () => {
      MemoUIRegistry.cleanup(memoId);
    };
  }, [memoId, handleToggle]);

  return createPortal(
    <>
      {isVisible && (
        <MemoDisplay
          memoId={memoId}
          selectionInfo={selectionInfo}
          memoText={memoText}
          onClose={onClose}
        />
      )}
    </>,
    document.body
  );
};

/**
 * メモを作成する（位置情報なし）
 */
export function createMemo(content: string, selectedText?: string): MemoData {
  const memo: MemoData = {
    id: generateId(),
    text: selectedText || '',
    content: content,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    tags: [],
    color: '#fff',
    isVisible: true,
    syncStatus: 'pending',
  };
  
  console.log('メモを作成しました:', memo);
  return memo;
}

/**
 * メモを特定位置に配置する
 */
export function placeMemo(memoId: string, selectionInfo: TextSelectionInfo): MemoPosition {
  const position: MemoPosition = {
    id: generateId(),
    memoId: memoId,
    pageUrl: window.location.href,
    selectionInfo: selectionInfo,
    createdAt: Date.now(),
  };
  
  console.log('メモを配置しました:', position);
  return position;
}

/**
 * メモ表示UIを作成する関数（分離版）
 */
export function createMemoDisplay(memo: MemoData, position?: MemoPosition) {
  // Reactルートを作成
  const root = document.createElement('div');
  root.id = 'memo-react-root';
  document.body.appendChild(root);
  
  const reactRoot = createRoot(root);
  
  const handleClose = () => {
    reactRoot.unmount();
    root.remove();
  };

  // 位置情報がある場合は位置指定表示、ない場合はデフォルト位置
  const selectionInfo = position?.selectionInfo || {
    text: memo.text,
    startOffset: 0,
    endOffset: 0,
    startContainer: document.body,
    endContainer: document.body,
    parentPreviousSiblingNode: document.body,
    parentNextSiblingNode: document.body,
    parentPreviousSiblingElement: document.body as Element,
    parentNextSiblingElement: document.body as Element,
    range: document.createRange(),
    boundingRect: new DOMRect(20, 20, 100, 20),
    pageUrl: window.location.href,
    timestamp: Date.now(),
  };

  reactRoot.render(
    <MemoContainer
      memoId={memo.id}
      selectionInfo={selectionInfo}
      memoText={memo.text}
      onClose={handleClose}
    />
  );
  
  console.log('メモ表示UIを作成しました（分離版）:', {
    memo: memo,
    position: position,
    displayPosition: {
      x: selectionInfo.boundingRect.x,
      y: selectionInfo.boundingRect.bottom
    }
  });
}
