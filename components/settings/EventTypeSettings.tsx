"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, Plus, Trash2, Calendar as CalendarIcon, Info } from "lucide-react"
import {
  getUserEventTypes,
  createEventType,
  updateEventType,
  deleteEventType,
  type EventTypeConfig,
} from "@/app/actions/eventTypes"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"

export function EventTypeSettings() {
  const [eventTypes, setEventTypes] = useState<EventTypeConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // 新規作成フォーム
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState("#3B82F6")
  const [newRequiresSubject, setNewRequiresSubject] = useState(false)
  const [creating, setCreating] = useState(false)

  // 削除確認ダイアログ
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [typeToDelete, setTypeToDelete] = useState<EventTypeConfig | null>(null)

  useEffect(() => {
    loadEventTypes()
  }, [])

  const loadEventTypes = async () => {
    try {
      setLoading(true)
      const types = await getUserEventTypes()
      setEventTypes(types)
    } catch (err) {
      setError("イベントタイプの読み込みに失敗しました")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!newName.trim()) {
      setError("名前を入力してください")
      return
    }

    setCreating(true)

    try {
      const result = await createEventType({
        name: newName.trim(),
        color: newColor,
        requiresSubject: newRequiresSubject,
      })

      if (result.success && result.eventType) {
        setEventTypes([...eventTypes, result.eventType])
        setNewName("")
        setNewColor("#3B82F6")
        setNewRequiresSubject(false)
        setSuccess("イベントタイプを追加しました")
      } else {
        setError(result.error || "追加に失敗しました")
      }
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!typeToDelete) return

    setError(null)
    setSuccess(null)

    try {
      const result = await deleteEventType(typeToDelete.id)

      if (result.success) {
        setEventTypes(eventTypes.filter((t) => t.id !== typeToDelete.id))
        setSuccess("イベントタイプを削除しました")
      } else {
        setError(result.error || "削除に失敗しました")
      }
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setDeleteDialogOpen(false)
      setTypeToDelete(null)
    }
  }

  const openDeleteDialog = (type: EventTypeConfig) => {
    setTypeToDelete(type)
    setDeleteDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Info Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
        <Info className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">予定の種類をカスタマイズ</p>
          <p className="text-blue-700">
            カレンダーに表示する予定の種類を追加・編集できます。「予定」と「テスト」はデフォルト項目のため削除できません。
          </p>
        </div>
      </div>

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

      {/* 既存のイベントタイプ一覧 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-blue-600" />
          登録済みの予定タイプ
        </h3>
        <div className="space-y-2">
          {eventTypes.map((type) => (
            <div
              key={type.id}
              className="flex items-center justify-between p-4 border-2 rounded-lg hover:border-blue-300 transition-colors bg-white"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: type.color }}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{type.name}</span>
                    {type.isDefault && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        デフォルト
                      </span>
                    )}
                    {type.requiresSubject && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        科目必須
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{type.color}</span>
                </div>
              </div>
              {!type.isDefault && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDeleteDialog(type)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  削除
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 新規追加フォーム */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Plus className="w-5 h-5 mr-2 text-green-600" />
          新しい予定タイプを追加
        </h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="newName" className="text-base font-medium">
                名前 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="newName"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="例: 部活動、アルバイト"
                required
                disabled={creating}
                className="h-12 text-base border-2 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newColor" className="text-base font-medium">
                色 <span className="text-red-500">*</span>
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="newColor"
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  disabled={creating}
                  className="h-12 w-20 cursor-pointer"
                />
                <Input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  placeholder="#3B82F6"
                  disabled={creating}
                  className="h-12 text-base border-2 focus:border-blue-500 flex-1"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="newRequiresSubject"
              checked={newRequiresSubject}
              onCheckedChange={(checked) => setNewRequiresSubject(checked === true)}
              disabled={creating}
            />
            <Label
              htmlFor="newRequiresSubject"
              className="text-sm font-normal cursor-pointer"
            >
              このタイプの予定を作成する際に科目を必須にする
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
            disabled={creating}
          >
            <Plus className="w-5 h-5 mr-2" />
            {creating ? "追加中..." : "予定タイプを追加"}
          </Button>
        </form>
      </div>

      {/* 削除確認ダイアログ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>予定タイプを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{typeToDelete?.name}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
