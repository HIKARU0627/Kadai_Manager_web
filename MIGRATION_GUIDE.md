# イベントタイプカスタマイズ機能 - マイグレーションガイド

## 概要

このアップデートにより、カレンダーの予定の種類をカスタマイズできるようになりました。デフォルトで「予定」と「テスト」が用意されており、これらは削除できません。

## データベースマイグレーション

### 1. Prismaスキーマの変更

新しいテーブル `EventTypeConfig` が追加されました。以下のコマンドでデータベースを更新してください：

```bash
# 開発環境の場合
npm run db:push

# または、マイグレーションを作成する場合
npx prisma migrate dev --name add_event_type_config
```

### 2. Prismaクライアントの再生成

スキーマ変更後、Prismaクライアントを再生成します：

```bash
npm run db:generate
```

## 新機能

### 1. イベントタイプ管理

設定画面（`/settings`）に新しいタブ「予定の種類」が追加されました：
- イベントタイプの追加・削除
- 各タイプの名前、色、科目必須フラグの設定
- 「予定」と「テスト」はデフォルト項目として保護されています

### 2. 予定作成・編集の強化

予定作成・編集モーダルが動的にイベントタイプに対応：
- カスタムイベントタイプが選択肢に表示されます
- 科目必須フラグに基づいて科目選択フィールドが表示/非表示されます
- 各タイプに設定した色がプレビューに表示されます

## デフォルトデータ

ユーザーが初めてイベントタイプ機能を使用すると、以下のデフォルトタイプが自動的に作成されます：

| ID | 名前 | 色 | 科目必須 | 削除可能 |
|----|------|-----|----------|----------|
| {userId}_event | 予定 | #10B981 (緑) | いいえ | いいえ |
| {userId}_test | テスト | #8B5CF6 (紫) | はい | いいえ |

## 互換性

### 既存データ

既存のイベントデータは影響を受けません。`eventType` フィールドは引き続き文字列として保存されます。

### 注意事項

- カレンダーページの一部機能（統計表示など）は、まだカスタムイベントタイプに完全対応していません
- カスタムイベントタイプで作成された予定は、設定された色ではなくデフォルトの色で表示される可能性があります
- これらの機能は今後のアップデートで改善される予定です

## トラブルシューティング

### マイグレーションエラー

```
Error: Failed to fetch the engine file
```

このエラーが発生した場合：

1. オフライン環境の場合、環境変数を設定：
   ```bash
   export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
   ```

2. 再度マイグレーションを実行：
   ```bash
   npm run db:push
   ```

### イベントタイプが表示されない

設定画面でイベントタイプが表示されない場合：

1. ブラウザのコンソールでエラーを確認
2. データベースに `event_type_configs` テーブルが作成されているか確認
3. ページをリロードして再試行

## 開発者向け情報

### 新しいファイル

- `prisma/schema.prisma` - EventTypeConfigモデル追加
- `app/actions/eventTypes.ts` - イベントタイプ管理用Server Actions
- `components/settings/EventTypeSettings.tsx` - イベントタイプ管理UI
- `MIGRATION_GUIDE.md` - このファイル

### 変更されたファイル

- `components/settings/SettingsForm.tsx` - 新しいタブ追加
- `components/modals/AddEventModal.tsx` - 動的イベントタイプ対応
- `components/modals/EditEventModal.tsx` - 動的イベントタイプ対応

### API

イベントタイプ管理のServer Actions：

```typescript
// イベントタイプ一覧を取得
getUserEventTypes(): Promise<EventTypeConfig[]>

// イベントタイプを作成
createEventType(data: { name: string; color: string; requiresSubject: boolean })

// イベントタイプを更新（デフォルト項目は不可）
updateEventType(id: string, data: { name?: string; color?: string; requiresSubject?: boolean })

// イベントタイプを削除（デフォルト項目は不可）
deleteEventType(id: string)

// イベントタイプの順序を更新
reorderEventTypes(eventTypeIds: string[])
```
