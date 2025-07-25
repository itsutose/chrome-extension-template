import type { RestoreSimulationResult, TextSelectionInfo } from '../types/memo';

export class RestoreSimulator {
  private static simulationHistory: RestoreSimulationResult[] = [];
  private static currentHighlight: HTMLElement | null = null;

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
      const textNodes = this.findAllTextNodes();
      if (textNodes.length === 0) {
        errors.push('No text nodes found on page');
        return null;
      }

      // 2. 完全一致するテキストの検索
      const exactMatch = this.findExactTextMatch(originalInfo.text, textNodes);

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

      return restoredInfo;

    } catch (error) {
      errors.push(`Simulation error: ${error instanceof Error ? error.message : 'Unknown'}`);
      return null;
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

  private static findExactTextMatch(targetText: string, textNodes: Text[]): {
    node: Text;
    startOffset: number;
    endOffset: number;
  } | null {
    for (const node of textNodes) {
      const textContent = node.textContent || '';
      const index = textContent.indexOf(targetText);

      if (index !== -1) {
        return {
          node,
          startOffset: index,
          endOffset: index + targetText.length
        };
      }
    }
    return null;
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
    // 既存のハイライトをクリア
    this.clearVisualization();

    if (!restoredInfo) {
      console.log('復元情報がないため可視化をスキップ');
      return;
    }

    try {
      // 復元された位置にspanを挿入
      const range = document.createRange();
      range.setStart(restoredInfo.startContainer, restoredInfo.startOffset);
      range.setEnd(restoredInfo.endContainer, restoredInfo.endOffset);

      const span = document.createElement('span');
      span.style.backgroundColor = '#ffeb3b'; // 黄色の背景
      span.style.color = '#000000'; // 黒文字
      span.style.padding = '2px 4px';
      span.style.borderRadius = '3px';
      span.style.fontWeight = 'bold';
      span.style.position = 'relative';
      span.style.zIndex = '1000';
      span.title = '復元された位置';
      span.id = 'restore-simulator-highlight';

      // 範囲の内容をspanで囲む
      range.surroundContents(span);
      
      this.currentHighlight = span;
      
      console.log('復元位置を可視化しました:', {
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
   * 可視化をクリア
   */
  static clearVisualization(): void {
    if (this.currentHighlight) {
      try {
        // spanを削除して元のテキストに戻す
        const parent = this.currentHighlight.parentNode;
        if (parent) {
          parent.replaceChild(
            document.createTextNode(this.currentHighlight.textContent || ''),
            this.currentHighlight
          );
        }
        this.currentHighlight = null;
        console.log('可視化をクリアしました');
      } catch (error) {
        console.error('可視化のクリアに失敗:', error);
      }
    }
  }

  /**
   * 復元シミュレーションを実行し、結果を可視化
   */
  static simulateRestoreWithVisualization(originalInfo: TextSelectionInfo): RestoreSimulationResult {
    // 既存の可視化をクリア
    this.clearVisualization();

    // シミュレーション実行
    const result = this.simulateRestore(originalInfo);

    // 成功した場合のみ可視化
    if (result.success && result.restoredInfo) {
      this.visualizeRestoredPosition(result.restoredInfo);
    }

    return result;
  }
}
