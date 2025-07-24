import type { PositionValidationResult, TestData, TestStatistics, TextSelectionInfo } from '../types/memo';

export class TestDataManager {
  private static readonly STORAGE_KEY = 'memo_test_data';

  static async saveTestData(testData: TestData): Promise<void> {
    try {
      const existingData = await this.getAllTestData();
      const updatedData = existingData.filter(data => data.id !== testData.id);
      updatedData.push(testData);
      
      await chrome.storage.local.set({ [this.STORAGE_KEY]: updatedData });
      console.log('Test data saved successfully:', testData.id);
    } catch (error) {
      console.error('Failed to save test data:', error);
      throw error;
    }
  }

  static async getTestData(id: string): Promise<TestData | null> {
    try {
      const allData = await this.getAllTestData();
      return allData.find(data => data.id === id) || null;
    } catch (error) {
      console.error('Failed to get test data:', error);
      return null;
    }
  }

  static async getAllTestData(): Promise<TestData[]> {
    try {
      const result = await chrome.storage.local.get([this.STORAGE_KEY]);
      return result[this.STORAGE_KEY] || [];
    } catch (error) {
      console.error('Failed to get all test data:', error);
      return [];
    }
  }

  static async deleteTestData(id: string): Promise<void> {
    try {
      const existingData = await this.getAllTestData();
      const updatedData = existingData.filter(data => data.id !== id);
      
      await chrome.storage.local.set({ [this.STORAGE_KEY]: updatedData });
      console.log('Test data deleted successfully:', id);
    } catch (error) {
      console.error('Failed to delete test data:', error);
      throw error;
    }
  }

  static async clearAllTestData(): Promise<void> {
    try {
      await chrome.storage.local.remove([this.STORAGE_KEY]);
      console.log('All test data cleared successfully');
    } catch (error) {
      console.error('Failed to clear all test data:', error);
      throw error;
    }
  }

  static createTestData(
    pageUrl: string,
    testCases: TextSelectionInfo[],
    results: PositionValidationResult[]
  ): TestData {
    const id = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const statistics: TestStatistics = {
      totalTests: results.length,
      successfulRestores: results.filter(r => r.isValid).length,
      failedRestores: results.filter(r => !r.isValid).length,
      averageAccuracy: results.reduce((sum, r) => sum + r.accuracy, 0) / results.length,
      averageProcessingTime: results.reduce((sum, r) => sum + (Date.now() - r.timestamp), 0) / results.length,
      lastTestTime: Date.now()
    };

    return {
      id,
      pageUrl,
      testCases,
      results,
      statistics,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  static async updateTestData(id: string, updates: Partial<TestData>): Promise<void> {
    try {
      const existingData = await this.getTestData(id);
      if (!existingData) {
        throw new Error(`Test data with id ${id} not found`);
      }

      const updatedData: TestData = {
        ...existingData,
        ...updates,
        updatedAt: Date.now()
      };

      await this.saveTestData(updatedData);
    } catch (error) {
      console.error('Failed to update test data:', error);
      throw error;
    }
  }

  static async exportTestData(id?: string): Promise<string> {
    try {
      let dataToExport: TestData | TestData[];
      
      if (id) {
        const data = await this.getTestData(id);
        if (!data) {
          throw new Error(`Test data with id ${id} not found`);
        }
        dataToExport = data;
      } else {
        dataToExport = await this.getAllTestData();
      }

      return JSON.stringify(dataToExport, null, 2);
    } catch (error) {
      console.error('Failed to export test data:', error);
      throw error;
    }
  }

  static async importTestData(jsonData: string): Promise<void> {
    try {
      const importedData = JSON.parse(jsonData);
      
      if (Array.isArray(importedData)) {
        for (const data of importedData) {
          await this.saveTestData(data);
        }
      } else {
        await this.saveTestData(importedData);
      }
      
      console.log('Test data imported successfully');
    } catch (error) {
      console.error('Failed to import test data:', error);
      throw error;
    }
  }

  static async getOverallStatistics(): Promise<TestStatistics> {
    try {
      const allData = await this.getAllTestData();
      
      if (allData.length === 0) {
        return {
          totalTests: 0,
          successfulRestores: 0,
          failedRestores: 0,
          averageAccuracy: 0,
          averageProcessingTime: 0,
          lastTestTime: 0
        };
      }

      const allResults = allData.flatMap(data => data.results);
      const totalTests = allResults.length;
      const successfulRestores = allResults.filter(r => r.isValid).length;
      const failedRestores = totalTests - successfulRestores;
      const averageAccuracy = allResults.reduce((sum, r) => sum + r.accuracy, 0) / totalTests;
      const averageProcessingTime = allResults.reduce((sum, r) => sum + (Date.now() - r.timestamp), 0) / totalTests;
      const lastTestTime = Math.max(...allData.map(d => d.lastTestTime || 0));

      return {
        totalTests,
        successfulRestores,
        failedRestores,
        averageAccuracy,
        averageProcessingTime,
        lastTestTime
      };
    } catch (error) {
      console.error('Failed to get overall statistics:', error);
      throw error;
    }
  }

  static async getPageStatistics(pageUrl: string): Promise<TestStatistics> {
    try {
      const allData = await this.getAllTestData();
      const pageData = allData.filter(data => data.pageUrl === pageUrl);
      
      if (pageData.length === 0) {
        return {
          totalTests: 0,
          successfulRestores: 0,
          failedRestores: 0,
          averageAccuracy: 0,
          averageProcessingTime: 0,
          lastTestTime: 0
        };
      }

      const allResults = pageData.flatMap(data => data.results);
      const totalTests = allResults.length;
      const successfulRestores = allResults.filter(r => r.isValid).length;
      const failedRestores = totalTests - successfulRestores;
      const averageAccuracy = allResults.reduce((sum, r) => sum + r.accuracy, 0) / totalTests;
      const averageProcessingTime = allResults.reduce((sum, r) => sum + (Date.now() - r.timestamp), 0) / totalTests;
      const lastTestTime = Math.max(...pageData.map(d => d.lastTestTime || 0));

      return {
        totalTests,
        successfulRestores,
        failedRestores,
        averageAccuracy,
        averageProcessingTime,
        lastTestTime
      };
    } catch (error) {
      console.error('Failed to get page statistics:', error);
      throw error;
    }
  }
} 