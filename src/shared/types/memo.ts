// テキスト選択の位置情報
export interface TextSelectionInfo {
  text: string;
  startOffset: number;
  endOffset: number;
  startContainer: Node;
  endContainer: Node;
  parentPreviousSiblingNode: Node; // 先頭の親要素の前の兄弟要素
  parentNextSiblingNode: Node; // 最後の親要素の次の兄弟要素
  parentPreviousSiblingElement: Element; // 先頭の親要素の前の兄弟要素
  parentNextSiblingElement: Element; // 最後の親要素の次の兄弟要素
  range: Range;
  boundingRect: DOMRect;
  pageUrl: string;
  timestamp: number;
}

// メモデータの基本構造（位置情報を分離）
export interface MemoData {
  id: string;
  text: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  color: string;
  isVisible: boolean;
  // 保存機能用の拡張
  driveFileId?: string;  // Google DriveファイルID
  syncStatus: 'synced' | 'pending' | 'error';
  lastSyncAt?: number;
}


// メモ位置情報（分離後）
export interface MemoPosition {
  id: string;
  memoId: string;
  pageUrl: string;
  selectionInfo: TextSelectionInfo;
  createdAt: number;
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

// テスト環境用の型定義
export interface PositionValidationResult {
  isValid: boolean;
  accuracy: number; // 0-1の精度スコア
  originalPosition: TextSelectionInfo;
  restoredPosition: TextSelectionInfo | null;
  error?: string;
  timestamp: number;
}

export interface RestoreSimulationResult {
  success: boolean;
  originalInfo: TextSelectionInfo;
  restoredInfo: TextSelectionInfo | null;
  accuracy: number;
  processingTime: number;
  errors: string[];
}

export interface TestStatistics {
  totalTests: number;
  successfulRestores: number;
  failedRestores: number;
  averageAccuracy: number;
  averageProcessingTime: number;
  lastTestTime: number;
}

export interface TestData {
  id: string;
  pageUrl: string;
  testCases: TextSelectionInfo[];
  results: PositionValidationResult[];
  statistics: TestStatistics;
  createdAt: number;
  updatedAt: number;
  lastTestTime?: number;
}
