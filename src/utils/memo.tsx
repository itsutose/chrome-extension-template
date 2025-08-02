import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import '../styles/memo.css';
import type { TextSelectionInfo } from '../types/memo';

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

  return (
    <div
      id="memo-display"
      className="memo-display"
      style={{
        left: `${selectionInfo.boundingRect.x}px`,
        top: `${selectionInfo.boundingRect.bottom}px`,
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
  return (
    <div
      id="memo-indicator"
      className="memo-indicator"
      style={{
        left: `${selectionInfo.boundingRect.right - 20}px`,
        top: `${selectionInfo.boundingRect.top - 5}px`,
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
 * メモ表示UIを作成する関数（JSXコンポーネント版）
 */
export function createMemoDisplay(selectionInfo: TextSelectionInfo, memoText: string) {
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

  reactRoot.render(
    <MemoContainer
      selectionInfo={selectionInfo}
      memoText={memoText}
      onClose={handleClose}
    />
  );
  
  console.log('メモ表示UIを作成しました（JSX版）:', {
    position: {
      x: selectionInfo.boundingRect.x,
      y: selectionInfo.boundingRect.bottom
    },
    text: memoText
  });
}
