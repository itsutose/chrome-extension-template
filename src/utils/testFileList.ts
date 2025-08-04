import { getGoogleAuthToken } from './oauth';

/**
 * 一時的なテスト用：ユーザーの全Google Driveファイル詳細情報を表示
 */
export async function testListDriveFiles(): Promise<void> {
  try {
    console.log('=== ユーザーのGoogle Driveファイル詳細一覧テスト開始 ===');
    
    // 認証トークンを取得
    const token = await getGoogleAuthToken();
    console.log('✅ 認証トークン取得成功');
    
    // ユーザーの全Google Drive ファイルを取得（フォルダー内も含む、詳細情報含む）
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
    
    // 詳細なファイル情報を表示（フォルダー階層込み）
    if (data.files && data.files.length > 0) {
      console.log(`📁 ユーザーのGoogle Driveファイル詳細一覧 (${data.files.length}件):`);
      console.log('==========================================');
      
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
      
      // ルートファイルを表示
      console.log('📂 ルートフォルダのファイル:');
      displayFiles(rootFiles, '');
      
      // 各フォルダ内のファイルを表示
      folderFiles.forEach((files, folderId) => {
        const folderName = folderMap.get(folderId) || 'Unknown Folder';
        console.log(`\n📂 フォルダ「${folderName}」内のファイル:`);
        displayFiles(files, '  ');
      });
      
      function displayFiles(files: any[], indent: string) {
        files.forEach((file: any, index: number) => {
          const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
          const emoji = isFolder ? '📁' : '📄';
          const size = file.size ? `${Math.round(file.size / 1024)}KB` : 'サイズ不明';
          const created = new Date(file.createdTime).toLocaleString('ja-JP');
          const modified = new Date(file.modifiedTime).toLocaleString('ja-JP');
          
          console.log(`${indent}${index + 1}. ${emoji} ${file.name}`);
          console.log(`${indent}   📋 ID: ${file.id}`);
          console.log(`${indent}   🏷️  種類: ${file.mimeType}`);
          console.log(`${indent}   📏 サイズ: ${size}`);
          console.log(`${indent}   📅 作成日: ${created}`);
          console.log(`${indent}   ✏️  更新日: ${modified}`);
          if (file.webViewLink) {
            console.log(`${indent}   🔗 リンク: ${file.webViewLink}`);
          }
          console.log(`${indent}------------------------------------------`);
        });
      }
      
      // 簡易サマリーをアラートで表示（フォルダー構造を簡略表示）
      const folderCount = data.files.filter((f: any) => f.mimeType === 'application/vnd.google-apps.folder').length;
      const fileCount = data.files.length - folderCount;
      
      const summary = data.files.slice(0, 15).map((file: any, index: number) => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        const emoji = isFolder ? '📁' : '📄';
        const parentInfo = file.parents && file.parents.length > 0 ? ' (フォルダー内)' : '';
        return `${index + 1}. ${emoji} ${file.name}${parentInfo}`;
      }).join('\n');
      
      const moreText = data.files.length > 15 ? `\n\n...他${data.files.length - 15}件（詳細はコンソールを確認）` : '';
      alert(`Google Driveファイル一覧 (${data.files.length}件):\n📁 フォルダー: ${folderCount}件\n📄 ファイル: ${fileCount}件\n\n${summary}${moreText}`);
    } else {
      console.log('📭 ファイルが見つかりませんでした');
      alert('ファイルが見つかりませんでした');
    }
    
    console.log('=== テスト完了 ===');
  } catch (error) {
    console.error('❌ ファイル一覧取得エラー:', error);
    alert(`エラー: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// デバッグ用にwindowオブジェクトに追加
if (typeof window !== 'undefined') {
  (window as any).testListDriveFiles = testListDriveFiles;
}