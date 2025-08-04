import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import '../../shared/styles/memo.css';
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
      className="memo-display"
      style={{
        left: `${fixedX}px`,
        top: `${fixedY}px`,
      }}
    >
      {/* メモヘッダー */}
      <div className="memo-header">
        <span className="memo-title">メモ</span>
        <button className="memo-close-btn" onClick={onClose}>
          ×
        </button>
      </div>

      {/* メモ内容 */}
      <div
        ref={contentRef}
        className="memo-content"
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
      className="memo-indicator"
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
  // 既存のメモ表示を削除
  const existingMemo = document.getElementById('memo-display');
  if (existingMemo) {
    existingMemo.remove();
  }

  // 既存のインジケーターを削除
  const existingIndicator = document.getElementById('memo-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }

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
