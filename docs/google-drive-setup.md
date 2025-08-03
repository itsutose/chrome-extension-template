# Google Drive API設定手順

## 1. Google Cloud Platformでの設定

### 1.1 プロジェクトの作成
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成（例: `chrome-memo-extension`）
3. プロジェクトを選択

### 1.2 Google Drive APIの有効化
1. 「APIとサービス」→「ライブラリ」に移動
2. 「Google Drive API」を検索して選択
3. 「有効にする」をクリック

### 1.3 OAuth同意画面の設定
1. 「APIとサービス」→「OAuth同意画面」に移動
2. ユーザータイプ: 「外部」を選択
3. アプリ情報を入力:
   - アプリ名: `Chrome Memo Extension`
   - ユーザーサポートメール: 開発者のメールアドレス
   - 開発者の連絡先情報: 開発者のメールアドレス

### 1.4 OAuth 2.0クライアントIDの作成
1. 「APIとサービス」→「認証情報」に移動
2. 「認証情報を作成」→「OAuth 2.0クライアントID」を選択
3. アプリケーションの種類: 「デスクトップアプリ」を選択
4. 名前: `Chrome Memo Extension Client`
5. 「作成」をクリック

### 1.5 クライアントIDとシークレットの取得
- クライアントID: `YOUR_CLIENT_ID.apps.googleusercontent.com`
- クライアントシークレット: `YOUR_CLIENT_SECRET`

## 2. manifest.jsonの設定

```json
{
  "manifest_version": 3,
  "name": "Chrome Memo Extension",
  "version": "1.0.0",
  "permissions": [
    "identity",
    "storage"
  ],
  "oauth2": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/drive.file"
    ]
  },
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"]
    }
  ]
}
```

## 3. 環境変数の設定

`.env`ファイルを作成:
```
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET
```

## 4. 注意事項

- クライアントIDとシークレットは機密情報として扱う
- 本番環境では適切なセキュリティ対策を実施
- OAuth同意画面の公開設定は開発中は「テスト」に設定

## 5. 次のステップ

1. 上記設定を完了後、OAuth認証フローの実装
2. Google Drive API連携機能の実装
3. 基本的なファイル操作の実装 