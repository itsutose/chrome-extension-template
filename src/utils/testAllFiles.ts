import { getGoogleAuthToken } from './oauth';

/**
 * 一時的なテスト用：ユーザーの全Google Driveファイルを取得
 * ※このテストを実行するにはmanifest.jsonのスコープ変更が必要
 */
export async function testListAllDriveFiles(): Promise<void> {
  try {
    console.log('=== ユーザーの全Google Driveファイル一覧テスト開始 ===');
    console.log('⚠️ 注意: このテストには広範囲のDriveアクセス権限が必要です');
    
    // 認証トークンを取得
    const token = await getGoogleAuthToken();
    console.log('✅ 認証トークン取得成功');
    
    // 全ファイルを取得（制限なし）
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
    
    // ファイル名一覧を表示
    if (data.files && data.files.length > 0) {
      console.log('📁 ユーザーの全Google Driveファイル一覧:');
      data.files.forEach((file: any, index: number) => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        const emoji = isFolder ? '📁' : '📄';
        console.log(`${index + 1}. ${emoji} ${file.name} (${file.mimeType})`);
      });
      
      // アラートでも表示
      const fileNames = data.files.map((file: any) => {
        const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
        const emoji = isFolder ? '📁' : '📄';
        return `${emoji} ${file.name}`;
      }).join('\n');
      alert(`ユーザーの全Google Driveファイル (${data.files.length}件):\n\n${fileNames}`);
    } else {
      console.log('📭 ファイルが見つかりませんでした');
      alert('ファイルが見つかりませんでした');
    }
    
    console.log('=== テスト完了 ===');
  } catch (error) {
    console.error('❌ ファイル一覧取得エラー:', error);
    alert(`エラー: ${error instanceof Error ? error.message : String(error)}\n\n現在のスコープでは全ファイルアクセスができない可能性があります。`);
  }
}

// デバッグ用にwindowオブジェクトに追加
if (typeof window !== 'undefined') {
  (window as any).testListAllDriveFiles = testListAllDriveFiles;
}