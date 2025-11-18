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
import { Loader2, Sparkles, Copy, Check } from 'lucide-react';
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

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError('');
    setResult('');

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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI機能でファイルを処理
          </DialogTitle>
          <DialogDescription>
            {file?.name && (
              <span className="font-medium text-foreground">
                ファイル: {file.name}
              </span>
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
          {!result && !error && (
            <Button
              onClick={handleProcess}
              disabled={isProcessing || !file}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  処理中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI処理を実行
                </>
              )}
            </Button>
          )}

          {/* エラー表示 */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>エラー:</strong> {error}
              </p>
            </div>
          )}

          {/* 結果表示 */}
          {result && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>処理結果</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      コピー済み
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      コピー
                    </>
                  )}
                </Button>
              </div>
              <Textarea
                value={result}
                readOnly
                className="min-h-[400px] font-mono text-sm"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? '閉じる' : 'キャンセル'}
          </Button>
          {result && (
            <Button
              onClick={() => {
                setResult('');
                setError('');
              }}
            >
              再実行
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
