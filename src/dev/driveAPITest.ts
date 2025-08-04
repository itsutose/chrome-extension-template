import { ensureAppFolder, listAllMemoFiles } from '../features/memo/memoStorage';
import { getGoogleAuthToken } from '../features/auth/oauth';

/**
 * 統合されたGoogle Drive API テスト・デバッグユーティリティ
 * 
 * 機能:
 * - 基本的なAPI接続テスト
 * - ファイル一覧取得（基本・詳細・全ファイル）
 * - アプリフォルダー管理テスト
 * - 権限・スコープ確認
 * - デバッグ用詳細情報出力
 */

// ================================================================================
// メイン関数群
// ================================================================================

/**
 * 基本的なGoogle Drive API接続テスト
 */
export async function testBasicConnection(): Promise<void> {
  try {
    console.log('=== Google Drive API基本接続テスト開始 ===');
    
    // 1. アプリフォルダの取得/作成テスト
    console.log('1. アプリフォルダの取得/作成...');
    const folderId = await ensureAppFolder();
    console.log('✅ アプリフォルダ取得成功:', folderId);
    
    // 2. ファイル一覧の取得テスト
    console.log('2. ファイル一覧の取得...');
    const files = await listAllMemoFiles();
    console.log('✅ ファイル一覧取得成功:', files.length, '件');
    
    console.log('=== 基本接続テスト完了 ===');
  } catch (error) {
    console.error('❌ 基本接続テスト失敗:', error);
    throw error;
  }
}

/**
 * 詳細なGoogle Drive API デバッグ
 */
export async function debugDriveAPI(): Promise<void> {
  try {
    console.log('=== Google Drive API詳細デバッグ開始 ===');
    
    const token = await getGoogleAuthToken();
    console.log('✅ 認証トークン取得成功');
    
    // 1. 基本的なファイル一覧（フィルターなし）
    console.log('\n🔍 1. 基本ファイル一覧（制限なし）');
    await testBasicFileList(token);
    
    // 2. Chrome Memo Extension フォルダーを特定
    console.log('\n🔍 2. Chrome Memo Extension フォルダー検索');
    const folderId = await findChromeMemoFolder(token);
    
    if (folderId) {
      // 3. フォルダー内のファイルを直接検索
      console.log('\n🔍 3. フォルダー内ファイルの直接検索');
      await testFolderContents(token, folderId);
    }
    
    // 4. 権限とスコープの確認
    console.log('\n🔍 4. 現在の権限範囲確認');
    await testPermissions(token);
    
    console.log('\n=== デバッグ完了 ===');
    
  } catch (error) {
    console.error('❌ デバッグエラー:', error);
    console.log(`デバッグエラー: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * ユーザーの全Google Driveファイル詳細一覧を取得
 * ※広範囲なアクセス権限が必要
 */
export async function testDetailedFileList(): Promise<void> {
  try {
    console.log('=== 詳細ファイル一覧テスト開始 ===');
    console.log('⚠️ 注意: このテストには広範囲のDriveアクセス権限が必要です');
    
    const token = await getGoogleAuthToken();
    console.log('✅ 認証トークン取得成功');
    
    // 詳細情報含むファイル一覧を取得
    const response = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=100&includeItemsFromAllDrives=true&supportsAllDrives=true&q=trashed=false&fields=files(id,name,mimeType,createdTime,modifiedTime,size,parents,webViewLink)', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ ファイル一覧取得成功');
    
    if (data.files && data.files.length > 0) {
      console.log(`📁 詳細ファイル一覧 (${data.files.length}件):`);
      
      // フォルダー構造のマップを作成
      const folderMap = new Map();
      data.files.forEach((file: any) => {
        if (file.mimeType === 'application/vnd.google-apps.folder') {
          folderMap.set(file.id, file.name);
        }
      });
      
      // フォルダー別にファイルを分類
      const rootFiles: any[] = [];
      const folderFiles = new Map();
      
      data.files.forEach((file: any) => {
        if (!file.parents || file.parents.length === 0) {
          rootFiles.push(file);
        } else {
          const parentId = file.parents[0];
          if (!folderFiles.has(parentId)) {
            folderFiles.set(parentId, []);
          }
          folderFiles.get(parentId).push(file);
        }
      });
      
      // ルートレベルのファイルを表示
      console.log('\n📂 ルートレベルのファイル:');
      displayFileList(rootFiles);
      
      // フォルダー内のファイルを表示
      folderMap.forEach((folderName, folderId) => {
        const files = folderFiles.get(folderId);
        if (files && files.length > 0) {
          console.log(`\n📁 フォルダー "${folderName}" 内のファイル:`);
          displayFileList(files);
        }
      });
      
      // サマリー表示
      const summary = generateSummary(data.files);
      console.log('\n📊 サマリー:', summary);
    } else {
      console.log('📭 ファイルが見つかりませんでした');
    }
    
    console.log('=== 詳細ファイル一覧テスト完了 ===');
  } catch (error) {
    console.error('❌ 詳細ファイル一覧テスト失敗:', error);
    console.log(`エラー: ${error instanceof Error ? error.message : String(error)}\n\n現在のスコープでは全ファイルアクセスができない可能性があります。`);
  }
}

/**
 * 全ファイル一覧の簡易版（アラート表示付き）
 * ※デバッグ用
 */
export async function testAllFilesList(): Promise<void> {
  try {
    console.log('=== 全ファイル一覧（簡易版）テスト開始 ===');
    
    const token = await getGoogleAuthToken();
    console.log('✅ 認証トークン取得成功');
    
    // 全ファイルを取得（制限あり）
    const response = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,createdTime,parents)', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('✅ ファイル一覧取得成功');
    
    if (data.files && data.files.length > 0) {
      console.log('📁 ユーザーの全Google Driveファイル一覧:');
      data.files.forEach((file: any, index: number) => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        const emoji = isFolder ? '📁' : '📄';
        console.log(`${index + 1}. ${emoji} ${file.name} (${file.mimeType})`);
      });
      
      // ファイル名一覧のサマリー
      const fileNames = data.files.map((file: any) => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        const emoji = isFolder ? '📁' : '📄';
        return `${emoji} ${file.name}`;
      }).join('\n');
      
      console.log(`ユーザーの全Google Driveファイル (${data.files.length}件):\n\n${fileNames}`);
    } else {
      console.log('📭 ファイルが見つかりませんでした');
    }
    
    console.log('=== 全ファイル一覧テスト完了 ===');
  } catch (error) {
    console.error('❌ 全ファイル一覧テスト失敗:', error);
    console.log(`エラー: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ================================================================================
// ヘルパー関数群
// ================================================================================

async function testBasicFileList(token: string) {
  const response = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,parents)', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log(`📋 基本一覧: ${data.files?.length || 0}件`);
  
  if (data.files) {
    data.files.forEach((file: any, index: number) => {
      const emoji = file.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄';
      const parentInfo = file.parents ? ` (親: ${file.parents[0]})` : ' (ルート)';
      console.log(`  ${index + 1}. ${emoji} ${file.name}${parentInfo}`);
    });
  }
}

async function findChromeMemoFolder(token: string): Promise<string | null> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=name='Chrome Memo Extension' and mimeType='application/vnd.google-apps.folder'&fields=files(id,name)`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  if (data.files && data.files.length > 0) {
    const folder = data.files[0];
    console.log(`📁 フォルダー発見: ${folder.name} (ID: ${folder.id})`);
    return folder.id;
  } else {
    console.log('📭 Chrome Memo Extension フォルダーが見つかりませんでした');
    return null;
  }
}

async function testFolderContents(token: string, folderId: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents&fields=files(id,name,mimeType,size,createdTime)`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log(`📂 フォルダー内ファイル: ${data.files?.length || 0}件`);
  
  if (data.files && data.files.length > 0) {
    data.files.forEach((file: any, index: number) => {
      const emoji = file.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄';
      const size = file.size ? ` (${Math.round(file.size / 1024)}KB)` : '';
      console.log(`  ${index + 1}. ${emoji} ${file.name}${size}`);
    });
  }
}

async function testPermissions(token: string) {
  try {
    const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('👤 ユーザー情報:', data.user?.displayName || 'Unknown');
    console.log('💾 ストレージ情報:', data.storageQuota || 'No quota info');
  } catch (error) {
    console.log('⚠️ 権限情報の取得に失敗:', error);
  }
}

function displayFileList(files: any[]) {
  files.forEach((file: any, index: number) => {
    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
    const emoji = isFolder ? '📁' : '📄';
    const size = file.size ? ` (${formatFileSize(file.size)})` : '';
    const date = file.createdTime ? ` - ${new Date(file.createdTime).toLocaleDateString()}` : '';
    console.log(`  ${index + 1}. ${emoji} ${file.name}${size}${date}`);
  });
}

function formatFileSize(bytes: string): string {
  const size = parseInt(bytes);
  if (size < 1024) return `${size}B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)}KB`;
  return `${Math.round(size / (1024 * 1024))}MB`;
}

function generateSummary(files: any[]): string {
  const totalFiles = files.length;
  const folders = files.filter(f => f.mimeType === 'application/vnd.google-apps.folder').length;
  const regularFiles = totalFiles - folders;
  
  return `総ファイル数: ${totalFiles}件, フォルダー: ${folders}件, ファイル: ${regularFiles}件`;
}

// ================================================================================
// グローバル関数の登録（デバッグ用）
// ================================================================================

if (typeof window !== 'undefined') {
  (window as any).testBasicConnection = testBasicConnection;
  (window as any).debugDriveAPI = debugDriveAPI;
  (window as any).testDetailedFileList = testDetailedFileList;
  (window as any).testAllFilesList = testAllFilesList;
  
  // 後方互換性のため
  (window as any).testGoogleDriveConnection = testBasicConnection;
  (window as any).testListDriveFiles = testDetailedFileList;
  (window as any).testListAllDriveFiles = testAllFilesList;
}