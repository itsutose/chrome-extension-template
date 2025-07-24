// テキスト選択の位置情報
export interface TextSelectionInfo {
  text: string;
  startOffset: number;
  endOffset: number;
  startContainer: Node;
  endContainer: Node;
  range: Range;
  boundingRect: DOMRect;
  pageUrl: string;
  timestamp: number;
}

// メモデータの基本構造
export interface MemoData {
  id: string;
  text: string;
  content: string;
  position: {
    x: number;
    y: number;
    pageUrl: string;
    selectionInfo: TextSelectionInfo;
  };
  createdAt: number;
  updatedAt: number;
  tags: string[];
  color: string;
  isVisible: boolean;
}

// 右クリックメニューのメッセージ型
export interface ContextMenuMessage {
  action: 'createMemo';
  selectionInfo: TextSelectionInfo;
}

// メモ作成イベントの型
export interface MemoCreateEvent {
  type: 'CREATE_MEMO';
  payload: {
    selectionInfo: TextSelectionInfo;
  };
}

// エラー情報の型
export interface MemoError {
  code: string;
  message: string;
  timestamp: number;
  context?: any;
}
