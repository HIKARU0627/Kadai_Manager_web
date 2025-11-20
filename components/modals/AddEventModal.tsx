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
import { createEvent, EventType } from "@/app/actions/events"

interface AddEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  initialDate?: Date
  subjects?: Array<{ id: string; name: string; color: string }>
  defaultSubjectId?: string | null
  defaultEventType?: EventType
}

const predefinedColors = [
  { value: "#10B981", label: "緑" },
  { value: "#3B82F6", label: "青" },
  { value: "#8B5CF6", label: "紫" },
  { value: "#EC4899", label: "ピンク" },
  { value: "#F59E0B", label: "オレンジ" },
  { value: "#EF4444", label: "赤" },
  { value: "#14B8A6", label: "ティール" },
  { value: "#6366F1", label: "インディゴ" },
]

export function AddEventModal({
  open,
  onOpenChange,
  userId,
  initialDate,
  subjects = [],
  defaultSubjectId = null,
  defaultEventType = "event",
}: AddEventModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    eventType: defaultEventType as EventType,
    subjectId: defaultSubjectId || "",
    title: "",
    description: "",
    startDatetime: "",
    endDatetime: "",
    location: "",
    color: "#10B981",
  })

  // initialDate または defaultsが変更されたら、フォームを初期化
  useEffect(() => {
    if (open) {
      let startDatetime = ""
      let endDatetime = ""

      if (initialDate) {
        const year = initialDate.getFullYear()
        const month = String(initialDate.getMonth() + 1).padStart(2, '0')
        const day = String(initialDate.getDate()).padStart(2, '0')

        // 開始時刻を9:00に設定
        startDatetime = `${year}-${month}-${day}T09:00`
        // 終了時刻を10:00に設定
        endDatetime = `${year}-${month}-${day}T10:00`
      }

      setFormData({
        eventType: defaultEventType as EventType,
        subjectId: defaultSubjectId || "",
        title: "",
        description: "",
        startDatetime,
        endDatetime,
        location: "",
        color: "#10B981",
      })
    }
  }, [initialDate, open, defaultEventType, defaultSubjectId])

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

      // テストの場合は科目が必須
      if (formData.eventType === "test" && !formData.subjectId) {
        setError("テストの場合は科目を選択してください")
        setIsSubmitting(false)
        return
      }

      if (!formData.startDatetime) {
        setError("開始日時を設定してください")
        setIsSubmitting(false)
        return
      }

      if (!formData.endDatetime) {
        setError("終了日時を設定してください")
        setIsSubmitting(false)
        return
      }

      const startDate = new Date(formData.startDatetime)
      const endDate = new Date(formData.endDatetime)

      if (endDate <= startDate) {
        setError("終了日時は開始日時より後に設定してください")
        setIsSubmitting(false)
        return
      }

      const result = await createEvent({
        userId,
        title: formData.title,
        description: formData.description || undefined,
        eventType: formData.eventType,
        subjectId: formData.subjectId || undefined,
        startDatetime: startDate,
        endDatetime: endDate,
        location: formData.location || undefined,
        color: formData.color,
      })

      if (result.success) {
        // Reset form
        setFormData({
          eventType: "event",
          subjectId: "",
          title: "",
          description: "",
          startDatetime: "",
          endDatetime: "",
          location: "",
          color: "#10B981",
        })
        onOpenChange(false)
      } else {
        setError(result.error || "予定の作成に失敗しました")
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
          <DialogTitle>
            {formData.eventType === "test" ? "テストを追加" : "予定を追加"}
          </DialogTitle>
          <DialogDescription>
            {formData.eventType === "test"
              ? "テストの日程を登録します。すべての項目は後から編集できます。"
              : "個人的な予定を登録します。すべての項目は後から編集できます。"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* イベントタイプ選択 */}
            <div className="grid gap-2">
              <Label htmlFor="eventType">
                種類 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.eventType}
                onValueChange={(value: EventType) =>
                  setFormData({ ...formData, eventType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="event">予定</SelectItem>
                  <SelectItem value="test">テスト</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 科目選択 (テストの場合のみ表示) */}
            {formData.eventType === "test" && (
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
            )}

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
                  formData.eventType === "test"
                    ? "例: 中間テスト"
                    : "例: 歯医者の予約"
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
                placeholder="予定の詳細を入力してください"
                rows={3}
              />
            </div>

            {/* 開始・終了日時 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDatetime">
                  開始日時 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startDatetime"
                  type="datetime-local"
                  value={formData.startDatetime}
                  onChange={(e) =>
                    setFormData({ ...formData, startDatetime: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDatetime">
                  終了日時 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="endDatetime"
                  type="datetime-local"
                  value={formData.endDatetime}
                  onChange={(e) =>
                    setFormData({ ...formData, endDatetime: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            {/* 場所 */}
            <div className="grid gap-2">
              <Label htmlFor="location">場所</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="例: 中央歯科クリニック"
              />
            </div>

            {/* カラー選択 */}
            <div className="grid gap-2">
              <Label htmlFor="color">カラー</Label>
              <Select
                value={formData.color}
                onValueChange={(value) =>
                  setFormData({ ...formData, color: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {predefinedColors.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded mr-2"
                          style={{ backgroundColor: color.value }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
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
              {isSubmitting ? "作成中..." : "予定を作成"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
