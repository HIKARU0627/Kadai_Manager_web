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
import { Upload, X, FileIcon } from "lucide-react"

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<string>("")

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    subjectId: "none",
    dueDate: "",
    priority: "0",
  })

  // ファイル選択ハンドラー
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      // 10MB制限チェック
      const invalidFiles = newFiles.filter(file => file.size > 10 * 1024 * 1024)
      if (invalidFiles.length > 0) {
        setError("ファイルサイズは10MB以下にしてください")
        return
      }
      setSelectedFiles(prev => [...prev, ...newFiles])
      setError(null)
    }
  }

  // ファイル削除ハンドラー
  const handleFileRemove = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  // ファイルサイズをフォーマット
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

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
        subjectId: formData.subjectId === "none" ? undefined : formData.subjectId,
        dueDate: new Date(formData.dueDate),
        priority: parseInt(formData.priority),
      })

      if (result.success && result.data) {
        const taskId = result.data.id

        // ファイルをアップロード
        if (selectedFiles.length > 0) {
          setUploadProgress(`ファイルをアップロード中... (0/${selectedFiles.length})`)

          for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i]
            const fileFormData = new FormData()
            fileFormData.append("file", file)
            fileFormData.append("taskId", taskId)

            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: fileFormData,
            })

            if (!uploadResponse.ok) {
              console.error(`Failed to upload file: ${file.name}`)
            }

            setUploadProgress(
              `ファイルをアップロード中... (${i + 1}/${selectedFiles.length})`
            )
          }
        }

        // Reset form
        setFormData({
          title: "",
          description: "",
          subjectId: "none",
          dueDate: "",
          priority: "0",
        })
        setSelectedFiles([])
        setUploadProgress("")
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

            {/* ファイル添付 */}
            <div className="grid gap-2">
              <Label htmlFor="files">ファイル添付</Label>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="files"
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById("files")?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    ファイルを選択
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  最大10MBまでのファイルをアップロードできます
                </p>

                {/* 選択されたファイルのリスト */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <FileIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm truncate">{file.name}</span>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            ({formatFileSize(file.size)})
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFileRemove(index)}
                          className="h-6 w-6 text-gray-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* アップロード進捗 */}
            {uploadProgress && (
              <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-md">
                {uploadProgress}
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
              {isSubmitting ? "作成中..." : "課題を作成"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
