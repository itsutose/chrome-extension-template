/**
 * Google Drive APIを使用するための認証関連の機能を提供するモジュール
 * 過去の動作していたプロジェクトのoauth.jsを参考に実装
 */

// デバッグモード設定
const DEBUG = true;

// トークンの保存と取得のためのキー
const TOKEN_STORAGE_KEY = 'google_drive_token';
const TOKEN_EXPIRY_KEY = 'google_drive_token_expiry';

// トークンの有効期限（秒） - 実際の有効期限より少し短く設定
const TOKEN_EXPIRY_BUFFER = 300; // 5分のバッファ

/**
 * デバッグログ出力
 */
function log(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[OAuth] ${message}`, data || '');
  }
}

/**
 * トークンと有効期限を保存する関数
 * @param token - 保存するトークン
 * @param isTest - テストモードかどうか
 */
function saveToken(token: string, isTest = false): void {
  const expiryTime = Date.now() + ((isTest ? 600 : 3600) * 1000) - (TOKEN_EXPIRY_BUFFER * 1000);
  chrome.storage.sync.set({
    [TOKEN_STORAGE_KEY]: token,
    [TOKEN_EXPIRY_KEY]: expiryTime
  });
  log('トークンを保存しました', {
    expiryTime: new Date(expiryTime),
    remainingTime: Math.floor((expiryTime - Date.now()) / 1000) + '秒',
    isTestMode: isTest
  });
}

/**
 * トークンを削除する関数
 */
function removeToken(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.remove([TOKEN_STORAGE_KEY, TOKEN_EXPIRY_KEY], () => {
      log('Token removed from chrome.storage.sync');
      resolve();
    });
  });
}

/**
 * 保存されたトークンを取得する関数
 * @returns 有効なトークン、またはnull
 */
function getStoredToken(): Promise<string | null> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([TOKEN_STORAGE_KEY, TOKEN_EXPIRY_KEY], (result) => {
      const token = result[TOKEN_STORAGE_KEY];
      const expiryTime = parseInt(result[TOKEN_EXPIRY_KEY] || '0');

      if (!token || !expiryTime) {
        log('保存されたトークンが見つかりません');
        resolve(null);
        return;
      }

      const remainingTime = Math.floor((expiryTime - Date.now()) / 1000 / 60);
      log('トークンの状態:', {
        hasToken: !!token,
        expiryTime: new Date(expiryTime),
        remainingTime: remainingTime + '分'
      });

      if (Date.now() < expiryTime) {
        log('有効なトークンを使用します');
        resolve(token);
      } else {
        log('トークンの有効期限が切れています');
        removeToken().then(() => resolve(null));
      }
    });
  });
}

/**
 * 新しいトークンを取得する関数
 * @param requireUserInteraction - ユーザー操作が必要かどうか
 */
function getNewToken(requireUserInteraction = false): Promise<string> {
  return new Promise((resolve, reject) => {
    log('トークン取得を開始', {
      requireUserInteraction,
      method: requireUserInteraction ? '対話的' : '非対話的'
    });

    // 方法1: chrome.identity.getAuthToken を試す
    chrome.identity.getAuthToken({ 
      interactive: requireUserInteraction
    }, function(token) {
      if (chrome.runtime.lastError) {
        const error = chrome.runtime.lastError;
        log('getAuthToken エラー:', {
          message: error.message,
          requireUserInteraction
        });

        if (requireUserInteraction) {
          log('launchWebAuthFlow にフォールバック');
          // 方法2: launchWebAuthFlow にフォールバック
          authenticateWithWebFlow()
            .then(token => {
              saveToken(token);
              resolve(token);
            })
            .catch(reject);
        } else {
          // 非対話的な取得が失敗した場合のエラーメッセージ
          const errorMessage = `自動トークン更新に失敗しました: ${error.message}`;
          log(errorMessage);
          reject(new Error(errorMessage));
        }
        return;
      }
      
      if (!token) {
        reject(new Error('トークンが取得できませんでした'));
        return;
      }
      
      log('トークン取得成功', {
        tokenLength: token.length,
        method: requireUserInteraction ? '対話的' : '非対話的'
      });
      saveToken(token);
      resolve(token);
    });
  });
}

/**
 * WebFlowによる認証を行う関数
 */
function authenticateWithWebFlow(): Promise<string> {
  return new Promise((resolve, reject) => {
    const clientId = '1023026132594-oj46tsthi3f6hdff7m0kc05a5u8rumnk.apps.googleusercontent.com';
    const redirectUri = chrome.identity.getRedirectURL();
    log('Redirect URI:', redirectUri);
    log('Using client ID:', clientId);
    
    const scope = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive.appdata',
      'https://www.googleapis.com/auth/drive.appfolder'
    ].join(' ');

    const authUrl = `https://accounts.google.com/o/oauth2/auth` +
      `?client_id=${clientId}` +
      `&response_type=token` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scope)}`;
    
    log('Attempting auth with URL:', authUrl);
    
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true
      },
      function(redirectUrl) {
        if (chrome.runtime.lastError) {
          log('launchWebAuthFlow error:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
          return;
        }
        
        if (!redirectUrl) {
          reject(new Error('リダイレクトURLが取得できませんでした'));
          return;
        }
        
        log('Got redirect URL:', redirectUrl);
        
        try {
          const params = new URLSearchParams(new URL(redirectUrl).hash.substring(1));
          const accessToken = params.get('access_token');
          if (accessToken) {
            log('Successfully extracted access token');
            resolve(accessToken);
          } else {
            log('No access token found in redirect URL');
            reject(new Error('Access token not found in redirect URL'));
          }
        } catch (e) {
          log('Error parsing redirect URL:', e);
          reject(e);
        }
      }
    );
  });
}

/**
 * Google認証トークンを取得する関数（メイン関数）
 */
export async function getGoogleAuthToken(): Promise<string> {
  log('認証トークン取得開始');

  // 認証キャッシュをクリア
  try {
    await new Promise<void>((resolve) => {
      chrome.identity.clearAllCachedAuthTokens(() => {
        log('認証キャッシュをクリアしました');
        resolve();
      });
    });
  } catch (error) {
    log('キャッシュクリアでエラー:', error);
  }

  const storedToken = await getStoredToken();
  if (storedToken) {
    log('保存されたトークンを使用');
    return storedToken;
  }

  // 新しいトークンを取得（ユーザー操作が必要）
  return await getNewToken(true);
}

/**
 * 認証トークンをクリアする関数
 */
export async function clearAuthToken(): Promise<void> {
  await removeToken();
  log('認証トークンをクリアしました');
}