import type { TextSelectionInfo } from '../types/memo';

// テキスト選択の監視クラス
export class TextSelectionWatcher {
  private currentSelection: TextSelectionInfo | null = null;
  private onSelectionChange: ((selection: TextSelectionInfo | null) => void) | null = null;

  constructor(onSelectionChange?: (selection: TextSelectionInfo | null) => void) {
    this.onSelectionChange = onSelectionChange || null;
    this.initialize();
  }

  private initialize() {
    // テキスト選択イベントの監視
    document.addEventListener('selectionchange', this.handleSelectionChange.bind(this));
    document.addEventListener('mouseup', this.handleSelectionChange.bind(this));

    // ページ離脱時のクリーンアップ
    window.addEventListener('beforeunload', this.cleanup.bind(this));
  }

  private handleSelectionChange() {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed) {
      // 選択が解除された場合
      if (this.currentSelection) {
        this.currentSelection = null;
        this.onSelectionChange?.(null);
      }
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const text = selection.toString().trim();

      if (text.length === 0) {
        return;
      }

      const boundingRect = range.getBoundingClientRect();

      // 位置情報を取得
      const selectionInfo: TextSelectionInfo = {
        text,
        startOffset: range.startOffset,
        endOffset: range.endOffset,
        startContainer: range.startContainer,
        endContainer: range.endContainer,
        range: range.cloneRange(),
        boundingRect,
        pageUrl: window.location.href,
        timestamp: Date.now()
      };

      this.currentSelection = selectionInfo;
      this.onSelectionChange?.(selectionInfo);

      console.log('Text selection detected:', {
        text: selectionInfo.text,
        position: {
          x: boundingRect.x,
          y: boundingRect.y,
          width: boundingRect.width,
          height: boundingRect.height
        }
      });

    } catch (error) {
      console.error('Error handling text selection:', error);
    }
  }

  // 現在の選択情報を取得
  public getCurrentSelection(): TextSelectionInfo | null {
    return this.currentSelection;
  }

  // 選択をクリア
  public clearSelection() {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
    this.currentSelection = null;
    this.onSelectionChange?.(null);
  }

  // クリーンアップ
  public cleanup() {
    document.removeEventListener('selectionchange', this.handleSelectionChange.bind(this));
    document.removeEventListener('mouseup', this.handleSelectionChange.bind(this));
    window.removeEventListener('beforeunload', this.cleanup.bind(this));
  }
}

// 位置情報の検証
export function validateSelectionInfo(selectionInfo: TextSelectionInfo): boolean {
  return !!(
    selectionInfo.text &&
    selectionInfo.text.length > 0 &&
    selectionInfo.boundingRect &&
    selectionInfo.pageUrl &&
    selectionInfo.timestamp
  );
}

// 位置情報の正規化
export function normalizeSelectionInfo(selectionInfo: TextSelectionInfo): TextSelectionInfo {
  return {
    ...selectionInfo,
    text: selectionInfo.text.trim(),
    pageUrl: new URL(selectionInfo.pageUrl).href,
    timestamp: Date.now()
  };
}
