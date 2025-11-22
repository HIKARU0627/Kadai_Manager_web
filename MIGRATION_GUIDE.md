# データベースマイグレーション手順

## 課題添付ファイル機能を有効にするために必要な手順

### 方法1: Prisma Migrateを使用（推奨）

```bash
# Prismaクライアントを生成
npx prisma generate

# マイグレーションを適用
npx prisma db push
```

### 方法2: マイグレーションスクリプトを使用

```bash
# 依存関係をインストール（必要な場合）
npm install

# マイグレーションスクリプトを実行
node scripts/migrate.js
```

### 方法3: 手動でSQLを実行

もし上記の方法が動作しない場合、データベースに直接SQLを実行してください:

```sql
-- filesテーブルに新しいカラムを追加
ALTER TABLE files ADD COLUMN sakaiRef TEXT;
ALTER TABLE files ADD COLUMN sakaiUrl TEXT;
ALTER TABLE files ADD COLUMN fileSource TEXT DEFAULT 'local';
```

## 確認方法

マイグレーション後、以下を実行してカラムが追加されたことを確認してください:

```bash
npx prisma studio
```

Prisma Studioで`files`テーブルを開き、以下のカラムが存在することを確認:
- `sakaiRef`
- `sakaiUrl`
- `fileSource`

## トラブルシューティング

### エラー: "Cannot find module '@prisma/client'"

```bash
npm install @prisma/client
npx prisma generate
```

### エラー: "duplicate column name"

このエラーは、カラムが既に存在することを意味します。問題ありません。

## 次のステップ

マイグレーション完了後:
1. アプリケーションを再起動
2. TACTとデータを同期（設定ページから）
3. ファイル管理ページで添付ファイルが表示されることを確認
