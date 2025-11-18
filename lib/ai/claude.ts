// Anthropic Claude APIクライアント

import Anthropic from '@anthropic-ai/sdk';
import { PROMPTS } from './prompts';
import type { AIOperation, AIResponse } from './types';

// クライアントのシングルトン
let claudeClient: Anthropic | null = null;

function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY が設定されていません。.env ファイルにAPIキーを追加してください。取得先: https://console.anthropic.com/settings/keys');
    }
    claudeClient = new Anthropic({ apiKey });
  }
  return claudeClient;
}

export async function processWithClaude(
  operation: AIOperation,
  fileName: string,
  fileContent: string,
  options?: { language?: string; customPrompt?: string }
): Promise<AIResponse> {
  try {
    const client = getClaudeClient();

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

    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022', // 最新のClaude 3.5 Sonnet
      max_tokens: 4000,
      temperature: 0.7,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const result =
      response.content[0].type === 'text' ? response.content[0].text : '';
    const tokensUsed =
      (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0);

    return {
      success: true,
      result,
      provider: 'claude',
      tokensUsed,
    };
  } catch (error) {
    console.error('Claude API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: 'claude',
    };
  }
}
