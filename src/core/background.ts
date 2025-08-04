// バックグラウンドスクリプト
console.log('background script loaded!');

import type { MemoData, MemoPosition } from '../shared/types/memo';
import { ensureAppFolder, listAllMemoFiles, saveMemoFile } from '../features/memo/memoStorage';
import { getGoogleAuthToken } from '../features/auth/oauth';

debugger;

// 右クリックメニューの作成
chrome.runtime.onInstalled.addListener(() => {
  // 既存のメニューを削除
  chrome.contextMenus.removeAll(() => {
    // メモ作成メニューを追加
    chrome.contextMenus.create({
      id: 'createMemo',
      title: 'メモを作成',
      contexts: ['selection']
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to create context menu:', chrome.runtime.lastError);
      } else {
        console.log('Context menu created successfully');
      }
    });
  });
});

// 拡張機能のインストール時
chrome.runtime.onInstalled.addListener(() => {
  console.log('onInstalled event fired!');

  // 初期設定mM
  chrome.storage.sync.set({ count: 0 }).catch((error) => {
    console.error('Failed to set initial count:', error);
  });
});

type Message = {
  action: 'updateCount' | 'testGoogleDriveConnection' | 'saveMemo' | 'loadMemos';
  count?: number;
  memo?: unknown;
  position?: unknown;
}

// 右クリックメニューのクリックイベント
chrome.contextMenus.onClicked.addListener((info, tab) => {
  console.log('Context menu clicked:', info.menuItemId);

  if (info.menuItemId === 'createMemo' && tab?.id) {
    console.log('Creating memo for selection:', info.selectionText);

    // Content scriptにメモ作成メッセージを送信
    chrome.tabs.sendMessage(tab.id, {
      action: 'createMemo',
      selectionText: info.selectionText
    }).catch((error) => {
      console.error('Failed to send message to content script:', error);
    });
  }
});

// メッセージ受信
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  console.log('Background received message:', message);

  if (message.action === 'updateCount') {
    // debugger; // Service Workerでも確実に停止

    console.log('Count updated to:', message.count);

    // Content scriptにメッセージを送信（エラーハンドリング付き）
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateCount',
          count: message.count,
        }).catch((error) => {
          console.log('Content script not available:', error instanceof Error ? error.message : String(error));
        });
      }
    });
    sendResponse({ success: true });
  }
  
  // Google Drive API関連のメッセージ処理
  if (message.action === 'testGoogleDriveConnection') {
    testGoogleDriveConnection().then(sendResponse).catch(sendResponse);
    return true; // 非同期レスポンスを示す
  }
  
  if (message.action === 'saveMemo') {
    saveMemoFile(message.memo as MemoData, message.position as MemoPosition | undefined).then(sendResponse).catch(sendResponse);
    return true;
  }
  
  if (message.action === 'loadMemos') {
    listAllMemoFiles().then(sendResponse).catch(sendResponse);
    return true;
  }
});

// タブ更新時の処理
chrome.tabs.onUpdated.addListener((_tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
  }
});

// アクションボタンのクリック
chrome.action.onClicked.addListener((tab) => {
  console.log('Action button clicked on tab:', tab.url);
});

// Google Drive API連携のテスト関数
async function testGoogleDriveConnection(): Promise<{ success: boolean; message: string; details?: unknown }> {
  try {
    console.log('=== Google Drive API連携テスト開始 ===');
    console.log('Manifest情報:', chrome.runtime.getManifest());
    console.log('ブラウザ情報:', navigator.userAgent);
    
    // 1. 改善された認証テスト（過去の動作版の方式を採用）
    console.log('1. 改善された認証テスト...');
    try {
      const testToken = await getGoogleAuthToken();
      console.log('✅ 認証成功:', testToken ? '取得済み' : '失敗');
    } catch (authError) {
      console.error('❌ 認証失敗:', authError);
      return {
        success: false,
        message: '認証が失敗しました',
        details: {
          authError: authError instanceof Error ? authError.message : String(authError)
        }
      };
    }
    
    // 1. アプリフォルダの取得/作成テスト
    console.log('1. アプリフォルダの取得/作成...');
    const folderId = await ensureAppFolder();
    console.log('✅ アプリフォルダ取得成功:', folderId);
    
    // 2. ファイル一覧の取得テスト
    console.log('2. ファイル一覧の取得...');
    const files = await listAllMemoFiles();
    console.log('✅ ファイル一覧取得成功:', files.length, '件');
    
    console.log('=== Google Drive API連携テスト完了 ===');
    
    return {
      success: true,
      message: 'Google Drive API連携テスト成功',
      details: {
        folderId,
        filesCount: files.length
      }
    };
  } catch (error) {
    console.error('❌ Google Drive API連携テスト失敗:', error);
    return {
      success: false,
      message: 'Google Drive API連携テスト失敗',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}
