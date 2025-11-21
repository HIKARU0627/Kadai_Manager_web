"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  getEventTypes,
  createEventType,
  updateEventType,
  deleteEventType,
  EventType,
} from "@/app/actions/eventTypes"
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  AlertCircle,
  CheckCircle2,
  GripVertical,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface EventTypeSettingsProps {
  userId: string
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

export function EventTypeSettings({ userId }: EventTypeSettingsProps) {
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 追加フォーム
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState({ name: "", value: "", color: "#10B981" })
  const [addLoading, setAddLoading] = useState(false)

  // 編集状態
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: "", value: "", color: "" })

  // 削除確認ダイアログ
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // イベントタイプ一覧を読み込み
  const loadEventTypes = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await getEventTypes(userId)
      if (result.success && result.data) {
        setEventTypes(result.data)
      } else {
        setError(result.error || "イベントタイプの読み込みに失敗しました")
      }
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEventTypes()
  }, [userId])

  // 追加処理
  const handleAdd = async () => {
    if (!addForm.name.trim() || !addForm.value.trim()) {
      setError("名前と値を入力してください")
      return
    }

    setAddLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await createEventType({
        userId,
        name: addForm.name.trim(),
        value: addForm.value.trim(),
        color: addForm.color,
      })

      if (result.success) {
        setSuccess("イベントタイプを追加しました")
        setAddForm({ name: "", value: "", color: "#10B981" })
        setShowAddForm(false)
        await loadEventTypes()
      } else {
        setError(result.error || "追加に失敗しました")
      }
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setAddLoading(false)
    }
  }

  // 編集開始
  const startEdit = (eventType: EventType) => {
    setEditingId(eventType.id)
    setEditForm({
      name: eventType.name,
      value: eventType.value,
      color: eventType.color,
    })
    setError(null)
    setSuccess(null)
  }

  // 編集キャンセル
  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({ name: "", value: "", color: "" })
  }

  // 編集保存
  const saveEdit = async (id: string) => {
    if (!editForm.name.trim() || !editForm.value.trim()) {
      setError("名前と値を入力してください")
      return
    }

    setError(null)
    setSuccess(null)

    try {
      const result = await updateEventType({
        id,
        name: editForm.name.trim(),
        value: editForm.value.trim(),
        color: editForm.color,
      })

      if (result.success) {
        setSuccess("イベントタイプを更新しました")
        setEditingId(null)
        await loadEventTypes()
      } else {
        setError(result.error || "更新に失敗しました")
      }
    } catch (err) {
      setError("エラーが発生しました")
    }
  }

  // 削除処理
  const handleDelete = async (id: string) => {
    setDeleteLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await deleteEventType(id)

      if (result.success) {
        setSuccess("イベントタイプを削除しました")
        setDeleteConfirmId(null)
        await loadEventTypes()
      } else {
        setError(result.error || "削除に失敗しました")
      }
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="pt-6">
          <p className="text-center text-gray-500">読み込み中...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center text-xl">
          <Calendar className="w-6 h-6 mr-2" />
          カレンダーイベントタイプ
        </CardTitle>
        <CardDescription className="text-purple-100">
          カレンダーで使用するイベントの種類をカスタマイズできます
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* エラー・成功メッセージ */}
        {error && (
          <div className="flex items-center text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center text-sm text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
            <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
            {success}
          </div>
        )}

        {/* イベントタイプ一覧 */}
        <div className="space-y-2">
          {eventTypes.map((eventType) => (
            <div
              key={eventType.id}
              className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
            >
              <GripVertical className="w-5 h-5 text-gray-400" />

              {editingId === eventType.id ? (
                // 編集モード
                <>
                  <div className="flex-1 grid grid-cols-3 gap-3">
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      placeholder="表示名"
                      className="h-9"
                    />
                    <Input
                      value={editForm.value}
                      onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                      placeholder="内部値"
                      className="h-9"
                      disabled={eventType.isDefault}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={editForm.color}
                        onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                        className="w-10 h-9 rounded border border-gray-300"
                      />
                      <span className="text-sm text-gray-600">{editForm.color}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => saveEdit(eventType.id)}
                      className="h-9"
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                      className="h-9"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              ) : (
                // 表示モード
                <>
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: eventType.color }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{eventType.name}</div>
                    <div className="text-sm text-gray-500">値: {eventType.value}</div>
                  </div>
                  {eventType.isDefault && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      デフォルト
                    </span>
                  )}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(eventType)}
                      className="h-9"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleteConfirmId(eventType.id)}
                      disabled={eventType.isDefault}
                      className="h-9"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* 追加フォーム */}
        {showAddForm ? (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
            <h4 className="font-medium text-blue-900">新しいイベントタイプを追加</h4>
            <div className="grid gap-3">
              <div>
                <Label htmlFor="add-name" className="text-sm">
                  表示名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-name"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="例: 会議"
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="add-value" className="text-sm">
                  内部値 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="add-value"
                  value={addForm.value}
                  onChange={(e) => setAddForm({ ...addForm, value: e.target.value })}
                  placeholder="例: meeting (英数字・ハイフン・アンダースコアのみ)"
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="add-color" className="text-sm">カラー</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="add-color"
                    value={addForm.color}
                    onChange={(e) => setAddForm({ ...addForm, color: e.target.value })}
                    className="w-10 h-9 rounded border border-gray-300"
                  />
                  <span className="text-sm text-gray-600">{addForm.color}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAdd}
                disabled={addLoading}
                className="flex-1"
              >
                {addLoading ? "追加中..." : "追加"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false)
                  setAddForm({ name: "", value: "", color: "#10B981" })
                }}
                disabled={addLoading}
              >
                キャンセル
              </Button>
            </div>
          </div>
        ) : (
          <Button
            onClick={() => setShowAddForm(true)}
            className="w-full"
            variant="outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            新しいイベントタイプを追加
          </Button>
        )}

        {/* 注意事項 */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            注意事項
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
            <li>「予定」と「テスト」はデフォルトタイプのため削除できません</li>
            <li>イベントタイプを削除する前に、そのタイプを使用している予定のタイプを変更してください</li>
            <li>内部値は他のシステムとの連携に使用される場合があるため、慎重に設定してください</li>
          </ul>
        </div>
      </CardContent>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>イベントタイプを削除</DialogTitle>
            <DialogDescription>
              本当にこのイベントタイプを削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              disabled={deleteLoading}
            >
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleteLoading}
            >
              {deleteLoading ? "削除中..." : "削除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
