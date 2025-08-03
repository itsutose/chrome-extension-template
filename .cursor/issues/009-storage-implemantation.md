# 【新機能】メモデータ保存・同期機能の実装

## 概要
ユーザーのメモデータをGoogle Driveに保存・同期するChrome拡張機能を開発する。データの大容量化に対応し、かつ安全で効率的なデータ管理を実現する。既存のメモ表示UI（002-B）と連携し、メモの永続化と復元機能を提供する。

## 背景と課題
- メモ表示UIは実装済み（002-B完了）
- メモ作成と位置指定の分離設計が完了
- メモデータの永続化機能が未実装
- 複数メモの管理機能が未実装
- ページリロード時のメモ復元機能が未実装
- オフライン時のメモ閲覧・編集機能が未実装

## 期待する結果
- Google Drive APIを使用した安全なメモデータの保存・同期
- 既存のメモ表示UIとの完全な連携
- オフライン時のメモ閲覧・編集機能
- 複数メモの効率的な管理
- ページ再訪問時の自動メモ復元
- 大容量データへの対応

## 実装方針

### 1. データ保存戦略
- **使用サービス**: Google Drive API v3
- **データ構造**: 「1メモ = 1ファイル」形式を採用　← これは要検討
- **フォルダ構成**: アプリケーション専用フォルダ内に個別メモファイルを格納
- **ファイル形式**: JSON（既存のMemoData型と互換性を保持）

### 2. 認証・認可
- **認証基盤**: Google Cloud Platform (GCP) でOAuthクライアントIDを発行
- **認証方式**: OAuth 2.0
- **要求スコープ**: `https://www.googleapis.com/auth/drive.file`
- **セキュリティ**: アプリが自ら作成したファイルへのアクセスのみに権限を限定

### 3. 既存システムとの統合
- **型定義**: 既存の`MemoData`、`MemoPosition`型を拡張
- **UI連携**: 既存のメモ表示UIとの完全な互換性を保持
- **分離設計**: メモ作成と位置指定の分離設計を維持

## 影響範囲
- `src/utils/memoStorage.ts`: Google Drive API連携機能の新規作成
- `src/utils/memo.tsx`: 既存のメモ作成関数に保存機能を統合
- `src/types/memo.ts`: 保存関連の型定義を追加
- `src/background.ts`: OAuth認証フローの管理
- `src/content.tsx`: メモ復元機能の統合
- `manifest.json`: 必要な権限とOAuth設定を追加

## チェックリスト

### Phase 1: Google Drive API連携基盤
- [ ] Google Cloud PlatformでOAuthクライアントIDを発行
- [ ] Google Drive API連携機能（memoStorage.ts）を実装
- [ ] 基本的なファイル操作（作成、読み取り、更新、削除）を実装
- [ ] OAuth認証フローを実装
- [ ] エラーハンドリングと再試行処理を実装

### Phase 2: データ形式最適化（要検討）
- [ ] 保存用JSON構造の詳細設計（position vs selection）
- [ ] 復元処理との整合性確認
- [ ] メモデータの保存・取得・更新・削除機能を実装
- [ ] 既存のメモ作成関数に保存機能を統合
- [ ] メモ復元機能を実装
- [ ] 複数メモの管理機能を実装
- [ ] ページ再訪問時の自動復元機能を実装

### Phase 3: 最適化・テスト
- [ ] オフライン対応（chrome.storage.local）を実装
- [ ] セキュリティテストを実装
- [ ] パフォーマンステストを実装

## 技術スタック
- Google Drive API v3
- OAuth 2.0
- Chrome Extension Storage API
- TypeScript
- 既存のReactコンポーネント（002-B）

## 主要な処理フロー

### 1. フォルダ管理
```typescript
// アプリケーション専用フォルダを検索または作成
async function ensureAppFolder(): Promise<string>
```

### 2. メモの保存
```typescript
// メモをGoogle Driveに保存
async function saveMemo(memo: MemoData, position?: MemoPosition): Promise<void>
```

### 3. メモの取得
```typescript
// 保存されたメモを取得
async function loadMemos(): Promise<{ memo: MemoData; position?: MemoPosition }[]>
```

### 4. メモの復元
```typescript
// ページ訪問時にメモを自動復元
async function restoreMemosForPage(pageUrl: string): Promise<void>
```

## データ構造

### 拡張されたMemoData型
```typescript
interface MemoData {
  id: string;
  text: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  tags: string[];
  color: string;
  isVisible: boolean;
  // 新規追加
  driveFileId?: string;  // Google DriveファイルID
  syncStatus: 'synced' | 'pending' | 'error';
  lastSyncAt?: number;
}
```

### 保存用JSON構造（要検討）
```json
{
  "memo": {
    "id": "memo_123",
    "text": "選択されたテキスト",
    "content": "メモの内容",
    "createdAt": 1640995200000,
    "updatedAt": 1640995200000,
    "tags": ["重要", "後で確認"],
    "color": "#fff",
    "isVisible": true,
    "driveFileId": "1ABC...",
    "syncStatus": "synced",
    "lastSyncAt": 1640995200000
  },
  "selection": {  // position vs selection の検討が必要
    "id": "sel_456",
    "memoId": "memo_123",
    "pageUrl": "https://example.com/page",
    "selectionInfo": { /* TextSelectionInfo */ },
    "createdAt": 1640995200000
  }
}
```

**注意**: 復元処理との整合性を考慮し、`position` vs `selection` の命名と構造を検討中。
Phase 1（Google Drive API連携）完了後に詳細設計を行う。

## セキュリティ考慮事項
- OAuth 2.0による安全な認証
- 最小権限の原則（drive.fileスコープのみ）
- データの暗号化（必要に応じて）
- アクセストークンの安全な管理

## パフォーマンス考慮事項
- バッチ処理による効率的な同期
- オフラインキャッシュの活用
- 差分同期によるネットワーク負荷軽減
- 指数バックオフによる再試行処理

## 関連issue
- 001: テキスト選択・右クリックメニュー機能の実装
- 002-A: メモ復元位置特定アルゴリズムの実装
- 002-B: メモ表示UI（Google Keepライク）の実装
- 003: メモ編集・保存機能の実装
- 004: メモの永続化・復元機能の実装

## 作成日
2025-01-XX

## ステータス
未着手