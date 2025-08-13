import type { TextSelectionInfo } from '../../shared/types/memo';
import { MemoUIRegistry } from './memoUIRegistry';

export class RestoreMemoPosition {
  private static currentHighlights: Map<string, HTMLElement> = new Map();
  private static highlightCounter = 0;

  /**
   * 復元位置を探索する
   */
  static findRestoredInfo(originalInfo: TextSelectionInfo): {
    node: Text;
    startOffset: number;
    endOffset: number;
  } | null {
    const errors: string[] = [];
    try {
      // 1. テキストノードの検索
      const textNodes = this._getAllTextNodes();

      if (textNodes.length === 0) {
        errors.push('No text nodes found on page');
        return null;
      }

      // 2. 完全一致するテキストの検索
      const exactMatch = this._findExactTextMatch(originalInfo, textNodes);

      if (!exactMatch) {
        errors.push('No exact text match found');
        return null;
      }

      return exactMatch;
    } catch (error) {
      errors.push(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      return null;
    }
  }

  /**
   * ページ内のすべてのテキストノードを取得
   */
  private static _getAllTextNodes(): Text[] {
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

  /**
   * 完全一致するテキストを検索
   */
  private static _findExactTextMatch(originalInfo: TextSelectionInfo, textNodes: Text[]): {
    node: Text;
    startOffset: number;
    endOffset: number;
  } | null {
    const candidates: Array<{
      node: Text;
      startOffset: number;
      endOffset: number;
      similarity: number;
    }> = [];

    for (const node of textNodes) {
      const textContent = node.textContent ?? '';
      if (textContent.length === 0 || originalInfo.text.length === 0) {
        continue;
      }

      // 周辺ノード情報の類似度を計算（ノード単位で一定）
      const similarity = this._calculateNodeSimilarity(originalInfo, node);

      // 同一ノード内の全一致を列挙（オーバーラップも許容）
      let fromIndex = 0;
      while (true) {
        const index = textContent.indexOf(originalInfo.text, fromIndex);
        if (index === -1) break;

        candidates.push({
          node,
          startOffset: index,
          endOffset: index + originalInfo.text.length,
          similarity
        });

        fromIndex = index + 1; // 次位置へ（オーバーラップ対応）
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    // オフセット類似度も加味した総合スコアで選択し、同点なら originalInfo のオフセット比に最も近いものを優先
    const scored = candidates.map(c => {
      const { similarity: offsetSimilarity, distance: offsetDistance } = this._calculateOffsetSimilarity(
        originalInfo,
        c.node,
        c.startOffset,
        c.endOffset
      );
      const combinedSimilarity = c.similarity * 0.7 + offsetSimilarity * 0.3;
      return { ...c, offsetSimilarity, offsetDistance, combinedSimilarity };
    });

    scored.sort((a, b) => {
      if (b.combinedSimilarity !== a.combinedSimilarity) {
        return b.combinedSimilarity - a.combinedSimilarity;
      }
      if (a.offsetDistance !== b.offsetDistance) {
        return a.offsetDistance - b.offsetDistance;
      }
      // 最後のタイブレーク: 早い位置を優先
      return a.startOffset - b.startOffset;
    });

    const bestMatch = scored[0];

    console.log('復元候補の類似度:', scored.map(c => ({
      text: c.node.textContent?.substring(c.startOffset, c.endOffset),
      nodeSimilarity: c.similarity,
      offsetSimilarity: c.offsetSimilarity,
      combinedSimilarity: c.combinedSimilarity,
      offsetDistance: c.offsetDistance
    })));

    return {
      node: bestMatch.node,
      startOffset: bestMatch.startOffset,
      endOffset: bestMatch.endOffset
    };
  }

  /**
   * originalInfo の start/endOffset と候補のオフセットの近さを 0..1 の類似度に変換
   * 比較のためにノード長で正規化して比率空間で距離を算出
   */
  private static _calculateOffsetSimilarity(
    originalInfo: TextSelectionInfo,
    targetNode: Text,
    candidateStartOffset: number,
    candidateEndOffset: number
  ): { similarity: number; distance: number } {
    try {
      const originalNode = originalInfo.startContainer as Text | null;
      const originalLength = originalNode?.textContent?.length ?? 0;
      const targetLength = targetNode.textContent?.length ?? 0;

      if (originalLength <= 0 || targetLength <= 0) {
        return { similarity: 0, distance: 1 };
      }

      const originalStartRatio = Math.min(Math.max(originalInfo.startOffset / originalLength, 0), 1);
      const originalEndRatio = Math.min(Math.max(originalInfo.endOffset / originalLength, 0), 1);
      const targetStartRatio = Math.min(Math.max(candidateStartOffset / targetLength, 0), 1);
      const targetEndRatio = Math.min(Math.max(candidateEndOffset / targetLength, 0), 1);

      const distance = Math.abs(originalStartRatio - targetStartRatio) + Math.abs(originalEndRatio - targetEndRatio);
      const normalized = Math.min(distance / 2, 1); // 0..1
      const similarity = 1 - normalized;
      return { similarity, distance };
    } catch {
      return { similarity: 0, distance: 1 };
    }
  }

  /**
   * 周辺ノード情報の類似度を計算
   */
  private static _calculateNodeSimilarity(originalInfo: TextSelectionInfo, targetNode: Text): number {
    let similarity = 0;
    const maxSimilarity = 1.0;

    try {
      // 1. 親要素の前の兄弟要素の比較 (重み: 0.3)
      const originalPrevSibling = originalInfo.parentPreviousSiblingElement;
      const targetPrevSibling = (targetNode.parentElement as Element)?.previousElementSibling as Element;
      
      if (originalPrevSibling && targetPrevSibling) {
        const prevSimilarity = this._compareElements(originalPrevSibling, targetPrevSibling);
        similarity += prevSimilarity * 0.375;
      }

      // 2. 親要素の次の兄弟要素の比較 (重み: 0.3)
      const originalNextSibling = originalInfo.parentNextSiblingElement;
      const targetNextSibling = (targetNode.parentElement as Element)?.nextElementSibling as Element;
      
      if (originalNextSibling && targetNextSibling) {
        const nextSimilarity = this._compareElements(originalNextSibling, targetNextSibling);
        similarity += nextSimilarity * 0.375;
      }
      
      // 3. 親要素自体の比較 (重み: 0.2)
      const originalParent = originalInfo.startContainer.parentElement as Element;
      const targetParent = targetNode.parentElement as Element;
      
      if (originalParent && targetParent) {
        const parentSimilarity = this._compareElements(originalParent, targetParent);
        similarity += parentSimilarity * 0.25;
      }

    } catch (error) {
      console.error('類似度計算エラー:', error);
      similarity = 0;
    }

    return Math.min(similarity, maxSimilarity);
  }

  /**
   * 要素の類似度を比較（重み付き平均）
   */
  private static _compareElements(element1: Element, element2: Element): number {
    let similarity = 0;
    const maxSimilarity = 1.0;

    try {
      // 1. タグ名の比較 (重み: 0.3)
      if (element1.tagName === element2.tagName) {
        similarity += 0.3;
      }

      // 2. クラス名の比較 (重み: 0.3)
      const class1 = element1.className || '';
      const class2 = element2.className || '';
      if (class1 && class2) {
        const classSimilarity = this._compareStrings(class1, class2);
        similarity += classSimilarity * 0.3;
      }

      // 3. IDの比較 (重み: 0.2)
      const id1 = element1.id || '';
      const id2 = element2.id || '';
      if (id1 && id2 && id1 === id2) {
        similarity += 0.1;
      }

      // 4. テキスト内容の比較 (重み: 0.2)
      const text1 = element1.textContent?.trim() || '';
      const text2 = element2.textContent?.trim() || '';
      if (text1 && text2) {
        const textSimilarity = this._compareStrings(text1, text2);
        similarity += textSimilarity * 0.3;
      }

    } catch (error) {
      console.error('要素比較エラー:', error);
      similarity = 0;
    }

    return Math.min(similarity, maxSimilarity);
  }

  /**
   * 文字列の類似度を比較（簡易版）
   */
  private static _compareStrings(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.length === 0 || str2.length === 0) return 0.0;

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    // 共通部分文字列の長さを計算
    let commonLength = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (shorter[i] === longer[i]) {
        commonLength++;
      }
    }

    return commonLength / longer.length;
  }

  /**
   * 復元情報を作成する（内部実装）
   */
  static createRestoreInfo(exactMatch: {
    node: Text;
    startOffset: number;
    endOffset: number;
  }, originalInfo: TextSelectionInfo): TextSelectionInfo | null {
    const errors: string[] = [];
    try {
   
      // 3. 復元された位置情報の作成
      const restoredInfo: TextSelectionInfo = {
        ...originalInfo,
        startContainer: exactMatch.node,
        endContainer: exactMatch.node,
        startOffset: exactMatch.startOffset,
        endOffset: exactMatch.endOffset,
        boundingRect: this.calculateRestoredBoundingRect(exactMatch),
        timestamp: Date.now()
      };

      console.log('restoredInfo size:', new TextEncoder().encode(JSON.stringify(restoredInfo)).length, 'bytes');
      return restoredInfo;

    } catch (error) {
      errors.push(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
      return null;
    }
  }


  /**
   * 復元された位置の境界矩形を計算
   */
  private static calculateRestoredBoundingRect(match: {
    node: Text;
    startOffset: number;
    endOffset: number;
  }): DOMRect {
    const range: Range = document.createRange();
    range.setStart(match.node, match.startOffset);
    range.setEnd(match.node, match.endOffset);
    return range.getBoundingClientRect();
  }

  /**
   * 実際の復元を実行する
   * 復元情報をもとにDOM操作で実際の復元を行う
   */
  static restorePosition(restoredInfo: TextSelectionInfo | null, memoId?: string): boolean {
    if (!restoredInfo) {
      console.log('復元情報がないため復元をスキップ');
      return false;
    }

    try {
      const range: Range = document.createRange();
      range.setStart(restoredInfo.startContainer, restoredInfo.startOffset);
      range.setEnd(restoredInfo.endContainer, restoredInfo.endOffset);

      const highlightId = `restore-highlight-${++this.highlightCounter}`;
      const span = document.createElement('span');
      
      // 復元位置のハイライト用スタイル
      span.style.backgroundColor = '#ffeb3b'; // 黄色
      span.style.color = '#000000';
      span.style.position = 'relative';
      span.style.zIndex = '1000';
      span.title = `復元位置 #${this.highlightCounter}`;
      span.id = highlightId;
      
      // メモIDベースのデータ属性も追加（検索用）
      if (memoId) {
        span.dataset.memoId = memoId;
      }

      range.surroundContents(span);
      this.currentHighlights.set(highlightId, span);

      // メモIDが与えられていれば、ハイライトクリックでトグル
      if (memoId) {
        span.style.cursor = 'pointer';
        span.addEventListener('click', (e) => {
          e.stopPropagation();
          MemoUIRegistry.toggleMemo(memoId);
        });
        
        // span要素をレジストリに登録
        MemoUIRegistry.registerSpanElement(memoId, span);
      }
      
      console.log(`復元位置 #${this.highlightCounter} を復元しました:`, {
        text: restoredInfo.text,
        position: {
          x: restoredInfo.boundingRect.x,
          y: restoredInfo.boundingRect.y,
          width: restoredInfo.boundingRect.width,
          height: restoredInfo.boundingRect.height
        }
      });

      return true;

    } catch (error) {
      console.error('復元位置の復元に失敗:', error);
      return false;
    }
  }

}
