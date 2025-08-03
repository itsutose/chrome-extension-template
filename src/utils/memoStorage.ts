import type { MemoData, MemoPosition } from '../types/memo';

// Google Drive API設定
const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const GOOGLE_UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

// アプリケーション専用フォルダ名
const APP_FOLDER_NAME = 'Chrome Memo Extension';

// エラーハンドリング用の型定義
interface GoogleDriveError {
  error: {
    code: number;
    message: string;
    status: string;
  };
}

// 認証トークンの取得
async function getAuthToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(token);
      }
    });
  });
}

// Google Drive APIリクエストの基本関数
async function makeDriveRequest(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  const token = await getAuthToken();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error: GoogleDriveError = await response.json();
    throw new Error(`Google Drive API Error: ${error.error.message}`);
  }

  return response.json();
}

// アプリケーション専用フォルダの取得または作成
export async function ensureAppFolder(): Promise<string> {
  try {
    // 既存のフォルダを検索
    const searchUrl = `${GOOGLE_DRIVE_API_BASE}/files?q=name='${APP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    const searchResult = await makeDriveRequest(searchUrl);

    if (searchResult.files && searchResult.files.length > 0) {
      console.log('既存のアプリフォルダを発見:', searchResult.files[0].id);
      return searchResult.files[0].id;
    }

    // フォルダが存在しない場合は作成
    const createFolderUrl = `${GOOGLE_DRIVE_API_BASE}/files`;
    const folderData = {
      name: APP_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    };

    const newFolder = await makeDriveRequest(createFolderUrl, {
      method: 'POST',
      body: JSON.stringify(folderData),
    });

    console.log('新しいアプリフォルダを作成:', newFolder.id);
    return newFolder.id;
  } catch (error) {
    console.error('アプリフォルダの取得/作成に失敗:', error);
    throw error;
  }
}

// メモファイルの保存
export async function saveMemoFile(
  memo: MemoData,
  position?: MemoPosition
): Promise<string> {
  try {
    const folderId = await ensureAppFolder();
    
    // 保存用データの作成（一時的な形式）
    const fileData = {
      memo: memo,
      position: position, // 後でselectionに変更予定
    };

    const fileName = `memo_${memo.id}.json`;
    
    // 既存ファイルを検索
    const searchUrl = `${GOOGLE_DRIVE_API_BASE}/files?q=name='${fileName}' and '${folderId}' in parents and trashed=false`;
    const searchResult = await makeDriveRequest(searchUrl);

    let fileId: string;

    if (searchResult.files && searchResult.files.length > 0) {
      // 既存ファイルを更新
      fileId = searchResult.files[0].id;
      const updateUrl = `${GOOGLE_UPLOAD_API_BASE}/files/${fileId}?uploadType=media`;
      
      await makeDriveRequest(updateUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fileData),
      });

      console.log('メモファイルを更新:', fileId);
    } else {
      // 新規ファイルを作成
      const createUrl = `${GOOGLE_UPLOAD_API_BASE}/files?uploadType=multipart`;
      
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
      const multipartBody = [
        `--${boundary}`,
        'Content-Type: application/json; charset=UTF-8',
        '',
        JSON.stringify({
          name: fileName,
          parents: [folderId],
        }),
        `--${boundary}`,
        'Content-Type: application/json',
        '',
        JSON.stringify(fileData),
        `--${boundary}--`,
      ].join('\r\n');

      const newFile = await makeDriveRequest(createUrl, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      });

      fileId = newFile.id;
      console.log('新しいメモファイルを作成:', fileId);
    }

    return fileId;
  } catch (error) {
    console.error('メモファイルの保存に失敗:', error);
    throw error;
  }
}

// メモファイルの取得
export async function loadMemoFile(fileId: string): Promise<{ memo: MemoData; position?: MemoPosition }> {
  try {
    const url = `${GOOGLE_DRIVE_API_BASE}/files/${fileId}?alt=media`;
    const fileData = await makeDriveRequest(url);
    
    console.log('メモファイルを取得:', fileId);
    return fileData;
  } catch (error) {
    console.error('メモファイルの取得に失敗:', error);
    throw error;
  }
}

// メモファイルの削除
export async function deleteMemoFile(fileId: string): Promise<void> {
  try {
    const url = `${GOOGLE_DRIVE_API_BASE}/files/${fileId}`;
    await makeDriveRequest(url, {
      method: 'DELETE',
    });
    
    console.log('メモファイルを削除:', fileId);
  } catch (error) {
    console.error('メモファイルの削除に失敗:', error);
    throw error;
  }
}

// アプリフォルダ内の全メモファイルを取得
export async function listAllMemoFiles(): Promise<Array<{ id: string; name: string; modifiedTime: string }>> {
  try {
    const folderId = await ensureAppFolder();
    const url = `${GOOGLE_DRIVE_API_BASE}/files?q='${folderId}' in parents and name contains 'memo_' and trashed=false&fields=files(id,name,modifiedTime)`;
    
    const result = await makeDriveRequest(url);
    
    console.log('メモファイル一覧を取得:', result.files.length, '件');
    return result.files || [];
  } catch (error) {
    console.error('メモファイル一覧の取得に失敗:', error);
    throw error;
  }
}

// エラーハンドリングと再試行処理
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`操作が失敗しました (試行 ${attempt}/${maxRetries}):`, error);
      
      if (attempt < maxRetries) {
        // 指数バックオフ
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError!;
} 