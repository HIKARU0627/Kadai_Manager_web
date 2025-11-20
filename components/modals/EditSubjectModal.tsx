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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateSubject } from "@/app/actions/subjects"
import { getSemesters } from "@/app/actions/semesters"

interface EditSubjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: {
    id: string
    semesterId: string | null
    name: string
    type: string
    teacher: string | null
    classroom: string | null
    dayOfWeek: number | null
    period: number | null
    color: string
  } | null
}

const weekDays = [
  { value: 1, label: "月曜日" },
  { value: 2, label: "火曜日" },
  { value: 3, label: "水曜日" },
  { value: 4, label: "木曜日" },
  { value: 5, label: "金曜日" },
  { value: 6, label: "土曜日" },
  { value: 0, label: "日曜日" },
]

const periods = [
  { value: 1, label: "1限" },
  { value: 2, label: "2限" },
  { value: 3, label: "3限" },
  { value: 4, label: "4限" },
  { value: 5, label: "5限" },
  { value: 6, label: "6限" },
  { value: 7, label: "7限" },
]

const predefinedColors = [
  { value: "#3B82F6", label: "青" },
  { value: "#10B981", label: "緑" },
  { value: "#8B5CF6", label: "紫" },
  { value: "#EC4899", label: "ピンク" },
  { value: "#6366F1", label: "インディゴ" },
  { value: "#F59E0B", label: "オレンジ" },
  { value: "#EF4444", label: "赤" },
  { value: "#14B8A6", label: "ティール" },
]

export function EditSubjectModal({
  open,
  onOpenChange,
  subject,
}: EditSubjectModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [semesters, setSemesters] = useState<any[]>([])

  const [formData, setFormData] = useState({
    semesterId: "none",
    name: "",
    type: "regular",
    teacher: "",
    classroom: "",
    dayOfWeek: "",
    period: "",
    color: "#3B82F6",
  })

  // 学期一覧を読み込み
  useEffect(() => {
    if (open) {
      loadSemesters()
    }
  }, [open])

  // 学期更新イベントをリッスン
  useEffect(() => {
    const handleSemesterUpdate = () => {
      if (open) {
        loadSemesters()
      }
    }

    window.addEventListener('semesterUpdated', handleSemesterUpdate)
    return () => window.removeEventListener('semesterUpdated', handleSemesterUpdate)
  }, [open])

  const loadSemesters = async () => {
    try {
      const data = await getSemesters()
      setSemesters(data)
    } catch (error) {
      console.error('Failed to load semesters:', error)
    }
  }

  // subject が変更されたときにフォームデータを更新
  useEffect(() => {
    if (subject) {
      setFormData({
        semesterId: subject.semesterId || "none",
        name: subject.name,
        type: subject.type || "regular",
        teacher: subject.teacher || "",
        classroom: subject.classroom || "",
        dayOfWeek: subject.dayOfWeek !== null ? String(subject.dayOfWeek) : "",
        period: subject.period !== null ? String(subject.period) : "",
        color: subject.color,
      })
    }
  }, [subject])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject) return

    setError(null)
    setIsSubmitting(true)

    try {
      // Validation
      if (!formData.name.trim()) {
        setError("科目名を入力してください")
        setIsSubmitting(false)
        return
      }

      // 通常授業の場合は曜日と時限が必須
      if (formData.type === "regular") {
        if (!formData.dayOfWeek) {
          setError("通常授業の場合は曜日を選択してください")
          setIsSubmitting(false)
          return
        }

        if (!formData.period) {
          setError("通常授業の場合は時限を選択してください")
          setIsSubmitting(false)
          return
        }
      }

      const result = await updateSubject({
        id: subject.id,
        semesterId: formData.semesterId !== "none" ? formData.semesterId : undefined,
        name: formData.name,
        type: formData.type,
        teacher: formData.teacher || undefined,
        classroom: formData.classroom || undefined,
        dayOfWeek: formData.dayOfWeek ? parseInt(formData.dayOfWeek) : null,
        period: formData.period ? parseInt(formData.period) : null,
        color: formData.color,
      })

      if (result.success) {
        onOpenChange(false)
      } else {
        setError(result.error || "科目の更新に失敗しました")
      }
    } catch (err) {
      setError("エラーが発生しました")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!subject) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>科目を編集</DialogTitle>
          <DialogDescription>
            科目の情報を編集します。変更を保存するには「更新」をクリックしてください。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* 学期選択 */}
            <div className="grid gap-2">
              <Label htmlFor="semester">学期</Label>
              <Select
                value={formData.semesterId}
                onValueChange={(value) =>
                  setFormData({ ...formData, semesterId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="学期を選択（任意）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">学期なし</SelectItem>
                  {semesters.map((semester: any) => (
                    <SelectItem key={semester.id} value={semester.id}>
                      {semester.year}年度 {semester.name}
                      {semester.isActive && " (現在)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 科目名 */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                科目名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="例: 数学I"
                required
              />
            </div>

            {/* 授業タイプ */}
            <div className="grid gap-2">
              <Label htmlFor="type">授業タイプ</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value, dayOfWeek: "", period: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">通常授業</SelectItem>
                  <SelectItem value="intensive">集中講義</SelectItem>
                  <SelectItem value="on_demand">オンデマンド</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 曜日と時限（通常授業の場合のみ） */}
            {formData.type === "regular" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dayOfWeek">
                    曜日 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.dayOfWeek}
                    onValueChange={(value) =>
                      setFormData({ ...formData, dayOfWeek: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="曜日を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {weekDays.map((day) => (
                        <SelectItem key={day.value} value={String(day.value)}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="period">
                    時限 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.period}
                    onValueChange={(value) =>
                      setFormData({ ...formData, period: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="時限を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((period) => (
                        <SelectItem key={period.value} value={String(period.value)}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* 担当教員 */}
            <div className="grid gap-2">
              <Label htmlFor="teacher">担当教員</Label>
              <Input
                id="teacher"
                value={formData.teacher}
                onChange={(e) =>
                  setFormData({ ...formData, teacher: e.target.value })
                }
                placeholder="例: 佐藤先生"
              />
            </div>

            {/* 教室 */}
            <div className="grid gap-2">
              <Label htmlFor="classroom">教室</Label>
              <Input
                id="classroom"
                value={formData.classroom}
                onChange={(e) =>
                  setFormData({ ...formData, classroom: e.target.value })
                }
                placeholder="例: A棟301"
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
