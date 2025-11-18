// AIプロンプトテンプレート

export const PROMPTS = {
  summarize: {
    system: `あなたは優秀な学習アシスタントです。提供されたファイルの内容を分析し、要約を作成してください。`,
    user: (fileName: string, content: string) => `
以下のファイルの内容を日本語で要約してください：

ファイル名: ${fileName}

内容:
${content}

以下の形式で要約を提供してください：
1. 概要（2-3文）
2. 主要なポイント（箇条書き）
3. 重要な詳細や注意事項

明確で理解しやすい日本語で回答してください。
`,
  },

  generateCode: {
    system: `あなたは経験豊富なプログラミング教師です。学生の課題を理解し、適切なコードを生成してください。`,
    user: (fileName: string, content: string, language: string = 'Python') => `
以下の課題ファイルの内容を分析し、${language}で実装コードを生成してください：

ファイル名: ${fileName}

課題内容:
${content}

以下を含めてください：
1. 適切なコメント（日本語）
2. エラーハンドリング
3. テストケース例
4. 使用方法の説明

コードは実行可能で、ベストプラクティスに従ってください。
`,
  },

  analyze: {
    system: `あなたは教育コンテンツアナリストです。ファイルの内容を詳細に分析してください。`,
    user: (fileName: string, content: string) => `
以下のファイルを分析してください：

ファイル名: ${fileName}

内容:
${content}

以下を提供してください：
1. コンテンツの種類（課題、ノート、資料など）
2. 難易度評価
3. 推定所要時間
4. 学習のポイント
5. 改善提案

日本語で詳細に分析してください。
`,
  },

  explainCode: {
    system: `あなたはプログラミング教師です。コードを分かりやすく説明してください。`,
    user: (fileName: string, content: string) => `
以下のコードを初心者にも分かりやすく説明してください：

ファイル名: ${fileName}

コード:
${content}

以下を含めてください：
1. コードの目的
2. 各部分の説明
3. 使用されている重要な概念
4. 改善提案

日本語で丁寧に説明してください。
`,
  },
};

export const CODE_LANGUAGES = [
  'Python',
  'JavaScript',
  'TypeScript',
  'Java',
  'C++',
  'C',
  'C#',
  'Ruby',
  'Go',
  'Rust',
  'Swift',
  'Kotlin',
  'PHP',
  'HTML/CSS',
] as const;

export type CodeLanguage = typeof CODE_LANGUAGES[number];
