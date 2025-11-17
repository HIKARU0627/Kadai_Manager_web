# 学校スケジュール・課題管理Webアプリ - 設計書

## 目次
1. [プロジェクト概要](#プロジェクト概要)
2. [機能要件](#機能要件)
3. [データベース設計](#データベース設計)
4. [UI/UX設計](#uiux設計)
5. [技術スタック提案](#技術スタック提案)

---

## プロジェクト概要

### 目的
学校の「時間割」「課題」「個人的な予定」「授業メモ」をデジタルで一元管理し、学生生活の「うっかり忘れ」を防ぎ、効率化するためのWebアプリケーション。

### ターゲットユーザー
- 高校生、大学生
- スケジュール管理に課題を感じている学生
- デジタルツールを活用したい学生

---

## 機能要件

### (A) 基本的な情報管理

1. **時間割（科目）管理**
   - 授業名、担当教員、教室、時限（例：月曜1限）を登録・編集
   - 曜日・時限別の時間割表示

2. **課題管理**
   - 課題名、締め切り日時、関連する科目、詳細メモを登録・編集
   - 課題の優先度設定

3. **個人的な予定管理**
   - 予定のタイトル、開始日時、終了日時、場所を登録・編集
   - イベントの色分け表示

4. **授業メモ管理**
   - 授業ごと（科目ごと）に、小テストの日程や連絡事項などのテキストメモを登録・編集
   - メモのカテゴリ分類（一般、小テスト、お知らせ）

### (B) 拡張機能とユーザー体験

5. **ダッシュボード**
   - 「今日の時間割」「今日が締め切りの課題」「今日の個人的な予定」を一覧表示
   - 一目で今日やることが分かるUI

6. **カレンダー表示**
   - 課題の締め切り、個人的な予定、小テスト日程を月間・週間カレンダーで表示
   - 色分けによる視覚的な管理

7. **リマインダー機能**
   - 課題の締め切りや予定が近づくとアラート（通知）を表示
   - 複数の通知タイプ（アプリ内、メール、プッシュ通知）

8. **課題の進捗管理**
   - 課題の状態を「未着手」「作業中」「完了」の3ステータスで管理
   - ステータスの一括変更機能

9. **検索機能**
   - 課題名、メモの内容などをキーワードで横断的に検索
   - フィルタリング機能（科目別、日付範囲など）

10. **資料・ファイル管理**
    - 授業資料（PDFなど）や提出した課題（Wordなど）のファイルパスやURLを保存
    - 課題や授業メモに関連付けて管理

---

## データベース設計

### ER図概要
```
users (1) ━━━ (N) subjects
users (1) ━━━ (N) tasks
users (1) ━━━ (N) events
users (1) ━━━ (N) notes
users (1) ━━━ (N) files
users (1) ━━━ (N) reminders

subjects (1) ━━━ (N) tasks
subjects (1) ━━━ (N) notes
subjects (1) ━━━ (N) files

tasks (1) ━━━ (N) files
tasks (1) ━━━ (N) reminders

notes (1) ━━━ (N) files
notes (1) ━━━ (N) reminders

events (1) ━━━ (N) reminders
```

### テーブル定義

#### 1. users テーブル
ユーザー情報を管理

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**カラム説明:**
- `id`: ユーザーID（主キー）
- `username`: ユーザー名（一意）
- `email`: メールアドレス（一意）
- `password_hash`: パスワードハッシュ（セキュリティ）
- `full_name`: フルネーム
- `created_at`: アカウント作成日時
- `updated_at`: 最終更新日時

---

#### 2. subjects テーブル
時間割・科目情報を管理

```sql
CREATE TABLE subjects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  teacher VARCHAR(100),
  classroom VARCHAR(50),
  day_of_week INTEGER NOT NULL,
  period INTEGER NOT NULL,
  start_time TIME,
  end_time TIME,
  color VARCHAR(7) DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**カラム説明:**
- `id`: 科目ID（主キー）
- `user_id`: ユーザーID（外部キー）
- `name`: 授業名
- `teacher`: 担当教員
- `classroom`: 教室
- `day_of_week`: 曜日（0=日曜, 1=月曜, ..., 6=土曜）
- `period`: 時限（1, 2, 3, ...）
- `start_time`: 開始時刻
- `end_time`: 終了時刻
- `color`: カレンダー表示用の色（HEX形式）

---

#### 3. tasks テーブル
課題情報を管理

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  due_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'not_started',
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);
```

**カラム説明:**
- `id`: 課題ID（主キー）
- `user_id`: ユーザーID（外部キー）
- `subject_id`: 関連科目ID（外部キー、NULL可）
- `title`: 課題名
- `description`: 詳細メモ
- `due_date`: 締め切り日時
- `status`: 進捗ステータス（not_started, in_progress, completed）
- `priority`: 優先度（0=低, 1=中, 2=高）
- `completed_at`: 完了日時

---

#### 4. events テーブル
個人的な予定を管理

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP NOT NULL,
  location VARCHAR(200),
  color VARCHAR(7) DEFAULT '#10B981',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**カラム説明:**
- `id`: 予定ID（主キー）
- `user_id`: ユーザーID（外部キー）
- `title`: 予定タイトル
- `description`: 詳細
- `start_datetime`: 開始日時
- `end_datetime`: 終了日時
- `location`: 場所
- `color`: カレンダー表示用の色

---

#### 5. notes テーブル
授業メモを管理

```sql
CREATE TABLE notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title VARCHAR(200),
  content TEXT NOT NULL,
  note_type VARCHAR(20) DEFAULT 'general',
  quiz_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**カラム説明:**
- `id`: メモID（主キー）
- `user_id`: ユーザーID（外部キー）
- `subject_id`: 科目ID（外部キー）
- `title`: メモタイトル
- `content`: メモ内容
- `note_type`: メモのタイプ（general, quiz, announcement）
- `quiz_date`: 小テスト日程（該当する場合）

---

#### 6. files テーブル
資料・ファイルを管理

```sql
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500),
  file_url VARCHAR(500),
  file_type VARCHAR(50),
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**カラム説明:**
- `id`: ファイルID（主キー）
- `user_id`: ユーザーID（外部キー）
- `task_id`: 課題ID（外部キー、NULL可）
- `note_id`: メモID（外部キー、NULL可）
- `subject_id`: 科目ID（外部キー、NULL可）
- `file_name`: ファイル名
- `file_path`: ファイルパス
- `file_url`: ファイルURL
- `file_type`: ファイルタイプ（pdf, docx, xlsx, etc.）
- `file_size`: ファイルサイズ（bytes）

---

#### 7. reminders テーブル
リマインダーを管理

```sql
CREATE TABLE reminders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
  reminder_datetime TIMESTAMP NOT NULL,
  is_sent BOOLEAN DEFAULT FALSE,
  notification_type VARCHAR(20) DEFAULT 'app',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**カラム説明:**
- `id`: リマインダーID（主キー）
- `user_id`: ユーザーID（外部キー）
- `task_id`: 課題ID（外部キー、NULL可）
- `event_id`: 予定ID（外部キー、NULL可）
- `note_id`: メモID（外部キー、NULL可）
- `reminder_datetime`: リマインダー発火日時
- `is_sent`: 送信済みフラグ
- `notification_type`: 通知タイプ（app, email, push）

---

## UI/UX設計

### デザインコンセプト
- **モダン**: Tailwind CSSによる洗練されたデザイン
- **直感的**: 一目で情報が把握できるカードレイアウト
- **色分け**: カテゴリや優先度による視覚的な情報整理
- **レスポンシブ**: PC・タブレット・スマートフォンに対応

### 主要画面

#### 1. ダッシュボード
**目的:** 今日やることが一目でわかる

**主要要素:**
- サイドナビゲーション（ダッシュボード、時間割、課題、カレンダー、授業メモ）
- ユーザー情報表示
- 今日の時間割カード
  - 時限、授業名、時間、教室、担当教員を表示
  - 色分けによる視覚的な区別
- 今日が締め切りの課題カード
  - 課題名、科目名、締め切り時刻、進捗ステータス
  - 緊急度による色分け
- 今日の個人的な予定カード
  - 予定タイトル、時間、場所
- クイックアクションボタン（課題追加、予定追加）

**ワイヤーフレーム:** `wireframes/dashboard.html` 参照

---

#### 2. 課題一覧ページ
**目的:** 課題の進捗を効率的に管理

**主要要素:**
- ページヘッダー（タイトル、新規課題追加ボタン）
- 検索バー（課題名、科目名で検索）
- タブ機能
  - 未着手、作業中、完了、すべて
  - 各タブに課題数を表示
- 課題カードリスト
  - 優先度バッジ（高優先度、中優先度、通常）
  - 科目タグ
  - 課題名、詳細、締め切り
  - ファイル添付数
  - 進捗変更セレクタ（未着手、作業中、完了）
  - 詳細表示ボタン、編集ボタン
- ページネーション

**ワイヤーフレーム:** `wireframes/tasks.html` 参照

---

### カラーパレット
- **プライマリ**: Blue (#3B82F6)
- **成功/予定**: Green (#10B981)
- **警告/作業中**: Yellow (#F59E0B)
- **エラー/緊急**: Red (#EF4444)
- **情報**: Purple (#8B5CF6)
- **グレー系**: Gray (#6B7280, #F3F4F6, #E5E7EB)

---

## 技術スタック提案

### 候補1: フルスタックJavaScript（Next.js + Prisma + PostgreSQL）★推奨

#### 構成
- **フロントエンド**: Next.js 14 (React), Tailwind CSS, shadcn/ui
- **バックエンド**: Next.js API Routes (Server Actions)
- **データベース**: PostgreSQL
- **ORM**: Prisma
- **認証**: NextAuth.js
- **デプロイ**: Vercel (フロントエンド) + Supabase/Railway (データベース)

#### メリット
✅ フロントエンドとバックエンドを同一言語（TypeScript）で開発でき、学習コストが低い
✅ Next.jsのServer Actionsにより、APIエンドポイントを明示的に作成せずにサーバーサイド処理が可能
✅ Prismaの型安全性により、データベース操作のバグが減少
✅ Vercelへのデプロイが非常に簡単（Git pushだけで自動デプロイ）
✅ 豊富なReactコンポーネントライブラリ（shadcn/ui）で高品質なUIを迅速に構築可能

#### デメリット
❌ Next.jsの学習曲線がやや高い（Server ComponentsとClient Componentsの使い分けなど）
❌ PostgreSQLのホスティングに追加コストが発生する可能性
❌ フルスタックフレームワークのため、特定部分だけを切り離すのが難しい

---

### 候補2: 軽量SPA + RESTful API（React + Express + MySQL）

#### 構成
- **フロントエンド**: React 18, Vite, Tailwind CSS, React Router, TanStack Query
- **バックエンド**: Node.js + Express.js
- **データベース**: MySQL 8.0
- **ORM**: Sequelize
- **認証**: JWT (jsonwebtoken)
- **デプロイ**: Netlify/Vercel (フロント) + Render/Railway (バックエンド)

#### メリット
✅ フロントエンドとバックエンドが完全に分離されており、スケーラビリティが高い
✅ RESTful APIの設計により、将来的にモバイルアプリなど他のクライアントからも利用可能
✅ MySQLは多くのホスティングサービスで安価に利用でき、コストパフォーマンスが良い
✅ Expressは非常にシンプルで、学習コストが低い
✅ 各技術要素が独立しているため、部分的な置き換えが容易

#### デメリット
❌ フロントエンドとバックエンドを別々にデプロイ・管理する必要があり、運用コストが高い
❌ CORS設定など、フロント・バック分離特有の設定が必要
❌ APIエンドポイントの設計・実装に時間がかかる
❌ 型安全性を確保するためには、フロント・バック間でスキーマ定義を共有する仕組みが必要

---

### 候補3: Pythonフルスタック（Django + PostgreSQL）

#### 構成
- **フロントエンド**: Django Templates + HTMX, Tailwind CSS
- **バックエンド**: Django 5.0
- **データベース**: PostgreSQL
- **ORM**: Django ORM
- **認証**: Django標準認証システム
- **デプロイ**: Heroku / Render / PythonAnywhere

#### メリット
✅ Djangoの「Batteries Included」思想により、認証、管理画面、ORMなどがすべて標準装備
✅ Django Admin（管理画面）により、データ管理のUIが自動生成される
✅ HTMXを使うことで、SPAのような動的なUIをJavaScriptを最小限に抑えて実装可能
✅ Pythonは教育現場でも広く使われており、学生にとって馴染みがある可能性が高い
✅ セキュリティ機能（CSRF保護、SQLインジェクション対策など）が標準で組み込まれている

#### デメリット
❌ フロントエンドの技術スタックが古典的（テンプレートエンジン）で、モダンなSPAに比べてユーザー体験が劣る可能性
❌ HTMXは比較的新しい技術で、Reactなどに比べてコミュニティやライブラリが小さい
❌ デプロイ先の選択肢がNode.jsに比べてやや少ない
❌ リアルタイム通知などの実装にはDjango Channelsが必要で、追加の学習コストがかかる

---

### 推奨: 候補1（Next.js + Prisma + PostgreSQL）

学校スケジュール・課題管理アプリの要件を考慮すると、**候補1のNext.js + Prisma + PostgreSQL**が最も適しています。

#### 理由
1. カレンダー表示やダッシュボードなど、リッチなUIが求められるため、Reactのエコシステムが有利
2. リマインダー機能などリアルタイム性が求められる機能を将来的に実装しやすい
3. Prismaの型安全性により、複雑なリレーションを持つデータベース設計でもバグを防ぎやすい
4. Vercelへのデプロイが簡単で、学生が個人プロジェクトとして運用する際の負担が少ない
5. TypeScriptによる型安全性で、開発効率と保守性が向上

---

## 次のステップ

1. **技術スタックの選定**: 上記3つの候補から選択
2. **開発環境のセットアップ**: 必要なツールとライブラリのインストール
3. **データベースのマイグレーション**: スキーマの作成
4. **認証システムの実装**: ユーザー登録・ログイン機能
5. **基本機能の実装**: 時間割、課題、予定、メモのCRUD操作
6. **UI実装**: ダッシュボード、課題一覧などの画面
7. **拡張機能の実装**: カレンダー表示、リマインダー、検索機能
8. **テスト**: 単体テスト、統合テスト
9. **デプロイ**: 本番環境への展開
10. **運用・保守**: バグ修正、機能追加

---

**作成日**: 2025-11-17
**バージョン**: 1.0
