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
import { createTask } from "@/app/actions/tasks"

interface AddTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjects?: Array<{ id: string; name: string; color: string }>
  userId: string
}

export function AddTaskModal({
  open,
  onOpenChange,
  subjects = [],
  userId,
}: AddTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subjectId: "",
    dueDate: "",
    priority: "0",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Validation
      if (!formData.title.trim()) {
        setError("タイトルを入力してください")
        setIsSubmitting(false)
        return
      }

      if (!formData.dueDate) {
        setError("締め切り日時を設定してください")
        setIsSubmitting(false)
        return
      }

      const result = await createTask({
        userId,
        title: formData.title,
        description: formData.description || undefined,
        subjectId: formData.subjectId || undefined,
        dueDate: new Date(formData.dueDate),
        priority: parseInt(formData.priority),
      })

      if (result.success) {
        // Reset form
        setFormData({
          title: "",
          description: "",
          subjectId: "",
          dueDate: "",
          priority: "0",
        })
        onOpenChange(false)
      } else {
        setError(result.error || "課題の作成に失敗しました")
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
          <DialogTitle>新規課題を追加</DialogTitle>
          <DialogDescription>
            課題の詳細情報を入力してください。すべての項目は後から編集できます。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* タイトル */}
            <div className="grid gap-2">
              <Label htmlFor="title">
                タイトル <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="例: レポート: 微分積分の応用"
                required
              />
            </div>

            {/* 説明 */}
            <div className="grid gap-2">
              <Label htmlFor="description">説明</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="課題の詳細や要件を入力してください"
                rows={4}
              />
            </div>

            {/* 科目選択 */}
            <div className="grid gap-2">
              <Label htmlFor="subject">科目</Label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) =>
                  setFormData({ ...formData, subjectId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="科目を選択（任意）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">科目なし</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 締め切り日時 */}
            <div className="grid gap-2">
              <Label htmlFor="dueDate">
                締め切り日時 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                required
              />
            </div>

            {/* 優先度 */}
            <div className="grid gap-2">
              <Label htmlFor="priority">優先度</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">通常</SelectItem>
                  <SelectItem value="1">中優先度</SelectItem>
                  <SelectItem value="2">高優先度</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
              {isSubmitting ? "作成中..." : "課題を作成"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
