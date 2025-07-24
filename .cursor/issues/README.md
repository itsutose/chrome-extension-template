# メモ機能開発 Issue一覧

このディレクトリには、Chrome拡張機能のメモ機能開発に関するissueが保存されています。

## Issue一覧

### 001: テキスト選択・右クリックメニュー機能の実装
- **種類**: 新機能
- **概要**: Webページ上のテキストを選択し、右クリックメニューからメモ作成機能を呼び出せるようにする
- **ステータス**: 未着手
- **ファイル**: [001-text-selection-context-menu.md](./001-text-selection-context-menu.md)

### 002: メモ表示UI（Google Keepライク）の実装
- **種類**: 新機能
- **概要**: 選択したテキストの位置にGoogle KeepライクなメモUIを表示する機能を実装する
- **ステータス**: 未着手
- **ファイル**: [002-memo-display-ui.md](./002-memo-display-ui.md)

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

## 実装順序

推奨される実装順序は以下の通りです：

1. **001**: テキスト選択・右クリックメニュー機能の実装
2. **002**: メモ表示UI（Google Keepライク）の実装
3. **003**: メモ編集・保存機能の実装
4. **004**: メモの永続化・復元機能の実装
5. **005**: メモ機能の統合・最適化

## 技術スタック

- React
- TypeScript
- Vite
- Chrome Extension API
- CSS Variables
- Portal API
- Markdown Parser
- Chrome Extension Storage API

## 注意事項

- 各issueは依存関係があるため、順序を守って実装してください
- 実装前に既存のchrome-extension.mdcルールを確認してください
- 実装時はmemo-extension.mdcとdevelopment-efficiency.mdcルールを遵守してください
- 各issueのチェックリストを確認し、完了項目を更新してください

## 更新履歴

- 2025-01-XX: Issue一覧の作成 