import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import type { MemoData, MemoPosition, TextSelectionInfo } from '../../shared/types/memo';

// ユーティリティ関数
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// MemoDisplayコンポーネント
interface MemoDisplayProps {
  selectionInfo: TextSelectionInfo;
  memoText: string;
  onClose: () => void;
}

const MemoDisplay: React.FC<MemoDisplayProps> = ({ selectionInfo, memoText, onClose }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.focus();
    }
  }, []);

  // 作成時の位置を固定（スクロール位置を加算）
  const initialScrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const initialScrollY = window.pageYOffset || document.documentElement.scrollTop;
  
  const fixedX = selectionInfo.boundingRect.x + initialScrollX;
  const fixedY = selectionInfo.boundingRect.bottom + initialScrollY;

  return (
    <div
      id="memo-display"
      className="memo-card"
      style={{
        left: `${fixedX}px`,
        top: `${fixedY}px`,
        position: 'absolute',
        width: '300px',
        minHeight: '150px',
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

// MemoIndicatorコンポーネント
interface MemoIndicatorProps {
  selectionInfo: TextSelectionInfo;
  onToggle: () => void;
}

const MemoIndicator: React.FC<MemoIndicatorProps> = ({ selectionInfo, onToggle }) => {
  // 作成時の位置を固定（スクロール位置を加算）
  const initialScrollX = window.pageXOffset || document.documentElement.scrollLeft;
  const initialScrollY = window.pageYOffset || document.documentElement.scrollTop;
  
  const fixedX = selectionInfo.boundingRect.right + initialScrollX - 20;
  const fixedY = selectionInfo.boundingRect.top + initialScrollY - 5;

  return (
    <div
      id="memo-indicator"
      className="absolute w-2 h-2 bg-blue-500 rounded-full border-2 border-white shadow-md z-[9999] cursor-pointer transition-all duration-200 hover:scale-110 hover:bg-blue-600"
      style={{
        left: `${fixedX}px`,
        top: `${fixedY}px`,
      }}
      title="メモがあります"
      onClick={onToggle}
    />
  );
};

// MemoContainerコンポーネント
interface MemoContainerProps {
  selectionInfo: TextSelectionInfo;
  memoText: string;
  onClose: () => void;
}

const MemoContainer: React.FC<MemoContainerProps> = ({ selectionInfo, memoText, onClose }) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleToggle = () => setIsVisible(!isVisible);

  return createPortal(
    <>
      <MemoIndicator selectionInfo={selectionInfo} onToggle={handleToggle} />
      {isVisible && (
        <MemoDisplay
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
