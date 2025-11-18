# 学校スケジュール・課題管理Webアプリ

学校の「時間割」「課題」「個人的な予定」「授業メモ」をデジタルで一元管理するWebアプリケーションです。

## 機能

### ✅ 実装済み

- **ダッシュボード**: 今日の時間割、締め切りの課題、個人的な予定を一覧表示（実データベース連携済み）
- **課題管理**: 課題の登録・編集・削除、進捗管理（未着手・作業中・完了）、ステータスのリアルタイム更新（実データベース連携済み）
- **時間割管理**: 週間時間割の表示、科目の登録・編集・削除
- **カレンダー表示**: 月間カレンダービュー、課題・予定・小テストの一覧表示
- **授業メモ機能**: 科目別メモ、小テスト日程、お知らせの管理
- **検索機能**: 課題名・科目名・メモ内容での検索
- **優先度管理**: 課題の優先度設定（低・中・高）
- **Server Actions API**: 課題、時間割、予定、授業メモ、ファイル、リマインダーの完全なCRUD操作
- **UIコンポーネント**: Dialog、Input、Label、Select、Textareaなどの再利用可能なコンポーネント
- **モーダルダイアログUI**: 課題・時間割・予定・メモの追加フォーム
- **ユーザー認証**: NextAuth.jsによるログイン/ログアウト機能、認証ベースのルート保護
- **データベース統合**: ダッシュボードと課題ページで実データベースとの完全連携
- **ファイルアップロードAPI**: ファイルアップロード用のAPIエンドポイントとUIコンポーネント
- **🤖 AI機能**:
  - ファイル要約生成（OpenAI GPT-4, Claude 3.5, Google Gemini対応）
  - 課題からプログラミングコード生成
  - ファイル内容の詳細分析
  - 複数のAIプロバイダーから選択可能

### 🚧 今後の実装予定

- 時間割・カレンダー・授業メモページの完全なデータベース統合（現在は部分的に実装）
- リマインダー通知UI（通知表示）
- 編集・削除モーダルの実装

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React 18, TypeScript
- **スタイリング**: Tailwind CSS
- **UIコンポーネント**: カスタムコンポーネント (shadcn/ui inspired), Radix UI
- **アイコン**: Lucide React
- **日付処理**: date-fns
- **認証**: NextAuth.js v4
- **データベース**: Prisma + SQLite (開発環境) / PostgreSQL (本番環境)
- **パスワードハッシュ**: bcryptjs
- **AI統合**:
  - OpenAI GPT-4 API
  - Anthropic Claude 3.5 API
  - Google Gemini API
  - Vercel AI SDK

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

# AI機能を使用する場合は、以下のAPIキーも設定してください
OPENAI_API_KEY=sk-your-openai-api-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here
\`\`\`

APIキーの取得方法：
- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic Claude**: https://console.anthropic.com/settings/keys
- **Google Gemini**: https://makersuite.google.com/app/apikey

注: AI機能を使用しない場合、APIキーの設定は不要です。

4. データベースのセットアップ

\`\`\`bash
# Prismaクライアントを生成
npm run db:generate

# データベースをプッシュ（スキーマを適用）
npm run db:push

# テストユーザーとサンプルデータを作成
npm run db:init
\`\`\`

5. 開発サーバーを起動

\`\`\`bash
npm run dev
\`\`\`

6. ブラウザで http://localhost:3000 を開き、以下のテストアカウントでログイン

\`\`\`
Email: test@example.com
Password: password123
\`\`\`

## プロジェクト構造

\`\`\`
Kadai_Manager_web/
├── app/                    # Next.js App Router
│   ├── actions/           # Server Actions（API）
│   │   ├── tasks.ts      # 課題CRUD
│   │   ├── subjects.ts   # 時間割CRUD
│   │   ├── events.ts     # 予定CRUD
│   │   ├── notes.ts      # 授業メモCRUD
│   │   ├── files.ts      # ファイルCRUD
│   │   └── reminders.ts  # リマインダーCRUD
│   ├── api/              # APIルート
│   │   └── ai/           # AI機能API
│   │       └── process-file/  # ファイル処理API
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # ダッシュボード
│   ├── tasks/             # 課題管理ページ
│   ├── subjects/          # 時間割ページ
│   ├── calendar/          # カレンダーページ
│   ├── notes/             # 授業メモページ
│   └── files/             # ファイル管理ページ
├── components/            # Reactコンポーネント
│   ├── layout/           # レイアウトコンポーネント
│   │   └── Sidebar.tsx   # サイドバーナビゲーション
│   ├── ai/               # AI機能コンポーネント
│   │   └── AIProcessDialog.tsx  # AI処理ダイアログ
│   └── ui/               # UIコンポーネント
│       ├── card.tsx
│       ├── badge.tsx
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       └── textarea.tsx
├── lib/                   # ユーティリティ関数
│   ├── ai/               # AI機能ライブラリ
│   │   ├── index.ts      # AI統合クライアント
│   │   ├── openai.ts     # OpenAI実装
│   │   ├── claude.ts     # Claude実装
│   │   ├── gemini.ts     # Gemini実装
│   │   ├── prompts.ts    # プロンプトテンプレート
│   │   └── types.ts      # 型定義
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

### 🤖 AI機能
ファイル管理ページから、アップロードしたファイルに対してAI機能を実行できます：

1. **ファイル要約**: 長いドキュメントや講義資料を自動要約
2. **コード生成**: 課題の要件からプログラミングコードを自動生成
3. **詳細分析**: ファイル内容の深い分析と学習提案

**対応AIプロバイダー**:
- OpenAI GPT-4 Omni: 最新のマルチモーダルモデル
- Claude 3.5 Sonnet: 長文処理と日本語に強い
- Google Gemini 1.5 Pro: 高性能な多目的モデル

各ファイルの横にある紫色の✨ボタンから、プロバイダーと操作を選択して実行できます。

詳細な使い方は [AI_FEATURES.md](./AI_FEATURES.md) を参照してください。

## ライセンス

MIT

## 作成者

学校スケジュール管理アプリ開発チーム
