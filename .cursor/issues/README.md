# メモ機能開発 Issue一覧

このディレクトリには、Chrome拡張機能のメモ機能開発に関するissueが保存されています。

## Issue一覧

### 001: テキスト選択・右クリックメニュー機能の実装
- **種類**: 新機能
- **概要**: Webページ上のテキストを選択し、右クリックメニューからメモ作成機能を呼び出せるようにする
- **ステータス**: 完了
- **ファイル**: [001-text-selection-context-menu.md](./001-text-selection-context-menu.md)

### 002-A: メモ復元位置特定アルゴリズムの実装
- **種類**: 新機能
- **概要**: 保存された位置情報をもとに、Webページ上でメモを正確に復元する位置を特定するアルゴリズムを実装する
- **ステータス**: 未着手
- **ファイル**: [002a-memo-restore-algorithm.md](./002a-memo-restore-algorithm.md)

### 002-B: メモ表示UI（Google Keepライク）の実装
- **種類**: 新機能
- **概要**: 002-Aで実装した復元アルゴリズムを使用して、選択したテキストの位置にGoogle KeepライクなメモUIを表示する機能を実装する
- **ステータス**: 実装中（部分完了）
- **ファイル**: [002b-memo-display-ui.md](./002b-memo-display-ui.md)

### 003: メモ編集・保存機能の実装
- **種類**: 新機能
- **概要**: メモの内容を編集し、保存する機能を実装する
- **ステータス**: 未着手
- **ファイル**: [003-memo-edit-save.md](./003-memo-edit-save.md)

### 004: メモの永続化・復元機能の実装
- **種類**: 新機能
- **概要**: 作成したメモをchrome.storage APIを使用して永続化し、ページ再訪問時に自動的に復元する機能を実装する
- **ステータス**: 未着手
- **ファイル**: [004-memo-persistence-restore.md](./004-memo-persistence-restore.md)

### 005: メモ機能の統合・最適化
- **種類**: 改善・リファクタリング
- **概要**: 実装された各メモ機能（001-004）を統合し、全体の最適化と品質向上を行う
- **ステータス**: 未着手
- **ファイル**: [005-memo-integration-optimization.md](./005-memo-integration-optimization.md)

### 006: テキスト選択・メモ復元位置特定のテスト環境構築
- **種類**: テスト実装
- **概要**: テキスト選択アルゴリズムとメモ復元位置特定の精度を検証するためのテスト環境を構築する
- **ステータス**: 未着手
- **ファイル**: [006-text-selection-restore-test.md](./006-text-selection-restore-test.md)

### 009: メモデータ保存・同期機能の実装
- **種類**: 新機能
- **概要**: Google Drive APIを使用したメモデータの保存・同期機能を実装する。既存のメモ表示UIと連携し、永続化と復元機能を提供する
- **ステータス**: 完了
- **ファイル**: [009-storage-implemantation.md](./009-storage-implemantation.md)

### 010: ディレクトリ構造の再編成と最適化
- **種類**: リファクタリング・最適化
- **概要**: 機能別・用途別の明確なディレクトリ構造への再編成とビルド最適化
- **ステータス**: 完了
- **ファイル**: [010-directory-restructure-optimization.md](./010-directory-restructure-optimization.md)

### 011: Tailwind CSS移行作業
- **種類**: リファクタリング・最適化
- **概要**: 従来のCSSからTailwind CSSへの移行による開発効率向上とバンドルサイズ最適化
- **ステータス**: 未着手
- **ファイル**: [011-tailwind-migration.md](./011-tailwind-migration.md)

## 実装順序

推奨される実装順序は以下の通りです：

- [x] **001**: テキスト選択・右クリックメニュー機能の実装
- [ ] **002-A**: メモ復元位置特定アルゴリズムの実装
- [x] **002-B**: メモ表示UI（Google Keepライク）の実装（部分完了）
- [ ] **003**: メモ編集・保存機能の実装
- [ ] **004**: メモの永続化・復元機能の実装
- [ ] **005**: メモ機能の統合・最適化
- [ ] **006**: テキスト選択・メモ復元位置特定のテスト環境構築
- [x] **009**: メモデータ保存・同期機能の実装
- [x] **010**: ディレクトリ構造の再編成と最適化
- [ ] **011**: Tailwind CSS移行作業


## 技術スタック

- React
- TypeScript
- Vite
- Chrome Extension API
- CSS Variables
- Portal API
- Markdown Parser
- Chrome Extension Storage API
- Google Drive API v3
- OAuth 2.0
- Tailwind CSS（予定）

## 注意事項

- 各issueは依存関係があるため、順序を守って実装してください
- 実装前に既存のchrome-extension.mdcルールを確認してください
- 実装時はmemo-extension.mdcとdevelopment-efficiency.mdcルールを遵守してください
- 各issueのチェックリストを確認し、完了項目を更新してください

## 更新履歴

- 2025-07-27: Issue一覧の作成
- 2025-07-31: 006番のissueを追加（テスト環境構築）
- 2025-08-02: 002番のissueを002-A（復元アルゴリズム）と002-B（UI実装）に分割
- 2025-08-02: 002-Bの実装完了（メモ表示UI、分離設計、位置固定機能）
- 2025-08-02: 009番のissueを追加（メモデータ保存・同期機能の実装）
- 2025-08-04: 009番のissueを完了に更新、010番のissueを追加（ディレクトリ構造再編成）
- 2025-01-27: 010番のissueを完了に更新、011番のissueを追加（Tailwind CSS移行作業） 