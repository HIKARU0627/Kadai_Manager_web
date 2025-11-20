'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Check } from 'lucide-react';
import {
  getSemesters,
  createSemester,
  updateSemester,
  deleteSemester,
  setActiveSemester,
  getSemesterRelatedData,
} from '@/app/actions/semesters';
import { SemesterDeleteConfirmDialog } from '@/components/ui/semester-delete-confirm-dialog';

interface Semester {
  id: string;
  year: number;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  isActive: boolean;
  _count?: {
    subjects: number;
  };
}

interface SemesterManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSemesterChange?: () => void;
}

export default function SemesterManagementModal({
  isOpen,
  onClose,
  onSemesterChange,
}: SemesterManagementModalProps) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newSemester, setNewSemester] = useState({
    year: new Date().getFullYear(),
    name: '',
    startDate: '',
    endDate: '',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [semesterToDelete, setSemesterToDelete] = useState<Semester | null>(null);
  const [relatedData, setRelatedData] = useState<{
    subjectsCount: number;
    tasksCount: number;
    eventsCount: number;
    notesCount: number;
    filesCount: number;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSemesters();
    }
  }, [isOpen]);

  const loadSemesters = async () => {
    setIsLoading(true);
    try {
      const data = await getSemesters();
      setSemesters(data as Semester[]);
    } catch (error) {
      console.error('Failed to load semesters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSemester = async () => {
    if (!newSemester.name.trim()) {
      alert('学期名を入力してください');
      return;
    }

    setIsLoading(true);
    try {
      await createSemester({
        year: newSemester.year,
        name: newSemester.name,
        startDate: newSemester.startDate ? new Date(newSemester.startDate) : undefined,
        endDate: newSemester.endDate ? new Date(newSemester.endDate) : undefined,
      });
      setNewSemester({
        year: new Date().getFullYear(),
        name: '',
        startDate: '',
        endDate: '',
      });
      await loadSemesters();
      onSemesterChange?.();
      // 他のコンポーネントに学期が更新されたことを通知
      window.dispatchEvent(new Event('semesterUpdated'));
    } catch (error) {
      console.error('Failed to create semester:', error);
      alert('学期の作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = async (semester: Semester) => {
    // 関連データを取得
    setIsLoading(true);
    try {
      const data = await getSemesterRelatedData(semester.id);
      setRelatedData(data);
      setSemesterToDelete(semester);
      setDeleteDialogOpen(true);
    } catch (error) {
      console.error('Failed to get related data:', error);
      alert('関連データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async (cascadeDelete: boolean) => {
    if (!semesterToDelete) return;

    setIsDeleting(true);
    try {
      await deleteSemester(semesterToDelete.id, cascadeDelete);
      setDeleteDialogOpen(false);
      setSemesterToDelete(null);
      setRelatedData(null);
      await loadSemesters();
      onSemesterChange?.();
      // 他のコンポーネントに学期が更新されたことを通知
      window.dispatchEvent(new Event('semesterUpdated'));
    } catch (error) {
      console.error('Failed to delete semester:', error);
      alert('学期の削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetActive = async (id: string) => {
    setIsLoading(true);
    try {
      await setActiveSemester(id);
      await loadSemesters();
      onSemesterChange?.();
      // 他のコンポーネントに学期が更新されたことを通知
      window.dispatchEvent(new Event('semesterUpdated'));
    } catch (error) {
      console.error('Failed to set active semester:', error);
      alert('学期の切り替えに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>学期管理</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 新規学期追加フォーム */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium mb-4">新しい学期を追加</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="year">年度</Label>
                <Input
                  id="year"
                  type="number"
                  value={newSemester.year}
                  onChange={(e) =>
                    setNewSemester({ ...newSemester, year: parseInt(e.target.value) })
                  }
                  min={2000}
                  max={2100}
                />
              </div>
              <div>
                <Label htmlFor="name">学期名</Label>
                <Input
                  id="name"
                  placeholder="例: 春1期, 秋2期"
                  value={newSemester.name}
                  onChange={(e) => setNewSemester({ ...newSemester, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="startDate">開始日（任意）</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newSemester.startDate}
                  onChange={(e) => setNewSemester({ ...newSemester, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">終了日（任意）</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newSemester.endDate}
                  onChange={(e) => setNewSemester({ ...newSemester, endDate: e.target.value })}
                />
              </div>
            </div>
            <Button onClick={handleAddSemester} disabled={isLoading} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              追加
            </Button>
          </div>

          {/* 学期一覧 */}
          <div>
            <h3 className="font-medium mb-4">登録済みの学期</h3>
            {isLoading && <p className="text-gray-500">読み込み中...</p>}
            {!isLoading && semesters.length === 0 && (
              <p className="text-gray-500">学期が登録されていません</p>
            )}
            <div className="space-y-2">
              {semesters.map((semester) => (
                <div
                  key={semester.id}
                  className={`border rounded-lg p-4 flex items-center justify-between ${
                    semester.isActive ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">
                        {semester.year}年度 {semester.name}
                      </h4>
                      {semester.isActive && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                          現在の学期
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      教科数: {semester._count?.subjects || 0}
                      {semester.startDate && semester.endDate && (
                        <span className="ml-4">
                          {new Date(semester.startDate).toLocaleDateString()} -{' '}
                          {new Date(semester.endDate).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!semester.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetActive(semester.id)}
                        disabled={isLoading}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        アクティブにする
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteClick(semester)}
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>

      {/* 削除確認ダイアログ */}
      <SemesterDeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        semesterName={
          semesterToDelete
            ? `${semesterToDelete.year}年度 ${semesterToDelete.name}`
            : ''
        }
        relatedData={relatedData}
        isDeleting={isDeleting}
      />
    </Dialog>
  );
}
