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
import { updateEvent } from "@/app/actions/events"

interface EditEventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: {
    id: string
    title: string
    description: string | null
    startDatetime: Date
    endDatetime: Date
    location: string | null
    color: string
  } | null
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

export function EditEventModal({
  open,
  onOpenChange,
  event,
}: EditEventModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDatetime: "",
    endDatetime: "",
    location: "",
    color: "#10B981",
  })

  // event が変更されたときにフォームデータを更新
  useEffect(() => {
    if (event) {
      // datetime-local形式に変換
      const formatDateTime = (date: Date) => {
        const d = new Date(date)
        const year = d.getFullYear()
        const month = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const hours = String(d.getHours()).padStart(2, '0')
        const minutes = String(d.getMinutes()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}`
      }

      setFormData({
        title: event.title,
        description: event.description || "",
        startDatetime: formatDateTime(event.startDatetime),
        endDatetime: formatDateTime(event.endDatetime),
        location: event.location || "",
        color: event.color,
      })
    }
  }, [event])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event) return

    setError(null)
    setIsSubmitting(true)

    try {
      // Validation
      if (!formData.title.trim()) {
        setError("タイトルを入力してください")
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

      const result = await updateEvent({
        id: event.id,
        title: formData.title,
        description: formData.description || undefined,
        startDatetime: startDate,
        endDatetime: endDate,
        location: formData.location || undefined,
        color: formData.color,
      })

      if (result.success) {
        onOpenChange(false)
      } else {
        setError(result.error || "予定の更新に失敗しました")
      }
    } catch (err) {
      setError("エラーが発生しました")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!event) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>予定を編集</DialogTitle>
          <DialogDescription>
            予定の情報を編集します。変更を保存するには「更新」をクリックしてください。
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
                placeholder="例: 歯医者の予約"
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
              {isSubmitting ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
