'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, FileText, Calendar, StickyNote, Paperclip, BookOpen } from 'lucide-react';

interface RelatedData {
  subjectsCount: number;
  tasksCount: number;
  eventsCount: number;
  notesCount: number;
  filesCount: number;
}

interface SemesterDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (cascadeDelete: boolean) => void;
  semesterName: string;
  relatedData: RelatedData | null;
  isDeleting: boolean;
}

export function SemesterDeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  semesterName,
  relatedData,
  isDeleting,
}: SemesterDeleteConfirmDialogProps) {
  const hasRelatedData = relatedData && relatedData.subjectsCount > 0;
  const totalItems = relatedData
    ? relatedData.subjectsCount +
      relatedData.tasksCount +
      relatedData.eventsCount +
      relatedData.notesCount +
      relatedData.filesCount
    : 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            学期を削除しますか？
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="font-medium text-gray-900">
                「{semesterName}」を削除しようとしています。
              </p>

              {hasRelatedData ? (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-yellow-800 mb-3">
                      この学期には以下の関連データがあります：
                    </p>
                    <div className="space-y-2 text-sm text-yellow-900">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        <span>科目: {relatedData.subjectsCount}件</span>
                      </div>
                      {relatedData.tasksCount > 0 && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>課題: {relatedData.tasksCount}件</span>
                        </div>
                      )}
                      {relatedData.eventsCount > 0 && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>イベント: {relatedData.eventsCount}件</span>
                        </div>
                      )}
                      {relatedData.notesCount > 0 && (
                        <div className="flex items-center gap-2">
                          <StickyNote className="w-4 h-4" />
                          <span>ノート: {relatedData.notesCount}件</span>
                        </div>
                      )}
                      {relatedData.filesCount > 0 && (
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4" />
                          <span>ファイル: {relatedData.filesCount}件</span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-yellow-900 mt-3">
                      合計 {totalItems}件のデータ
                    </p>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800 font-medium mb-2">
                      削除方法を選択してください：
                    </p>
                    <div className="space-y-2 text-sm text-red-700">
                      <p>
                        <strong>科目のみ削除:</strong> 科目の学期情報のみがクリアされます。課題やイベントは残ります。
                      </p>
                      <p>
                        <strong>すべて削除:</strong> 科目とすべての関連データ（課題、イベント、ノート、ファイル）が完全に削除されます。
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-red-600 font-medium">
                    この操作は取り消せません。本当に削除してもよろしいですか？
                  </p>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  この学期には関連する科目がありません。学期を削除できます。
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2">
          {hasRelatedData ? (
            <>
              <AlertDialogAction
                onClick={() => onConfirm(true)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 w-full"
              >
                {isDeleting ? '削除中...' : 'すべて削除する'}
              </AlertDialogAction>
              <AlertDialogAction
                onClick={() => onConfirm(false)}
                disabled={isDeleting}
                className="bg-orange-600 hover:bg-orange-700 w-full"
              >
                {isDeleting ? '削除中...' : '科目のみ削除する'}
              </AlertDialogAction>
              <AlertDialogCancel disabled={isDeleting} className="w-full">
                キャンセル
              </AlertDialogCancel>
            </>
          ) : (
            <>
              <AlertDialogAction
                onClick={() => onConfirm(false)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 w-full"
              >
                {isDeleting ? '削除中...' : '削除する'}
              </AlertDialogAction>
              <AlertDialogCancel disabled={isDeleting} className="w-full">
                キャンセル
              </AlertDialogCancel>
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
