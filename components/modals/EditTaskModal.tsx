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
import { updateTask, TaskType } from "@/app/actions/tasks"

interface EditTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjects?: Array<{ id: string; name: string; color: string }>
  task: {
    id: string
    title: string
    description: string | null
    subjectId: string | null
    dueDate: Date
    priority: number
    status: string
    taskType: string
  } | null
}

export function EditTaskModal({
  open,
  onOpenChange,
  subjects = [],
  task,
}: EditTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subjectId: "none",
    dueDate: "",
    priority: "0",
    status: "not_started",
    taskType: "assignment" as TaskType,
  })

  // task が変更されたときにフォームデータを更新
  useEffect(() => {
    if (task) {
      // dueDateをdatetime-local形式に変換
      const dueDateObj = new Date(task.dueDate)
      const year = dueDateObj.getFullYear()
      const month = String(dueDateObj.getMonth() + 1).padStart(2, '0')
      const day = String(dueDateObj.getDate()).padStart(2, '0')
      const hours = String(dueDateObj.getHours()).padStart(2, '0')
      const minutes = String(dueDateObj.getMinutes()).padStart(2, '0')
      const formattedDueDate = `${year}-${month}-${day}T${hours}:${minutes}`

      setFormData({
        title: task.title,
        description: task.description || "",
        subjectId: task.subjectId || "none",
        dueDate: formattedDueDate,
        priority: String(task.priority),
        status: task.status,
        taskType: (task.taskType || "assignment") as TaskType,
      })
    }
  }, [task])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!task) return

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

      const result = await updateTask({
        id: task.id,
        title: formData.title,
        description: formData.description.trim() === "" ? null : formData.description,
        subjectId: formData.subjectId === "none" ? null : formData.subjectId,
        dueDate: new Date(formData.dueDate),
        priority: parseInt(formData.priority),
        status: formData.status as "not_started" | "in_progress" | "completed",
        taskType: formData.taskType,
      })

      if (result.success) {
        onOpenChange(false)
      } else {
        setError(result.error || "課題の更新に失敗しました")
      }
    } catch (err) {
      setError("エラーが発生しました")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!task) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>課題を編集</DialogTitle>
          <DialogDescription>
            課題の情報を編集します。変更を保存するには「更新」をクリックしてください。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* 種類選択 */}
            <div className="grid gap-2">
              <Label htmlFor="taskType">
                種類 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.taskType}
                onValueChange={(value: TaskType) =>
                  setFormData({ ...formData, taskType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assignment">課題</SelectItem>
                  <SelectItem value="quiz">小テスト</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                placeholder={
                  formData.taskType === "quiz"
                    ? "例: 第3章 小テスト"
                    : "例: レポート: 微分積分の応用"
                }
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
                  <SelectItem value="none">科目なし</SelectItem>
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

            {/* ステータス */}
            <div className="grid gap-2">
              <Label htmlFor="status">ステータス</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_started">未着手</SelectItem>
                  <SelectItem value="in_progress">作業中</SelectItem>
                  <SelectItem value="completed">完了</SelectItem>
                </SelectContent>
              </Select>
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
              {isSubmitting ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
