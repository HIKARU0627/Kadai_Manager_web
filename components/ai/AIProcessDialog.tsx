'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Sparkles, Copy, Check, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import { CODE_LANGUAGES } from '@/lib/ai/prompts';

interface AIProcessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  file: {
    id: string;
    name: string;
  } | null;
}

type AIProvider = 'openai' | 'claude' | 'gemini';
type AIOperation = 'summarize' | 'generate-code' | 'analyze';

export function AIProcessDialog({
  isOpen,
  onClose,
  file,
}: AIProcessDialogProps) {
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [operation, setOperation] = useState<AIOperation>('summarize');
  const [language, setLanguage] = useState<string>('Python');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [processingTime, setProcessingTime] = useState<number>(0);

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError('');
    setResult('');
    const startTime = Date.now();

    try {
      const response = await fetch('/api/ai/process-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: file.id,
          provider,
          operation,
          language: operation === 'generate-code' ? language : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI処理に失敗しました');
      }

      setResult(data.result || '');
      setProcessingTime(Math.round((Date.now() - startTime) / 1000));
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期しないエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setResult('');
    setError('');
    setProvider('openai');
    setOperation('summarize');
    setLanguage('Python');
    setProcessingTime(0);
    onClose();
  };

  const getOperationLabel = (op: AIOperation) => {
    switch (op) {
      case 'summarize':
        return '要約生成';
      case 'generate-code':
        return 'コード生成';
      case 'analyze':
        return '詳細分析';
    }
  };

  const getProviderLabel = (p: AIProvider) => {
    switch (p) {
      case 'openai':
        return 'OpenAI (GPT-4)';
      case 'claude':
        return 'Claude 3.5 Sonnet';
      case 'gemini':
        return 'Google Gemini';
    }
  };

  const getErrorHelp = (errorMsg: string, currentProvider: AIProvider) => {
    const msg = errorMsg.toLowerCase();

    if (msg.includes('api_key') || msg.includes('apiキー') || msg.includes('設定されていません')) {
      return {
        title: 'APIキーが設定されていません',
        description: `${getProviderLabel(currentProvider)}のAPIキーが.envファイルに設定されていません。`,
        suggestions: [
          '1. プロジェクトのルートディレクトリに.envファイルを作成',
          '2. 必要なAPIキーを追加',
          '3. 開発サーバーを再起動（Ctrl+C → npm run dev）',
        ],
        link: currentProvider === 'openai'
          ? 'https://platform.openai.com/api-keys'
          : currentProvider === 'claude'
          ? 'https://console.anthropic.com/settings/keys'
          : 'https://makersuite.google.com/app/apikey',
        linkText: 'APIキーを取得',
      };
    }

    if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('invalid') || msg.includes('認証')) {
      return {
        title: 'APIキーが無効です',
        description: '設定されたAPIキーが無効または期限切れの可能性があります。',
        suggestions: [
          '1. APIキーが正しくコピーされているか確認',
          '2. APIキーの有効期限を確認',
          '3. 新しいAPIキーを生成して再設定',
        ],
        link: currentProvider === 'openai'
          ? 'https://platform.openai.com/api-keys'
          : currentProvider === 'claude'
          ? 'https://console.anthropic.com/settings/keys'
          : 'https://makersuite.google.com/app/apikey',
        linkText: 'APIキー管理ページ',
      };
    }

    if (msg.includes('429') || msg.includes('rate limit') || msg.includes('quota')) {
      return {
        title: 'レート制限またはクォータ超過',
        description: 'APIの使用制限に達しました。',
        suggestions: [
          '1. しばらく時間をおいてから再試行',
          '2. 別のAIプロバイダーを試す',
          '3. APIプランをアップグレードする',
        ],
      };
    }

    if (msg.includes('503') || msg.includes('overloaded') || msg.includes('service unavailable')) {
      return {
        title: 'サービスが過負荷状態です',
        description: `${getProviderLabel(currentProvider)}のサーバーが現在過負荷状態です。しばらく時間をおいてから再試行してください。`,
        suggestions: [
          '1. 数分待ってから再試行',
          '2. 別のAIプロバイダー（OpenAI または Claude）を試す',
          '3. ファイルサイズを小さくして再試行',
        ],
      };
    }

    if (msg.includes('404') || msg.includes('not found') || msg.includes('model')) {
      return {
        title: 'モデルが見つかりません',
        description: '指定されたAIモデルが利用できません。',
        suggestions: [
          '1. 別のAIプロバイダーを試す',
          '2. しばらく待ってから再試行',
        ],
      };
    }

    if (msg.includes('読み取りに失敗') || msg.includes('ファイル')) {
      return {
        title: 'ファイルの読み取りエラー',
        description: 'ファイルを読み取れませんでした。',
        suggestions: [
          '1. テキストファイル（.txt、.md、.pyなど）を使用',
          '2. ファイルサイズを200KB以下に',
          '3. ファイルが正しくアップロードされているか確認',
        ],
      };
    }

    if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
      return {
        title: 'ネットワークエラー',
        description: 'インターネット接続に問題があります。',
        suggestions: [
          '1. インターネット接続を確認',
          '2. VPNを使用している場合は無効化して試す',
          '3. しばらく待ってから再試行',
        ],
      };
    }

    return {
      title: '予期しないエラー',
      description: errorMsg,
      suggestions: [
        '1. 別のAIプロバイダーを試す',
        '2. ファイルを確認して再度アップロード',
        '3. ブラウザをリフレッシュして再試行',
      ],
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI機能でファイルを処理
          </DialogTitle>
          <DialogDescription>
            {file?.name ? (
              <>
                ファイル: <span className="font-medium text-foreground">{file.name}</span>
                <br />
                AIプロバイダーと操作を選択して、ファイルを処理します。
              </>
            ) : (
              'AIプロバイダーと操作を選択して、ファイルを処理します。'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* AIプロバイダー選択 */}
          <div>
            <Label htmlFor="provider">AIプロバイダー</Label>
            <Select
              value={provider}
              onValueChange={(value) => setProvider(value as AIProvider)}
              disabled={isProcessing}
            >
              <SelectTrigger id="provider">
                <SelectValue placeholder="プロバイダーを選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">{getProviderLabel('openai')}</SelectItem>
                <SelectItem value="claude">{getProviderLabel('claude')}</SelectItem>
                <SelectItem value="gemini">{getProviderLabel('gemini')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 操作選択 */}
          <div>
            <Label htmlFor="operation">実行する操作</Label>
            <Select
              value={operation}
              onValueChange={(value) => setOperation(value as AIOperation)}
              disabled={isProcessing}
            >
              <SelectTrigger id="operation">
                <SelectValue placeholder="操作を選択" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="summarize">
                  📝 {getOperationLabel('summarize')}
                </SelectItem>
                <SelectItem value="generate-code">
                  💻 {getOperationLabel('generate-code')}
                </SelectItem>
                <SelectItem value="analyze">
                  🔍 {getOperationLabel('analyze')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* コード生成時の言語選択 */}
          {operation === 'generate-code' && (
            <div>
              <Label htmlFor="language">プログラミング言語</Label>
              <Select
                value={language}
                onValueChange={setLanguage}
                disabled={isProcessing}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="言語を選択" />
                </SelectTrigger>
                <SelectContent>
                  {CODE_LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 処理ボタン */}
          {!result && !error && !isProcessing && (
            <Button
              onClick={handleProcess}
              disabled={!file}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              size="lg"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI処理を実行
            </Button>
          )}

          {/* ローディング状態 */}
          {isProcessing && (
            <div className="border border-blue-200 rounded-lg overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="p-6">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-400 to-blue-500 animate-pulse"></div>
                    <Loader2 className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-white animate-spin" />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-base font-semibold text-gray-800">
                      {getProviderLabel(provider)}で処理中...
                    </p>
                    <p className="text-sm text-gray-600">
                      {operation === 'summarize' && '📝 ファイルを要約しています'}
                      {operation === 'generate-code' && `💻 ${language}コードを生成しています`}
                      {operation === 'analyze' && '🔍 ファイルを詳細分析しています'}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      通常、10〜30秒程度かかります
                    </p>
                  </div>
                  <div className="w-full max-w-xs">
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="border border-red-200 rounded-lg overflow-hidden bg-gradient-to-br from-red-50 to-red-100">
              <div className="p-4 border-b border-red-200 bg-red-50">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-red-900 mb-1">
                      {getErrorHelp(error, provider).title}
                    </h3>
                    <p className="text-sm text-red-700">
                      {getErrorHelp(error, provider).description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  💡 解決方法
                </h4>
                <ul className="space-y-2">
                  {getErrorHelp(error, provider).suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-red-500 flex-shrink-0">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>

                {getErrorHelp(error, provider).link && (
                  <a
                    href={getErrorHelp(error, provider).link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {getErrorHelp(error, provider).linkText}
                  </a>
                )}

                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={handleProcess}
                    disabled={isProcessing}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    再試行
                  </Button>
                  <Button
                    onClick={() => setError('')}
                    variant="ghost"
                    size="sm"
                  >
                    閉じる
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* 結果表示 */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-900">処理完了</p>
                    <p className="text-xs text-green-700">
                      {getProviderLabel(provider)}による{getOperationLabel(operation)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex items-center gap-2 bg-white hover:bg-gray-50"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-green-600">コピー済み</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      コピー
                    </>
                  )}
                </Button>
              </div>
              <div className="relative">
                <Textarea
                  value={result}
                  readOnly
                  className="min-h-[400px] font-mono text-sm bg-gray-50 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <div className="absolute top-2 right-2 bg-gray-900/80 text-white text-xs px-2 py-1 rounded">
                  {result.split('\n').length} 行
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {result && processingTime > 0 && `処理時間: ${processingTime}秒`}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              {result ? '閉じる' : 'キャンセル'}
            </Button>
            {result && (
              <Button
                onClick={() => {
                  setResult('');
                  setError('');
                  setProcessingTime(0);
                }}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                再実行
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
