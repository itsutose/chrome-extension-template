export type MemoToggleHandler = () => void;
export type MemoPositionUpdater = (rect: DOMRect) => void;

/**
 * メモUIのトグル関数とspan要素の参照を管理するレジストリ
 */
export class MemoUIRegistry {
  private static memoIdToToggleHandler: Map<string, MemoToggleHandler> = new Map();
  private static memoIdToSpanElement: Map<string, HTMLElement> = new Map();
  private static memoIdToPositionUpdater: Map<string, MemoPositionUpdater> = new Map();

  static registerToggleHandler(memoId: string, handler: MemoToggleHandler): void {
    this.memoIdToToggleHandler.set(memoId, handler);
  }

  static unregisterToggleHandler(memoId: string): void {
    this.memoIdToToggleHandler.delete(memoId);
  }

  static registerSpanElement(memoId: string, spanElement: HTMLElement): void {
    this.memoIdToSpanElement.set(memoId, spanElement);
  }

  static unregisterSpanElement(memoId: string): void {
    this.memoIdToSpanElement.delete(memoId);
  }

  static registerPositionUpdater(memoId: string, updater: MemoPositionUpdater): void {
    this.memoIdToPositionUpdater.set(memoId, updater);
  }

  static unregisterPositionUpdater(memoId: string): void {
    this.memoIdToPositionUpdater.delete(memoId);
  }

  static toggleMemo(memoId: string): void {
    const handler = this.memoIdToToggleHandler.get(memoId);
    if (handler) {
      handler();
      // トグル後に位置を更新（表示状態変更後に実行）
      requestAnimationFrame(() => {
        this.updateMemoPosition(memoId);
      });
    }
  }

  static updateMemoPosition(memoId: string): boolean {
    const spanElement = this.memoIdToSpanElement.get(memoId);
    const positionUpdater = this.memoIdToPositionUpdater.get(memoId);
    
    if (spanElement && positionUpdater) {
      const rect = spanElement.getBoundingClientRect();
      positionUpdater(rect);
      return true;
    }
    return false;
  }

  static cleanup(memoId: string): void {
    this.unregisterToggleHandler(memoId);
    this.unregisterSpanElement(memoId);
    this.unregisterPositionUpdater(memoId);
  }
}
