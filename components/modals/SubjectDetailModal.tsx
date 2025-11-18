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
import { FilePreviewDialog } from "@/components/ui/file-preview-dialog"
import { getSubjectFiles, deleteFile } from "@/app/actions/files"
import { FileIcon, Download, Trash2, Upload, Eye, User, MapPin, Calendar, Clock } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

interface SubjectDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: {
    id: string
    name: string
    teacher: string | null
    classroom: string | null
    dayOfWeek: number
    period: number
    startTime: string | null
    endTime: string | null
    color: string
  } | null
  userId: string
}

interface FileItem {
  id: string
  fileName: string
  fileUrl: string | null
  fileType: string | null
  fileSize: number | null
  createdAt: Date
}

const weekDays = ["日", "月", "火", "水", "木", "金", "土"]

export function SubjectDetailModal({
  open,
  onOpenChange,
  subject,
  userId,
}: SubjectDetailModalProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  useEffect(() => {
    const fetchFiles = async () => {
      if (subject && open) {
        setIsLoading(true)
        const result = await getSubjectFiles(subject.id)
        if (result.success) {
          setFiles(result.data as FileItem[])
        }
        setIsLoading(false)
      }
    }

    fetchFiles()
  }, [subject, open])

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
      setUploadSuccess(null)
    }
  }

  const handleFileRemove = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFileUpload = async () => {
    if (!subject || selectedFiles.length === 0) return

    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i]
        const formData = new FormData()
        formData.append("file", file)
        formData.append("subjectId", subject.id)

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

      // ファイル一覧を再取得
      const result = await getSubjectFiles(subject.id)
      if (result.success) {
        setFiles(result.data as FileItem[])
        setUploadSuccess(`${selectedFiles.length}個のファイルをアップロードしました`)
      }

      setSelectedFiles([])
      setUploadProgress(0)
    } catch (error) {
      console.error("Upload error:", error)
      setUploadError(error instanceof Error ? error.message : "ファイルのアップロードに失敗しました")
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileDelete = async (fileId: string) => {
    if (!confirm("このファイルを削除しますか？")) return

    setIsDeleting(fileId)
    const result = await deleteFile(fileId)

    if (result.success) {
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
    } else {
      alert(result.error || "ファイルの削除に失敗しました")
    }

    setIsDeleting(null)
  }

  const handleFileDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = fileName
    link.click()
  }

  const handleFilePreview = (file: FileItem) => {
    setPreviewFile(file)
    setIsPreviewOpen(true)
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "不明"
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const isPreviewable = (fileType: string | null) => {
    if (!fileType) return false
    return (
      fileType.startsWith("image/") ||
      fileType === "application/pdf"
    )
  }

  if (!subject) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl" style={{ color: subject.color }}>
              {subject.name}
            </DialogTitle>
            <DialogDescription>科目の詳細とファイル管理</DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* 科目情報 */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center text-sm">
                <Calendar className="w-4 h-4 mr-2 text-gray-600" />
                <span className="text-gray-600">曜日:</span>
                <span className="ml-2 font-medium">{weekDays[subject.dayOfWeek]}曜日</span>
              </div>
              <div className="flex items-center text-sm">
                <Clock className="w-4 h-4 mr-2 text-gray-600" />
                <span className="text-gray-600">時限:</span>
                <span className="ml-2 font-medium">{subject.period}限</span>
              </div>
              {(subject.startTime || subject.endTime) && (
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-gray-600">時間:</span>
                  <span className="ml-2 font-medium">
                    {subject.startTime || "--:--"} - {subject.endTime || "--:--"}
                  </span>
                </div>
              )}
              {subject.teacher && (
                <div className="flex items-center text-sm">
                  <User className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-gray-600">担当:</span>
                  <span className="ml-2 font-medium">{subject.teacher}</span>
                </div>
              )}
              {subject.classroom && (
                <div className="flex items-center text-sm">
                  <MapPin className="w-4 h-4 mr-2 text-gray-600" />
                  <span className="text-gray-600">教室:</span>
                  <span className="ml-2 font-medium">{subject.classroom}</span>
                </div>
              )}
            </div>

            {/* ファイルアップロード */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">ファイルを追加</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="flex-1"
                  disabled={isUploading}
                />
                <Button
                  onClick={handleFileUpload}
                  disabled={selectedFiles.length === 0 || isUploading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "アップロード中..." : "アップロード"}
                </Button>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <span className="text-xs text-gray-500 mx-2">
                        {formatFileSize(file.size)}
                      </span>
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
              )}

              {isUploading && uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              {uploadError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {uploadError}
                </div>
              )}

              {uploadSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                  {uploadSuccess}
                </div>
              )}
            </div>

            {/* ファイル一覧 */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                添付ファイル ({files.length})
              </Label>

              {isLoading ? (
                <div className="text-center py-8 text-gray-500">
                  読み込み中...
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                  ファイルがありません
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <FileIcon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {file.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.fileSize)} •{" "}
                            {format(new Date(file.createdAt), "yyyy/MM/dd HH:mm", {
                              locale: ja,
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 ml-2">
                        {isPreviewable(file.fileType) && file.fileUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFilePreview(file)}
                            title="プレビュー"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        {file.fileUrl && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              handleFileDownload(file.fileUrl!, file.fileName)
                            }
                            title="ダウンロード"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleFileDelete(file.id)}
                          disabled={isDeleting === file.id}
                          title="削除"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ファイルプレビューダイアログ */}
      <FilePreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        file={previewFile}
      />
    </>
  )
}
