// AI関連の型定義

export type AIProvider = 'openai' | 'claude' | 'gemini';

export type AIOperation = 'summarize' | 'generate-code' | 'analyze' | 'chat';

export interface AIRequest {
  operation: AIOperation;
  provider: AIProvider;
  fileContent: string;
  fileName: string;
  fileType: string;
  prompt?: string;
  language?: string; // コード生成時のプログラミング言語
}

export interface AIResponse {
  success: boolean;
  result?: string;
  error?: string;
  provider: AIProvider;
  tokensUsed?: number;
}

export interface FileAnalysisResult {
  summary?: string;
  generatedCode?: string;
  keyPoints?: string[];
  suggestions?: string[];
}
