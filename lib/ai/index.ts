// AI統合クライアント

import { processWithOpenAI } from './openai';
import { processWithClaude } from './claude';
import { processWithGemini } from './gemini';
import type { AIProvider, AIOperation, AIResponse } from './types';

export * from './types';
export * from './prompts';

/**
 * 指定されたAIプロバイダーでファイルを処理
 */
export async function processFile(
  provider: AIProvider,
  operation: AIOperation,
  fileName: string,
  fileContent: string,
  options?: {
    language?: string;
    customPrompt?: string;
  }
): Promise<AIResponse> {
  // ファイルサイズチェック（100KB以上は警告）
  if (fileContent.length > 100000) {
    console.warn(
      `Warning: Large file detected (${Math.round(fileContent.length / 1024)}KB)`
    );
  }

  try {
    switch (provider) {
      case 'openai':
        return await processWithOpenAI(operation, fileName, fileContent, options);
      case 'claude':
        return await processWithClaude(operation, fileName, fileContent, options);
      case 'gemini':
        return await processWithGemini(operation, fileName, fileContent, options);
      default:
        return {
          success: false,
          error: `Unsupported provider: ${provider}`,
          provider,
        };
    }
  } catch (error) {
    console.error(`AI Processing Error (${provider}):`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider,
    };
  }
}

/**
 * ファイル内容を読み取る（テキストのみ対応）
 */
export async function extractTextFromFile(
  file: File
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      resolve(text);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * ファイルがテキストベースかチェック
 */
export function isTextFile(fileName: string): boolean {
  const textExtensions = [
    '.txt',
    '.md',
    '.py',
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.java',
    '.c',
    '.cpp',
    '.h',
    '.hpp',
    '.cs',
    '.rb',
    '.go',
    '.rs',
    '.swift',
    '.kt',
    '.php',
    '.html',
    '.css',
    '.json',
    '.xml',
    '.yaml',
    '.yml',
    '.sql',
    '.sh',
    '.bash',
  ];

  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return textExtensions.includes(ext);
}

/**
 * ファイルタイプから推奨されるプログラミング言語を推定
 */
export function inferLanguageFromFile(fileName: string): string {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  const languageMap: Record<string, string> = {
    '.py': 'Python',
    '.js': 'JavaScript',
    '.ts': 'TypeScript',
    '.jsx': 'JavaScript',
    '.tsx': 'TypeScript',
    '.java': 'Java',
    '.c': 'C',
    '.cpp': 'C++',
    '.h': 'C',
    '.hpp': 'C++',
    '.cs': 'C#',
    '.rb': 'Ruby',
    '.go': 'Go',
    '.rs': 'Rust',
    '.swift': 'Swift',
    '.kt': 'Kotlin',
    '.php': 'PHP',
  };

  return languageMap[ext] || 'Python';
}
