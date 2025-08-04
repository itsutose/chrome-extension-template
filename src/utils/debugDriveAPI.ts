import { getGoogleAuthToken } from './oauth';

/**
 * デバッグ用：Google Drive API の詳細調査
 */
export async function debugDriveAPI(): Promise<void> {
  try {
    console.log('=== Google Drive API 詳細デバッグ開始 ===');
    
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
    alert(`デバッグエラー: ${error instanceof Error ? error.message : String(error)}`);
  }
}

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
    console.log('❌ Chrome Memo Extension フォルダーが見つかりません');
    return null;
  }
}

async function testFolderContents(token: string, folderId: string) {
  // 方法1: parents検索
  console.log('📂 方法1: parents検索');
  const response1 = await fetch(`https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents&fields=files(id,name,mimeType,size)`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data1 = await response1.json();
  console.log(`   結果: ${data1.files?.length || 0}件`);
  if (data1.files) {
    data1.files.forEach((file: any, index: number) => {
      const emoji = file.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄';
      const size = file.size ? ` (${Math.round(file.size / 1024)}KB)` : '';
      console.log(`   ${index + 1}. ${emoji} ${file.name}${size}`);
    });
  }
  
  // 方法2: 全件取得後フィルター
  console.log('📂 方法2: 全件取得後フィルター');
  const response2 = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=100&fields=files(id,name,mimeType,parents,size)', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data2 = await response2.json();
  const folderFiles = data2.files?.filter((file: any) => 
    file.parents && file.parents.includes(folderId)
  ) || [];
  
  console.log(`   結果: ${folderFiles.length}件`);
  folderFiles.forEach((file: any, index: number) => {
    const emoji = file.mimeType === 'application/vnd.google-apps.folder' ? '📁' : '📄';
    const size = file.size ? ` (${Math.round(file.size / 1024)}KB)` : '';
    console.log(`   ${index + 1}. ${emoji} ${file.name}${size}`);
  });
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
    console.log('💾 ストレージ情報:', data.storageQuota ? 'アクセス可能' : 'アクセス不可');
    
  } catch (error) {
    console.log('❌ 権限情報取得エラー:', error);
  }
}

// デバッグ用にwindowオブジェクトに追加
if (typeof window !== 'undefined') {
  (window as any).debugDriveAPI = debugDriveAPI;
}