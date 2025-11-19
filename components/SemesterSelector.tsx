'use client';

import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Settings } from 'lucide-react';
import { getSemesters, getActiveSemester } from '@/app/actions/semesters';

interface Semester {
  id: string;
  year: number;
  name: string;
  isActive: boolean;
}

interface SemesterSelectorProps {
  selectedSemesterId: string | null;
  onSemesterChange: (semesterId: string | null) => void;
  onManageSemesters?: () => void;
}

export default function SemesterSelector({
  selectedSemesterId,
  onSemesterChange,
  onManageSemesters,
}: SemesterSelectorProps) {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSemesters();
  }, []);

  const loadSemesters = async () => {
    setIsLoading(true);
    try {
      const data = await getSemesters();
      setSemesters(data as Semester[]);

      // 初回読み込み時、選択されていない場合はアクティブな学期を選択
      if (!selectedSemesterId) {
        const activeSemester = await getActiveSemester();
        if (activeSemester) {
          onSemesterChange(activeSemester.id);
        }
      }
    } catch (error) {
      console.error('Failed to load semesters:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 外部から学期リストを再読み込みするための関数
  useEffect(() => {
    const handleSemesterUpdate = () => {
      loadSemesters();
    };

    window.addEventListener('semesterUpdated', handleSemesterUpdate);
    return () => window.removeEventListener('semesterUpdated', handleSemesterUpdate);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedSemesterId || 'all'}
        onValueChange={(value) => onSemesterChange(value === 'all' ? null : value)}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="学期を選択" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべての学期</SelectItem>
          {semesters.map((semester) => (
            <SelectItem key={semester.id} value={semester.id}>
              {semester.year}年度 {semester.name}
              {semester.isActive && ' (現在)'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {onManageSemesters && (
        <Button variant="outline" size="sm" onClick={onManageSemesters}>
          <Settings className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
