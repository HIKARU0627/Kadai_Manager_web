// AIファイル処理APIルート

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { processFile, type AIProvider, type AIOperation } from '@/lib/ai';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // リクエストボディの解析
    const body = await request.json();
    const {
      fileId,
      operation,
      provider,
      language,
      customPrompt,
    }: {
      fileId: string;
      operation: AIOperation;
      provider: AIProvider;
      language?: string;
      customPrompt?: string;
    } = body;

    // バリデーション
    if (!fileId || !operation || !provider) {
      return NextResponse.json(
        { error: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }

    // ファイル情報を取得
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    const file = await prisma.file.findUnique({
      where: {
        id: fileId,
        userId: user.id, // セキュリティ：自分のファイルのみアクセス可能
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'ファイルが見つかりません' },
        { status: 404 }
      );
    }

    // ファイルパスからコンテンツを読み取る
    // 注: 本番環境ではS3などのストレージからダウンロードする必要があります
    const fs = await import('fs/promises');
    const path = await import('path');

    let fileContent: string;
    try {
      const fullPath = path.join(process.cwd(), 'public', file.path);
      fileContent = await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      console.error('File read error:', error);
      return NextResponse.json(
        { error: 'ファイルの読み取りに失敗しました' },
        { status: 500 }
      );
    }

    // ファイルサイズチェック（200KB制限）
    if (fileContent.length > 200000) {
      return NextResponse.json(
        { error: 'ファイルが大きすぎます（200KB以下にしてください）' },
        { status: 400 }
      );
    }

    // AI処理を実行
    const result = await processFile(
      provider,
      operation,
      file.name,
      fileContent,
      {
        language: language || undefined,
        customPrompt: customPrompt || undefined,
      }
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'AI処理に失敗しました' },
        { status: 500 }
      );
    }

    // 使用ログを記録（オプション）
    // TODO: AI使用履歴をデータベースに保存する場合はここに実装

    return NextResponse.json({
      success: true,
      result: result.result,
      provider: result.provider,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json(
      {
        error: 'サーバーエラーが発生しました',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
