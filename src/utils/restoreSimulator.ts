import type { RestoreSimulationResult, TextSelectionInfo } from '../types/memo';

export class RestoreSimulator {
  private static simulationHistory: RestoreSimulationResult[] = [];
  private static currentHighlights: Map<string, HTMLElement> = new Map();
  private static highlightCounter = 0;

  static simulateRestore(originalInfo: TextSelectionInfo): RestoreSimulationResult {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // 1. 復元シミュレーションを実行
      const restoredInfo = this.performRestoreSimulation(originalInfo, errors);

      // 2. 精度を計算
      const accuracy = this.calculateRestoreAccuracy(originalInfo, restoredInfo);

      // 3. 処理時間を計算
      const processingTime = Date.now() - startTime;

      // 4. 結果を作成
      const result: RestoreSimulationResult = {
        success: restoredInfo !== null,
        originalInfo,
        restoredInfo,
        accuracy,
        processingTime,
        errors
      };

      // 5. 履歴に追加
      this.simulationHistory.push(result);

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

      this.simulationHistory.push(result);
      return result;
    }
  }

  private static performRestoreSimulation(originalInfo: TextSelectionInfo, errors: string[]): TextSelectionInfo | null {
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
        similarity += prevSimilarity * 0.3;
      }

      // 2. 親要素の次の兄弟要素の比較 (重み: 0.3)
      const originalNextSibling = originalInfo.parentNextSiblingElement;
      const targetNextSibling = (targetNode.parentElement as Element)?.nextElementSibling as Element;
      
      if (originalNextSibling && targetNextSibling) {
        const nextSimilarity = this.compareElements(originalNextSibling, targetNextSibling);
        similarity += nextSimilarity * 0.3;
      }
      
      // 3. 親要素自体の比較 (重み: 0.2)
      const originalParent = originalInfo.startContainer.parentElement as Element;
      const targetParent = targetNode.parentElement as Element;
      
      if (originalParent && targetParent) {
        const parentSimilarity = this.compareElements(originalParent, targetParent);
        similarity += parentSimilarity * 0.2;
      }

      // 4. 位置情報の比較 (重み: 0.2)
      const positionSimilarity = this.calculatePositionSimilarity(originalInfo, targetNode);
      similarity += positionSimilarity * 0.2;

    } catch (error) {
      console.error('類似度計算エラー:', error);
      similarity = 0;
    }

    return Math.min(similarity, maxSimilarity);
  }

  /**
   * 要素の類似度を比較
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
        similarity += 0.2;
      }

      // 4. テキスト内容の比較 (重み: 0.2)
      const text1 = element1.textContent?.trim() || '';
      const text2 = element2.textContent?.trim() || '';
      if (text1 && text2) {
        const textSimilarity = this.compareStrings(text1, text2);
        similarity += textSimilarity * 0.2;
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
   * 位置情報の類似度を計算
   */
  private static calculatePositionSimilarity(originalInfo: TextSelectionInfo, targetNode: Text): number {
    try {
      // 対象ノードの位置を計算
      const range = document.createRange();
      range.selectNodeContents(targetNode);
      const targetRect = range.getBoundingClientRect();

      // 元の位置との距離を計算
      const originalRect = originalInfo.boundingRect;
      const maxDistance = Math.max(window.innerWidth, window.innerHeight);
      
      const centerDistance = Math.sqrt(
        Math.pow(originalRect.left + originalRect.width / 2 - (targetRect.left + targetRect.width / 2), 2) +
        Math.pow(originalRect.top + originalRect.height / 2 - (targetRect.top + targetRect.height / 2), 2)
      );

      // 距離を類似度に変換（距離が近いほど類似度が高い）
      return Math.max(0, 1 - centerDistance / maxDistance);

    } catch (error) {
      console.error('位置類似度計算エラー:', error);
      return 0;
    }
  }

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

    // 位置の一致度
    const positionAccuracy = this.calculatePositionAccuracy(original.boundingRect, restored.boundingRect);

    // 重み付き平均（テキスト: 60%, 位置: 40%）
    return textAccuracy * 0.6 + positionAccuracy * 0.4;
  }

  private static calculatePositionAccuracy(originalRect: DOMRect, restoredRect: DOMRect): number {
    const maxDistance = Math.max(window.innerWidth, window.innerHeight);
    
    const centerDistance = Math.sqrt(
      Math.pow(originalRect.left + originalRect.width / 2 - (restoredRect.left + restoredRect.width / 2), 2) +
      Math.pow(originalRect.top + originalRect.height / 2 - (restoredRect.top + restoredRect.height / 2), 2)
    );

    return Math.max(0, 1 - centerDistance / maxDistance);
  }

  static getSimulationHistory(): RestoreSimulationResult[] {
    return [...this.simulationHistory];
  }

  static getStatistics(): {
    totalSimulations: number;
    successfulRestores: number;
    failedRestores: number;
    averageAccuracy: number;
    averageProcessingTime: number;
    } {
    const total = this.simulationHistory.length;
    const successful = this.simulationHistory.filter(result => result.success).length;
    const failed = total - successful;
    
    const totalAccuracy = this.simulationHistory.reduce((sum, result) => sum + result.accuracy, 0);
    const totalTime = this.simulationHistory.reduce((sum, result) => sum + result.processingTime, 0);

    return {
      totalSimulations: total,
      successfulRestores: successful,
      failedRestores: failed,
      averageAccuracy: total > 0 ? totalAccuracy / total : 0,
      averageProcessingTime: total > 0 ? totalTime / total : 0
    };
  }

  static clearHistory(): void {
    this.simulationHistory = [];
  }

  /**
   * 復元された位置を可視化（背景色付きspanで表示）
   */
  static visualizeRestoredPosition(restoredInfo: TextSelectionInfo | null): void {
    if (!restoredInfo) {
      console.log('復元情報がないため可視化をスキップ');
      return;
    }

    try {
      // 復元された位置にspanを挿入
      const range = document.createRange();
      range.setStart(restoredInfo.startContainer, restoredInfo.startOffset);
      range.setEnd(restoredInfo.endContainer, restoredInfo.endOffset);

      const highlightId = `restore-highlight-${++this.highlightCounter}`;
      const span = document.createElement('span');
      
      // 色をランダムに選択（見分けやすくするため）
      const colors = [
        '#ffeb3b', // 黄色
        '#4caf50', // 緑
        '#2196f3', // 青
        '#ff9800', // オレンジ
        '#9c27b0', // 紫
        '#f44336', // 赤
        '#00bcd4', // シアン
        '#ff5722'  // ディープオレンジ
      ];
      const colorIndex = (this.highlightCounter - 1) % colors.length;
      
      span.style.backgroundColor = colors[colorIndex];
      span.style.color = '#000000'; // 黒文字
      span.style.padding = '2px 4px';
      span.style.borderRadius = '3px';
      span.style.fontWeight = 'bold';
      span.style.position = 'relative';
      span.style.zIndex = '1000';
      span.style.border = '1px solid #333';
      span.title = `復元位置 #${this.highlightCounter}`;
      span.id = highlightId;

      // 範囲の内容をspanで囲む
      range.surroundContents(span);
      
      // 履歴に追加
      this.currentHighlights.set(highlightId, span);
      
      console.log(`復元位置 #${this.highlightCounter} を可視化しました:`, {
        text: restoredInfo.text,
        position: {
          x: restoredInfo.boundingRect.x,
          y: restoredInfo.boundingRect.y,
          width: restoredInfo.boundingRect.width,
          height: restoredInfo.boundingRect.height
        },
        color: colors[colorIndex]
      });

    } catch (error) {
      console.error('復元位置の可視化に失敗:', error);
    }
  }

  /**
   * 特定の可視化をクリア
   */
  static clearSpecificVisualization(highlightId: string): void {
    const highlight = this.currentHighlights.get(highlightId);
    if (highlight) {
      try {
        // spanを削除して元のテキストに戻す
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
   * 全ての可視化をクリア
   */
  static clearAllVisualizations(): void {
    const highlightIds = Array.from(this.currentHighlights.keys());
    highlightIds.forEach(id => this.clearSpecificVisualization(id));
    this.highlightCounter = 0;
    console.log('全ての可視化をクリアしました');
  }

  /**
   * 現在の可視化一覧を取得
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
