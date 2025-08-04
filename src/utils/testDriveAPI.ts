import { ensureAppFolder, listAllMemoFiles } from './memoStorage';

// Google Drive API連携のテスト関数
export async function testGoogleDriveConnection(): Promise<void> {
  try {
    console.log('=== Google Drive API連携テスト開始 ===');
    
    // 1. アプリフォルダの取得/作成テスト
    console.log('1. アプリフォルダの取得/作成...');
    const folderId = await ensureAppFolder();
    console.log('✅ アプリフォルダ取得成功:', folderId);
    
    // 2. ファイル一覧の取得テスト
    console.log('2. ファイル一覧の取得...');
    const files = await listAllMemoFiles();
    console.log('✅ ファイル一覧取得成功:', files.length, '件');
    
    console.log('=== Google Drive API連携テスト完了 ===');
  } catch (error) {
    console.error('❌ Google Drive API連携テスト失敗:', error);
    throw error;
  }
}

// テスト実行用の関数（開発者ツールから呼び出し可能）
(window as any).testGoogleDriveConnection = testGoogleDriveConnection; 