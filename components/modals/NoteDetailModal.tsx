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
import { Badge } from "@/components/ui/badge"
import { FilePreviewDialog } from "@/components/ui/file-preview-dialog"
import { getNoteFiles, deleteFile } from "@/app/actions/files"
import { FileIcon, Download, Trash2, Calendar, Eye } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

interface NoteDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  note: {
    id: string
    title: string | null
    content: string
    noteType: string
    quizDate: Date | null
    createdAt: Date
    subject: {
      id: string
      name: string
      color: string
    }
  } | null
}

interface FileItem {
  id: string
  fileName: string
  fileUrl: string | null
  fileType: string | null
  fileSize: number | null
  createdAt: Date
}

export function NoteDetailModal({
  open,
  onOpenChange,
  note,
}: NoteDetailModalProps) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  useEffect(() => {
    const fetchFiles = async () => {
      if (note && open) {
        setIsLoading(true)
        const result = await getNoteFiles(note.id)
        if (result.success) {
          setFiles(result.data as FileItem[])
        }
        setIsLoading(false)
      }
    }

    fetchFiles()
  }, [note, open])

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

  const getNoteTypeLabel = (type: string) => {
    switch (type) {
      case "general":
        return "一般"
      case "quiz":
        return "小テスト"
      case "announcement":
        return "お知らせ"
      default:
        return type
    }
  }

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case "quiz":
        return "bg-red-100 text-red-700"
      case "announcement":
        return "bg-blue-100 text-blue-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  if (!note) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{note.title || "無題"}</DialogTitle>
          <DialogDescription>メモの詳細情報</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* バッジ */}
          <div className="flex flex-wrap gap-2">
            <Badge
              style={{
                backgroundColor: `${note.subject.color}20`,
                color: note.subject.color,
              }}
            >
              {note.subject.name}
            </Badge>
            <Badge className={getNoteTypeColor(note.noteType)}>
              {getNoteTypeLabel(note.noteType)}
            </Badge>
          </div>

          {/* 小テスト日程 */}
          {note.quizDate && (
            <div className="flex items-center text-sm text-red-600 bg-red-50 p-3 rounded-md">
              <Calendar className="w-4 h-4 mr-2" />
              <span>
                小テスト日程:{" "}
                {format(new Date(note.quizDate), "yyyy年MM月dd日（E）", {
                  locale: ja,
                })}
              </span>
            </div>
          )}

          {/* 内容 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">内容</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{note.content}</p>
          </div>

          {/* 作成日 */}
          <div className="text-xs text-gray-500">
            作成日: {format(new Date(note.createdAt), "yyyy/MM/dd HH:mm", { locale: ja })}
          </div>

          {/* 添付ファイル */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              添付ファイル ({files.length}件)
            </h3>
            {isLoading ? (
              <p className="text-sm text-gray-500">読み込み中...</p>
            ) : files.length > 0 ? (
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <FileIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {file.fileName}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{formatFileSize(file.fileSize)}</span>
                          <span>•</span>
                          <span>
                            {format(new Date(file.createdAt), "yyyy/MM/dd", { locale: ja })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {file.fileUrl && (file.fileType?.startsWith("image/") || file.fileType === "application/pdf") && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFilePreview(file)}
                          className="h-8 w-8 text-gray-400 hover:text-purple-600"
                          title="プレビュー"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      {file.fileUrl && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleFileDownload(file.fileUrl!, file.fileName)}
                          className="h-8 w-8 text-gray-400 hover:text-blue-600"
                          title="ダウンロード"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleFileDelete(file.id)}
                        disabled={isDeleting === file.id}
                        className="h-8 w-8 text-gray-400 hover:text-red-600"
                        title="削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">添付ファイルはありません</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* ファイルプレビュー */}
      {previewFile && (
        <FilePreviewDialog
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          file={{
            fileName: previewFile.fileName,
            fileUrl: previewFile.fileUrl || "",
            fileType: previewFile.fileType,
          }}
        />
      )}
    </Dialog>
  )
}
