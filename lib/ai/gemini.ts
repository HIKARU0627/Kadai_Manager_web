// Google Gemini APIクライアント

import { GoogleGenerativeAI } from '@google/generative-ai';
import { PROMPTS } from './prompts';
import type { AIOperation, AIResponse } from './types';

// クライアントのシングルトン
let geminiClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY が設定されていません。.env ファイルにAPIキーを追加してください。取得先: https://makersuite.google.com/app/apikey');
    }
    geminiClient = new GoogleGenerativeAI(apiKey);
  }
  return geminiClient;
}

export async function processWithGemini(
  operation: AIOperation,
  fileName: string,
  fileContent: string,
  options?: { language?: string; customPrompt?: string }
): Promise<AIResponse> {
  try {
    const client = getGeminiClient();
    // 利用可能なモデル: gemini-pro, gemini-1.5-flash, gemini-2.0-flash-exp
    const model = client.getGenerativeModel({ model: 'gemini-pro' });

    let systemPrompt = '';
    let userPrompt = '';

    switch (operation) {
      case 'summarize':
        systemPrompt = PROMPTS.summarize.system;
        userPrompt = PROMPTS.summarize.user(fileName, fileContent);
        break;
      case 'generate-code':
        systemPrompt = PROMPTS.generateCode.system;
        userPrompt = PROMPTS.generateCode.user(
          fileName,
          fileContent,
          options?.language || 'Python'
        );
        break;
      case 'analyze':
        systemPrompt = PROMPTS.analyze.system;
        userPrompt = PROMPTS.analyze.user(fileName, fileContent);
        break;
      case 'chat':
        systemPrompt = 'あなたは親切な学習アシスタントです。';
        userPrompt = options?.customPrompt || fileContent;
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }

    // Geminiはsystem promptを直接サポートしていないため、user promptに含める
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text();

    // Gemini APIはトークン使用量を直接提供しないため、概算
    const tokensUsed = Math.ceil((fullPrompt.length + text.length) / 4);

    return {
      success: true,
      result: text,
      provider: 'gemini',
      tokensUsed,
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'gemini',
    };
  }
}
