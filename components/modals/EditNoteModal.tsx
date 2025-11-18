"use client"

import { useState, useEffect } from "react"
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
import { updateNote, NoteType } from "@/app/actions/notes"

interface EditNoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjects?: Array<{ id: string; name: string; color: string }>
  note: {
    id: string
    title: string | null
    content: string
    noteType: string
    quizDate: Date | null
    subject: {
      id: string
      name: string
      color: string
    }
  } | null
}

export function EditNoteModal({
  open,
  onOpenChange,
  subjects = [],
  note,
}: EditNoteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    subjectId: "",
    title: "",
    content: "",
    noteType: "general" as NoteType,
    quizDate: "",
  })

  // note が変更されたときにフォームデータを更新
  useEffect(() => {
    if (note) {
      // quizDateをdate形式に変換
      let formattedQuizDate = ""
      if (note.quizDate) {
        const quizDateObj = new Date(note.quizDate)
        const year = quizDateObj.getFullYear()
        const month = String(quizDateObj.getMonth() + 1).padStart(2, '0')
        const day = String(quizDateObj.getDate()).padStart(2, '0')
        formattedQuizDate = `${year}-${month}-${day}`
      }

      setFormData({
        subjectId: note.subject.id,
        title: note.title || "",
        content: note.content,
        noteType: note.noteType as NoteType,
        quizDate: formattedQuizDate,
      })
    }
  }, [note])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note) return

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

      const result = await updateNote({
        id: note.id,
        subjectId: formData.subjectId,
        title: formData.title || undefined,
        content: formData.content,
        noteType: formData.noteType,
        quizDate: formData.quizDate ? new Date(formData.quizDate) : undefined,
      })

      if (result.success) {
        onOpenChange(false)
      } else {
        setError(result.error || "メモの更新に失敗しました")
      }
    } catch (err) {
      setError("エラーが発生しました")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!note) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>メモを編集</DialogTitle>
          <DialogDescription>
            授業メモの情報を編集します。変更を保存するには「更新」をクリックしてください。
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

            {/* タイトル */}
            <div className="grid gap-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="例: 第5回講義の重要ポイント"
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
                placeholder="授業の内容や重要な情報を入力してください"
                rows={5}
                required
              />
            </div>

            {/* メモタイプ */}
            <div className="grid gap-2">
              <Label htmlFor="noteType">タイプ</Label>
              <Select
                value={formData.noteType}
                onValueChange={(value) =>
                  setFormData({ ...formData, noteType: value as NoteType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">一般</SelectItem>
                  <SelectItem value="quiz">小テスト</SelectItem>
                  <SelectItem value="announcement">お知らせ</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 小テスト日付 */}
            {formData.noteType === "quiz" && (
              <div className="grid gap-2">
                <Label htmlFor="quizDate">
                  小テスト日付 <span className="text-red-500">*</span>
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
              {isSubmitting ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
