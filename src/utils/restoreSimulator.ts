import type { RestoreSimulationResult, TextSelectionInfo } from '../types/memo';

export class RestoreSimulator {
  private static currentHighlights: Map<string, HTMLElement> = new Map();
  private static highlightCounter = 0;

  static simulateRestore(originalInfo: TextSelectionInfo): RestoreSimulationResult {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // 1. 復元する箇所を探索
      const exactMatch = this.findRestoredInfo(originalInfo, errors);

      if (!exactMatch) {
        errors.push('No exact text match found');
        return {
          success: false,
          originalInfo,
          restoredInfo: null,
          accuracy: 0,
          processingTime: Date.now() - startTime,
          errors
        };
      }

      // 2. 復元を実行
      const restoredInfo = this.performRestore(exactMatch, originalInfo, errors);

      // 3. 精度を計算
      const accuracy = this.calculateRestoreAccuracy(originalInfo, restoredInfo);

      // 4. 処理時間を計算
      const processingTime = Date.now() - startTime;

      // 5. 結果を作成
      const result: RestoreSimulationResult = {
        success: restoredInfo !== null,
        originalInfo,
        restoredInfo,
        accuracy,
        processingTime,
        errors
      };

      return result;

    } catch (error) {
      const result: RestoreSimulationResult = {
        success: false,
        originalInfo,
        restoredInfo: null,
        accuracy: 0,
        processingTime: Date.now() - startTime,
        errors: [`Simulation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };

      return result;
    }
  }

  /**
   * simulateRestore.performRestore
   * 復元を実行
   */
  private static findRestoredInfo(originalInfo: TextSelectionInfo, errors: string[]): {
    node: Text;
    startOffset: number;
    endOffset: number;
  } | null {
    try {
      // 1. テキストノードの検索
      const textNodes = this.getAllTextNodes();

      if (textNodes.length === 0) {
        errors.push('No text nodes found on page');
        return null;
      }

      // 2. 完全一致するテキストの検索
      const exactMatch = this.findExactTextMatch(originalInfo, textNodes);

      if (!exactMatch) {
        errors.push('No exact text match found');
        return null;
      }

      return exactMatch;
    } catch (error) {
      errors.push(`Simulation error: ${error instanceof Error ? error.message : 'Unknown'}`);
      return null;
    }
  }

  /**
   * simulateRestore.performRestore.getAllTextNodes
   * ページ内のすべてのテキストノードを取得
   */
  private static getAllTextNodes(): Text[] {
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
   * simulateRestore.performRestore.findExactTextMatch
   * 完全一致するテキストを検索
   */
  private static findExactTextMatch(originalInfo: TextSelectionInfo, textNodes: Text[]): {
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
      const textContent = node.textContent || '';
      const index = textContent.indexOf(originalInfo.text);

      if (index === -1) {
        continue;
      }

      // 周辺ノード情報の類似度を計算
      const similarity = this.calculateNodeSimilarity(originalInfo, node);
      
      candidates.push({
        node,
        startOffset: index,
        endOffset: index + originalInfo.text.length,
        similarity
      });
    }

    if (candidates.length === 0) {
      return null;
    }

    // 類似度が最も高い候補を選択
    const bestMatch = candidates.reduce((best, current) => 
      current.similarity > best.similarity ? current : best
    );

    console.log('復元候補の類似度:', candidates.map(c => ({
      text: c.node.textContent?.substring(c.startOffset, c.endOffset),
      similarity: c.similarity
    })));

    return {
      node: bestMatch.node,
      startOffset: bestMatch.startOffset,
      endOffset: bestMatch.endOffset
    };
  }

  /**
   * simulateRestore.performRestore.findExactTextMatch.calculateNodeSimilarity
   * 周辺ノード情報の類似度を計算
   */
  private static calculateNodeSimilarity(originalInfo: TextSelectionInfo, targetNode: Text): number {
    let similarity = 0;
    const maxSimilarity = 1.0;

    try {
      // 1. 親要素の前の兄弟要素の比較 (重み: 0.3)
      const originalPrevSibling = originalInfo.parentPreviousSiblingElement;
      const targetPrevSibling = (targetNode.parentElement as Element)?.previousElementSibling as Element;
      
      if (originalPrevSibling && targetPrevSibling) {
        const prevSimilarity = this.compareElements(originalPrevSibling, targetPrevSibling);
        similarity += prevSimilarity * 0.375;
      }

      // 2. 親要素の次の兄弟要素の比較 (重み: 0.3)
      const originalNextSibling = originalInfo.parentNextSiblingElement;
      const targetNextSibling = (targetNode.parentElement as Element)?.nextElementSibling as Element;
      
      if (originalNextSibling && targetNextSibling) {
        const nextSimilarity = this.compareElements(originalNextSibling, targetNextSibling);
        similarity += nextSimilarity * 0.375;
      }
      
      // 3. 親要素自体の比較 (重み: 0.2)
      const originalParent = originalInfo.startContainer.parentElement as Element;
      const targetParent = targetNode.parentElement as Element;
      
      if (originalParent && targetParent) {
        const parentSimilarity = this.compareElements(originalParent, targetParent);
        similarity += parentSimilarity * 0.25;
      }

    } catch (error) {
      console.error('類似度計算エラー:', error);
      similarity = 0;
    }

    return Math.min(similarity, maxSimilarity);
  }

  /**
   * simulateRestore.performRestore.findExactTextMatch.calculateNodeSimilarity.compareElements
   * 要素の類似度を比較（重み付き平均）
   */
  private static compareElements(element1: Element, element2: Element): number {
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
        const classSimilarity = this.compareStrings(class1, class2);
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
        const textSimilarity = this.compareStrings(text1, text2);
        similarity += textSimilarity * 0.3;
      }

    } catch (error) {
      console.error('要素比較エラー:', error);
      similarity = 0;
    }

    return Math.min(similarity, maxSimilarity);
  }

  /**
   * simulateRestore.performRestore.findExactTextMatch.calculateNodeSimilarity.compareElements.compareStrings
   * 文字列の類似度を比較（簡易版）
   */
  private static compareStrings(str1: string, str2: string): number {
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
   * simulateRestore.performRestore
   */
  private static performRestore(exactMatch: {
    node: Text;
    startOffset: number;
    endOffset: number;
  }, originalInfo: TextSelectionInfo, errors: string[]): TextSelectionInfo | null {
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
      errors.push(`Simulation error: ${error instanceof Error ? error.message : 'Unknown'}`);
      return null;
    }
  }


  /**
   * simulateRestore.performRestore.findExactTextMatch.calculateRestoredBoundingRect
   */
  private static calculateRestoredBoundingRect(match: {
    node: Text;
    startOffset: number;
    endOffset: number;
  }): DOMRect {
    const range = document.createRange();
    range.setStart(match.node, match.startOffset);
    range.setEnd(match.node, match.endOffset);
    return range.getBoundingClientRect();
  }

  private static calculateRestoreAccuracy(original: TextSelectionInfo, restored: TextSelectionInfo | null): number {
    if (!restored) return 0;

    // テキストの完全一致（1.0または0.0）
    const textAccuracy = original.text === restored.text ? 1.0 : 0.0;

    return textAccuracy;
  }


  /**
   * 復元された位置を可視化（復元機能のテスト用途）
   * 背景色付きspanで復元位置をハイライト表示
   */
  static visualizeRestoredPosition(restoredInfo: TextSelectionInfo | null): void {
    if (!restoredInfo) {
      console.log('復元情報がないため可視化をスキップ');
      return;
    }

    try {
      const range = document.createRange();
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

      range.surroundContents(span);
      this.currentHighlights.set(highlightId, span);
      
      console.log(`復元位置 #${this.highlightCounter} を可視化しました:`, {
        text: restoredInfo.text,
        position: {
          x: restoredInfo.boundingRect.x,
          y: restoredInfo.boundingRect.y,
          width: restoredInfo.boundingRect.width,
          height: restoredInfo.boundingRect.height
        }
      });

    } catch (error) {
      console.error('復元位置の可視化に失敗:', error);
    }
  }

  /**
   * 特定の可視化をクリア（復元テスト用途）
   */
  static clearSpecificVisualization(highlightId: string): void {
    const highlight = this.currentHighlights.get(highlightId);
    if (highlight) {
      try {
        const parent = highlight.parentNode;
        if (parent) {
          parent.replaceChild(
            document.createTextNode(highlight.textContent || ''),
            highlight
          );
        }
        this.currentHighlights.delete(highlightId);
        console.log(`可視化 #${highlightId} をクリアしました`);
      } catch (error) {
        console.error(`可視化 #${highlightId} のクリアに失敗:`, error);
      }
    }
  }

  /**
   * 全ての可視化をクリア（復元テスト用途）
   */
  static clearAllVisualizations(): void {
    const highlightIds = Array.from(this.currentHighlights.keys());
    highlightIds.forEach(id => this.clearSpecificVisualization(id));
    this.highlightCounter = 0;
    console.log('全ての可視化をクリアしました');
  }

  /**
   * 現在の可視化一覧を取得（復元テスト用途）
   */
  static getCurrentVisualizations(): Array<{
    id: string;
    text: string;
    color: string;
    timestamp: number;
  }> {
    return Array.from(this.currentHighlights.entries()).map(([id, element]) => ({
      id,
      text: element.textContent || '',
      color: element.style.backgroundColor,
      timestamp: Date.now()
    }));
  }

  /**
   * 復元シミュレーションを実行し、結果を可視化（既存の可視化は保持）
   */
  static simulateRestoreWithVisualization(originalInfo: TextSelectionInfo): RestoreSimulationResult {
    // シミュレーション実行
    const result = this.simulateRestore(originalInfo);

    // 成功した場合のみ可視化（既存の可視化は保持）
    if (result.success && result.restoredInfo) {
      this.visualizeRestoredPosition(result.restoredInfo);
    }

    return result;
  }
}
