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
import { Upload, Trash2 } from "lucide-react"

interface FileUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  subjectId: string
}

export function FileUploadModal({
  open,
  onOpenChange,
  userId,
  subjectId,
}: FileUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const invalidFiles = newFiles.filter((file) => file.size > 10 * 1024 * 1024)

      if (invalidFiles.length > 0) {
        setUploadError("ファイルサイズは10MB以下にしてください")
        return
      }

      setSelectedFiles((prev) => [...prev, ...newFiles])
      setUploadError(null)
    }
  }

  const handleFileRemove = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return

    setIsUploading(true)
    setUploadError(null)

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const formData = new FormData()
        formData.append("file", file)
        formData.append("subjectId", subjectId)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json()
          throw new Error(errorData.error || "ファイルのアップロードに失敗しました")
        }

        const uploadData = await uploadResponse.json()

        if (!uploadData.success) {
          throw new Error(uploadData.error || "ファイルの保存に失敗しました")
        }

        setUploadProgress(((i + 1) / selectedFiles.length) * 100)
      }

      // 成功したらモーダルを閉じる
      setSelectedFiles([])
      setUploadProgress(0)
      onOpenChange(false)
    } catch (error) {
      console.error("Upload error:", error)
      setUploadError(error instanceof Error ? error.message : "ファイルのアップロードに失敗しました")
    } finally {
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFiles([])
      setUploadError(null)
      setUploadProgress(0)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>ファイルをアップロード</DialogTitle>
          <DialogDescription>
            この授業に関連するファイルをアップロードします（最大10MB）
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* ファイル選択 */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">ファイルを選択</Label>
            <Input
              id="file-upload"
              type="file"
              multiple
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>

          {/* 選択されたファイル一覧 */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <Label>選択されたファイル ({selectedFiles.length})</Label>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleFileRemove(index)}
                      disabled={isUploading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* アップロード進捗 */}
          {isUploading && uploadProgress > 0 && (
            <div className="space-y-2">
              <Label>アップロード中...</Label>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* エラーメッセージ */}
          {uploadError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {uploadError}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleFileUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            {isUploading ? "アップロード中..." : "アップロード"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
