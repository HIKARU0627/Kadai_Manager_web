// OpenAI APIクライアント

import OpenAI from 'openai';
import { PROMPTS } from './prompts';
import type { AIOperation, AIResponse } from './types';

// クライアントのシングルトン
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export async function processWithOpenAI(
  operation: AIOperation,
  fileName: string,
  fileContent: string,
  options?: { language?: string; customPrompt?: string }
): Promise<AIResponse> {
  try {
    const client = getOpenAIClient();

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

    const response = await client.chat.completions.create({
      model: 'gpt-4o', // 最新のGPT-4 Omni
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    });

    const result = response.choices[0]?.message?.content || '';
    const tokensUsed = response.usage?.total_tokens || 0;

    return {
      success: true,
      result,
      provider: 'openai',
      tokensUsed,
    };
  } catch (error) {
    console.error('OpenAI API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'openai',
    };
  }
}
