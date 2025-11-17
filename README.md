# 学校スケジュール・課題管理Webアプリ

学校の「時間割」「課題」「個人的な予定」「授業メモ」をデジタルで一元管理するWebアプリケーションです。

## 機能

### ✅ 実装済み

- **ダッシュボード**: 今日の時間割、締め切りの課題、個人的な予定を一覧表示
- **課題管理**: 課題の登録・編集・削除、進捗管理（未着手・作業中・完了）
- **時間割管理**: 週間時間割の表示、科目の登録・編集・削除
- **カレンダー表示**: 月間カレンダービュー、課題・予定・小テストの一覧表示
- **授業メモ機能**: 科目別メモ、小テスト日程、お知らせの管理
- **検索機能**: 課題名・科目名・メモ内容での検索
- **優先度管理**: 課題の優先度設定（低・中・高）
- **Server Actions API**: 課題、時間割、予定、授業メモの完全なCRUD操作

### 🚧 今後の実装予定

- リマインダー機能（通知）
- ファイル管理機能（アップロード・ダウンロード）
- ユーザー認証（NextAuth.js）
- 実データベース連携（現在はモックデータを使用）

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React 18, TypeScript
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: カスタムコンポーネント (shadcn/ui inspired)
- **アイコン**: Lucide React
- **日付処理**: date-fns
- **データベース**: Prisma + PostgreSQL (設定済み)

## セットアップ

### 前提条件

- Node.js 18.x 以上
- npm または yarn

### インストール

1. リポジトリをクローン

\`\`\`bash
git clone <repository-url>
cd Kadai_Manager_web
\`\`\`

2. 依存パッケージをインストール

\`\`\`bash
npm install
\`\`\`

3. 環境変数を設定

\`.env\`ファイルを作成し、以下を設定：

\`\`\`env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
\`\`\`

4. Prismaのセットアップ（本番環境のみ）

\`\`\`bash
npx prisma generate
npx prisma db push
\`\`\`

5. 開発サーバーを起動

\`\`\`bash
npm run dev
\`\`\`

6. ブラウザで http://localhost:3000 を開く

## プロジェクト構造

\`\`\`
Kadai_Manager_web/
├── app/                    # Next.js App Router
│   ├── actions/           # Server Actions（API）
│   │   ├── tasks.ts      # 課題CRUD
│   │   ├── subjects.ts   # 時間割CRUD
│   │   ├── events.ts     # 予定CRUD
│   │   └── notes.ts      # 授業メモCRUD
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # ダッシュボード
│   ├── tasks/             # 課題管理ページ
│   ├── subjects/          # 時間割ページ
│   ├── calendar/          # カレンダーページ
│   └── notes/             # 授業メモページ
├── components/            # Reactコンポーネント
│   ├── layout/           # レイアウトコンポーネント
│   │   └── Sidebar.tsx   # サイドバーナビゲーション
│   └── ui/               # UIコンポーネント
│       ├── card.tsx
│       ├── badge.tsx
│       └── button.tsx
├── lib/                   # ユーティリティ関数
│   ├── utils.ts          # 汎用ユーティリティ
│   └── prisma.ts         # Prismaクライアント
├── prisma/               # Prismaスキーマ
│   └── schema.prisma     # データベーススキーマ定義
├── wireframes/           # デザインワイヤーフレーム
│   ├── dashboard.html
│   └── tasks.html
└── DESIGN_DOCUMENT.md    # 設計書
\`\`\`

## データベース設計

詳細は [DESIGN_DOCUMENT.md](./DESIGN_DOCUMENT.md) を参照してください。

### 主要テーブル

- **users**: ユーザー情報
- **subjects**: 時間割（科目）
- **tasks**: 課題
- **events**: 個人的な予定
- **notes**: 授業メモ
- **files**: ファイル管理
- **reminders**: リマインダー

## 開発コマンド

\`\`\`bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# リント
npm run lint

# Prismaクライアント生成
npx prisma generate

# データベースマイグレーション
npx prisma db push

# Prisma Studio（データベースGUI）起動
npx prisma studio
\`\`\`

## 機能紹介

### ダッシュボード
今日の時間割、締め切りの課題、個人的な予定を一覧で確認できます。色分けされたカードで一目で情報を把握できます。

### 課題一覧
課題の進捗状態（未着手・作業中・完了）でフィルタリングして管理できます。優先度別の表示、締め切り日の強調表示により、重要な課題を見逃しません。

### 時間割
週間時間割をグリッド形式で表示。科目ごとに色分けされ、教員名・教室名も一目で確認できます。

### カレンダー
月間カレンダービューで課題の締め切りや予定を視覚的に管理。日付をクリックすると、その日の詳細情報が表示されます。

### 授業メモ
科目別にメモを管理。一般メモ、小テスト日程、お知らせをカテゴリ分けして整理できます。科目やタイプでフィルタリング可能です。

## ライセンス

MIT

## 作成者

学校スケジュール管理アプリ開発チーム
