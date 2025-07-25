import type { PositionValidationResult, TextSelectionInfo } from '../types/memo';

/**
 * テキスト選択位置の検証
 * 
 * 選択した際に選択情報の妥当性チェックし復元可能か判定する
 * 実際の復元処理は実行しない
 * 
 * @param selectionInfo - 検証対象のテキスト選択位置情報
 */
export class PositionValidator {
  static validateSelectionInfo(selectionInfo: TextSelectionInfo): PositionValidationResult {
    const startTime = Date.now();
    
    try {
      // 1. 入力データの検証
      if (!selectionInfo || !selectionInfo.text || selectionInfo.text.trim() === '') {
        // selectionInfoがnullまたはテキストが空の場合は無効
        return {
          isValid: false,
          accuracy: 0,
          originalPosition: selectionInfo,
          restoredPosition: null,
          error: 'Invalid selection info: empty or missing text',
          timestamp: startTime
        };
      }

      // 2. 現在のページからテキストノードを取得
      const textNodes = this.findAllTextNodes();
      if (textNodes.length === 0) {
        // ページ内にテキストノードが存在しない場合は無効
        return {
          isValid: false,
          accuracy: 0,
          originalPosition: selectionInfo,
          restoredPosition: null,
          error: 'No text nodes found on page',
          timestamp: startTime
        };
      }

      // 3. 完全一致するノードを選択
      const exactMatch = this.findExactMatch(selectionInfo, textNodes);

      if (!exactMatch) {
        // 完全一致するノードが見つからない場合は無効
        return {
          isValid: false,
          accuracy: 0,
          originalPosition: selectionInfo,
          restoredPosition: null,
          error: 'No exact text match found',
          timestamp: startTime
        };
      }

      // 4. 復元された位置情報を作成
      const restoredInfo: TextSelectionInfo = {
        ...selectionInfo,
        startContainer: exactMatch.node,
        endContainer: exactMatch.node,
        startOffset: exactMatch.startOffset,
        endOffset: exactMatch.endOffset,
        boundingRect: this.calculateBoundingRect(exactMatch.node, exactMatch.startOffset, exactMatch.endOffset),
        timestamp: Date.now()
      };

      // 5. 精度を計算
      const accuracy = this.calculateAccuracy(selectionInfo, restoredInfo);

      return {
        isValid: true,
        accuracy,
        originalPosition: selectionInfo,
        restoredPosition: restoredInfo,
        timestamp: Date.now()
      };

    } catch (error) {
      return {
        isValid: false,
        accuracy: 0,
        originalPosition: selectionInfo,
        restoredPosition: null,
        error: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: startTime
      };
    }
  }

  private static findAllTextNodes(): Text[] {
    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const text = node.textContent?.trim();
          return text && text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    let node: Node | null;
    while ((node = walker.nextNode()) !== null) {
      textNodes.push(node as Text);
    }

    return textNodes;
  }

  private static findExactMatch(originalInfo: TextSelectionInfo, textNodes: Text[]): {
    node: Text;
    startOffset: number;
    endOffset: number;
  } | null {
    // ページ内のテキストノードを検索
    for (const node of textNodes) {
      const textContent = node.textContent || '';
      const index = textContent.indexOf(originalInfo.text);

      // テキストが一致する場合は復元位置を返す
      if (index !== -1) {
        return {
          node,
          startOffset: index,
          endOffset: index + originalInfo.text.length
        };
      }
    }
    return null;
  }

  private static calculateBoundingRect(node: Text, startOffset: number, endOffset: number): DOMRect {
    const range = document.createRange();
    range.setStart(node, startOffset);
    range.setEnd(node, endOffset);
    return range.getBoundingClientRect();
  }

  private static calculateAccuracy(original: TextSelectionInfo, restored: TextSelectionInfo | null): number {
    if (!restored) return 0;

    // テキストの完全一致（1.0または0.0）
    const textAccuracy = original.text === restored.text ? 1.0 : 0.0;

    return textAccuracy;
  }
}
