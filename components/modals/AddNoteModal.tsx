"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createNote, NoteType } from "@/app/actions/notes"

interface AddNoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjects?: Array<{ id: string; name: string; color: string }>
  userId: string
}

export function AddNoteModal({
  open,
  onOpenChange,
  subjects = [],
  userId,
}: AddNoteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    subjectId: "",
    title: "",
    content: "",
    noteType: "general" as NoteType,
    quizDate: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Validation
      if (!formData.subjectId) {
        setError("科目を選択してください")
        setIsSubmitting(false)
        return
      }

      if (!formData.content.trim()) {
        setError("内容を入力してください")
        setIsSubmitting(false)
        return
      }

      if (formData.noteType === "quiz" && !formData.quizDate) {
        setError("小テストの日付を設定してください")
        setIsSubmitting(false)
        return
      }

      const result = await createNote({
        userId,
        subjectId: formData.subjectId,
        title: formData.title || undefined,
        content: formData.content,
        noteType: formData.noteType,
        quizDate: formData.quizDate ? new Date(formData.quizDate) : undefined,
      })

      if (result.success) {
        // Reset form
        setFormData({
          subjectId: "",
          title: "",
          content: "",
          noteType: "general",
          quizDate: "",
        })
        onOpenChange(false)
      } else {
        setError(result.error || "メモの作成に失敗しました")
      }
    } catch (err) {
      setError("エラーが発生しました")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>授業メモを追加</DialogTitle>
          <DialogDescription>
            授業のメモ、小テスト日程、お知らせを登録します。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* 科目選択 */}
            <div className="grid gap-2">
              <Label htmlFor="subject">
                科目 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) =>
                  setFormData({ ...formData, subjectId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="科目を選択" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* メモタイプ */}
            <div className="grid gap-2">
              <Label htmlFor="noteType">
                種類 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.noteType}
                onValueChange={(value: NoteType) =>
                  setFormData({ ...formData, noteType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">メモ</SelectItem>
                  <SelectItem value="quiz">小テスト</SelectItem>
                  <SelectItem value="announcement">お知らせ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* タイトル */}
            <div className="grid gap-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder={
                  formData.noteType === "quiz"
                    ? "例: 第3章の小テスト"
                    : "例: 重要な公式まとめ"
                }
              />
            </div>

            {/* 内容 */}
            <div className="grid gap-2">
              <Label htmlFor="content">
                内容 <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder="メモの内容を入力してください"
                rows={6}
                required
              />
            </div>

            {/* 小テスト日付（小テストの場合のみ表示） */}
            {formData.noteType === "quiz" && (
              <div className="grid gap-2">
                <Label htmlFor="quizDate">
                  小テスト日 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="quizDate"
                  type="date"
                  value={formData.quizDate}
                  onChange={(e) =>
                    setFormData({ ...formData, quizDate: e.target.value })
                  }
                  required
                />
              </div>
            )}

            {/* エラーメッセージ */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "作成中..." : "メモを作成"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
