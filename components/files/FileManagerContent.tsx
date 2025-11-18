"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { FilePreviewDialog } from "@/components/ui/file-preview-dialog"
import { AIProcessDialog } from "@/components/ai/AIProcessDialog"
import { deleteFile } from "@/app/actions/files"
import {
  FileIcon,
  Download,
  Trash2,
  Eye,
  Search,
  Filter,
  Grid3x3,
  List,
  Upload,
  FolderOpen,
  HardDrive,
  FileType,
  CheckSquare,
  Calendar,
  StickyNote,
  BookOpen,
  ArrowUpDown,
  Sparkles,
} from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface FileItem {
  id: string
  fileName: string
  fileUrl: string | null
  fileType: string | null
  fileSize: number | null
  createdAt: Date | string
  taskId: string | null
  noteId: string | null
  subjectId: string | null
  task?: {
    id: string
    title: string
  } | null
  note?: {
    id: string
    title: string
  } | null
  subject?: {
    id: string
    name: string
  } | null
}

interface FileManagerContentProps {
  initialFiles: FileItem[]
  totalSize: number
  tasks: { id: string; title: string }[]
  notes: { id: string; title: string }[]
  subjects: { id: string; name: string }[]
  userId: string
}

type ViewMode = "list" | "grid"
type SortField = "createdAt" | "fileName" | "fileSize"
type SortOrder = "asc" | "desc"

export function FileManagerContent({
  initialFiles,
  totalSize,
  tasks,
  notes,
  subjects,
  userId,
}: FileManagerContentProps) {
  const [files, setFiles] = useState<FileItem[]>(initialFiles)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterResource, setFilterResource] = useState<string>("all")
  const [filterSubjectId, setFilterSubjectId] = useState<string>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [groupBySubject, setGroupBySubject] = useState(false)
  const [aiProcessFile, setAiProcessFile] = useState<{ id: string; name: string } | null>(null)
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false)

  // ファイルのフィルタリングとソート
  const filteredAndSortedFiles = useMemo(() => {
    let result = [...files]

    // 検索フィルター
    if (searchQuery) {
      result = result.filter((file) =>
        file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // タイプフィルター
    if (filterType !== "all") {
      result = result.filter((file) => {
        if (filterType === "image") return file.fileType?.startsWith("image/")
        if (filterType === "pdf") return file.fileType === "application/pdf"
        if (filterType === "other")
          return (
            !file.fileType?.startsWith("image/") &&
            file.fileType !== "application/pdf"
          )
        return true
      })
    }

    // リソースフィルター
    if (filterResource !== "all") {
      result = result.filter((file) => {
        if (filterResource === "task") return file.taskId !== null
        if (filterResource === "note") return file.noteId !== null
        if (filterResource === "subject") return file.subjectId !== null
        if (filterResource === "unrelated")
          return !file.taskId && !file.noteId && !file.subjectId
        return true
      })
    }

    // 科目フィルター
    if (filterSubjectId !== "all") {
      result = result.filter((file) => file.subjectId === filterSubjectId)
    }

    // ソート
    result.sort((a, b) => {
      let comparison = 0

      if (sortField === "createdAt") {
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      } else if (sortField === "fileName") {
        comparison = a.fileName.localeCompare(b.fileName)
      } else if (sortField === "fileSize") {
        comparison = (a.fileSize || 0) - (b.fileSize || 0)
      }

      return sortOrder === "asc" ? comparison : -comparison
    })

    return result
  }, [files, searchQuery, filterType, filterResource, filterSubjectId, sortField, sortOrder])

  // 科目別グループ化
  const groupedBySubject = useMemo(() => {
    if (!groupBySubject) return null

    const groups: { [key: string]: FileItem[] } = {}

    filteredAndSortedFiles.forEach((file) => {
      if (file.subjectId && file.subject) {
        const key = file.subjectId
        if (!groups[key]) {
          groups[key] = []
        }
        groups[key].push(file)
      } else {
        if (!groups["unrelated"]) {
          groups["unrelated"] = []
        }
        groups["unrelated"].push(file)
      }
    })

    return groups
  }, [filteredAndSortedFiles, groupBySubject])

  // ファイル統計
  const stats = useMemo(() => {
    const imageCount = files.filter((f) =>
      f.fileType?.startsWith("image/")
    ).length
    const pdfCount = files.filter((f) => f.fileType === "application/pdf").length
    const otherCount = files.length - imageCount - pdfCount

    return {
      total: files.length,
      image: imageCount,
      pdf: pdfCount,
      other: otherCount,
    }
  }, [files])

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "不明"
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const isPreviewable = (fileType: string | null) => {
    if (!fileType) return false
    return fileType.startsWith("image/") || fileType === "application/pdf"
  }

  const getRelatedResourceName = (file: FileItem) => {
    if (file.task) {
      return `課題: ${file.task.title}`
    }
    if (file.note) {
      return `メモ: ${file.note.title}`
    }
    if (file.subject) {
      return `科目: ${file.subject.name}`
    }
    return "未関連付け"
  }

  const getRelatedResourceIcon = (file: FileItem) => {
    if (file.taskId) return <CheckSquare className="w-4 h-4 text-red-500" />
    if (file.noteId) return <StickyNote className="w-4 h-4 text-yellow-500" />
    if (file.subjectId) return <BookOpen className="w-4 h-4 text-blue-500" />
    return <FolderOpen className="w-4 h-4 text-gray-400" />
  }

  const handleFileDelete = async (fileId: string) => {
    if (!confirm("このファイルを削除しますか？")) return

    setIsDeleting(fileId)
    const result = await deleteFile(fileId)

    if (result.success) {
      setFiles((prev) => prev.filter((f) => f.id !== fileId))
      setSelectedFiles((prev) => {
        const newSet = new Set(prev)
        newSet.delete(fileId)
        return newSet
      })
    } else {
      alert(result.error || "ファイルの削除に失敗しました")
    }

    setIsDeleting(null)
  }

  const handleBulkDelete = async () => {
    if (selectedFiles.size === 0) return
    if (
      !confirm(`選択した${selectedFiles.size}個のファイルを削除しますか？`)
    )
      return

    const deletePromises = Array.from(selectedFiles).map((fileId) =>
      deleteFile(fileId)
    )
    const results = await Promise.all(deletePromises)

    const successIds = results
      .map((result, index) =>
        result.success ? Array.from(selectedFiles)[index] : null
      )
      .filter((id): id is string => id !== null)

    setFiles((prev) => prev.filter((f) => !successIds.includes(f.id)))
    setSelectedFiles(new Set())

    const failedCount = results.filter((r) => !r.success).length
    if (failedCount > 0) {
      alert(`${failedCount}個のファイルの削除に失敗しました`)
    }
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

  const handleAiProcess = (file: FileItem) => {
    setAiProcessFile({ id: file.id, name: file.fileName })
    setIsAiDialogOpen(true)
  }

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedFiles.size === filteredAndSortedFiles.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(filteredAndSortedFiles.map((f) => f.id)))
    }
  }

  // ファイルアイテムのレンダリング（リスト表示）
  const renderFileListItem = (file: FileItem) => (
    <div
      key={file.id}
      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
    >
      <Checkbox
        checked={selectedFiles.has(file.id)}
        onCheckedChange={() => toggleFileSelection(file.id)}
      />

      <FileIcon className="w-6 h-6 text-blue-600 flex-shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.fileName}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-gray-500">
            {formatFileSize(file.fileSize)}
          </span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-500">
            {format(new Date(file.createdAt), "yyyy/MM/dd HH:mm", {
              locale: ja,
            })}
          </span>
          {!groupBySubject && (
            <>
              <span className="text-xs text-gray-400">•</span>
              <div className="flex items-center gap-1">
                {getRelatedResourceIcon(file)}
                <span className="text-xs text-gray-500">
                  {getRelatedResourceName(file)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleAiProcess(file)}
          title="AI機能"
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
        >
          <Sparkles className="w-4 h-4" />
        </Button>
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
            onClick={() => handleFileDownload(file.fileUrl!, file.fileName)}
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
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  // ファイルアイテムのレンダリング（グリッド表示）
  const renderFileGridItem = (file: FileItem) => (
    <div
      key={file.id}
      className="relative group border rounded-lg p-4 bg-white hover:shadow-md transition"
    >
      <div className="absolute top-2 left-2 z-10">
        <Checkbox
          checked={selectedFiles.has(file.id)}
          onCheckedChange={() => toggleFileSelection(file.id)}
          className="bg-white"
        />
      </div>

      <div className="flex flex-col items-center">
        {file.fileType?.startsWith("image/") && file.fileUrl ? (
          <div
            className="w-full h-32 bg-gray-100 rounded mb-3 cursor-pointer overflow-hidden"
            onClick={() => handleFilePreview(file)}
          >
            <img
              src={file.fileUrl}
              alt={file.fileName}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-32 bg-gray-100 rounded mb-3 flex items-center justify-center">
            <FileIcon className="w-12 h-12 text-gray-400" />
          </div>
        )}

        <p
          className="text-sm font-medium text-center truncate w-full mb-2"
          title={file.fileName}
        >
          {file.fileName}
        </p>

        {!groupBySubject && (
          <div className="flex items-center gap-1 mb-2">
            {getRelatedResourceIcon(file)}
          </div>
        )}

        <p className="text-xs text-gray-500 mb-3">
          {formatFileSize(file.fileSize)}
        </p>

        <div className="flex items-center gap-1 w-full">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleAiProcess(file)}
            className="flex-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            title="AI機能"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
          {isPreviewable(file.fileType) && file.fileUrl && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleFilePreview(file)}
              className="flex-1"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}
          {file.fileUrl && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleFileDownload(file.fileUrl!, file.fileName)}
              className="flex-1"
            >
              <Download className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleFileDelete(file.id)}
            disabled={isDeleting === file.id}
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">ファイル管理</h2>
          <p className="text-gray-600 mt-2">
            すべてのファイルを一元管理・検索できます
          </p>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">総ファイル数</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
                </div>
                <FileIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">合計サイズ</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatFileSize(totalSize)}
                  </p>
                </div>
                <HardDrive className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">画像</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.image}</p>
                </div>
                <FileType className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">PDF</p>
                  <p className="text-2xl font-bold text-gray-800">{stats.pdf}</p>
                </div>
                <FileType className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 検索・フィルター・表示切り替え */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* 検索 */}
                <div className="md:col-span-3">
                  <Label className="text-sm font-medium mb-2 block">検索</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="ファイル名で検索..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* タイプフィルター */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium mb-2 block">
                    ファイルタイプ
                  </Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="image">画像</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="other">その他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* リソースフィルター */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium mb-2 block">関連</Label>
                  <Select value={filterResource} onValueChange={setFilterResource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="task">課題</SelectItem>
                      <SelectItem value="note">メモ</SelectItem>
                      <SelectItem value="subject">科目</SelectItem>
                      <SelectItem value="unrelated">未関連付け</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 科目選択フィルター */}
                <div className="md:col-span-3">
                  <Label className="text-sm font-medium mb-2 block">授業で絞り込み</Label>
                  <Select value={filterSubjectId} onValueChange={setFilterSubjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="授業を選択..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべての授業</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 表示切り替え */}
                <div className="md:col-span-2">
                  <Label className="text-sm font-medium mb-2 block">表示</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="flex-1"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="flex-1"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* 第2行 */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* ソート */}
                <div className="md:col-span-3">
                  <Label className="text-sm font-medium mb-2 block">並び順</Label>
                  <Select
                    value={`${sortField}-${sortOrder}`}
                    onValueChange={(value) => {
                      const [field, order] = value.split("-") as [SortField, SortOrder]
                      setSortField(field)
                      setSortOrder(order)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="createdAt-desc">新しい順</SelectItem>
                      <SelectItem value="createdAt-asc">古い順</SelectItem>
                      <SelectItem value="fileName-asc">名前 (A-Z)</SelectItem>
                      <SelectItem value="fileName-desc">名前 (Z-A)</SelectItem>
                      <SelectItem value="fileSize-desc">サイズ大</SelectItem>
                      <SelectItem value="fileSize-asc">サイズ小</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* グループ表示トグル */}
                <div className="md:col-span-3">
                  <Label className="text-sm font-medium mb-2 block">グループ表示</Label>
                  <Button
                    variant={groupBySubject ? "default" : "outline"}
                    size="sm"
                    onClick={() => setGroupBySubject(!groupBySubject)}
                    className="w-full"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {groupBySubject ? "授業別表示中" : "授業別に表示"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 一括操作バー */}
        {selectedFiles.size > 0 && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium">
                    {selectedFiles.size}個のファイルを選択中
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFiles(new Set())}
                  >
                    選択解除
                  </Button>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  選択を削除
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ファイル一覧 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                ファイル一覧 ({filteredAndSortedFiles.length})
              </CardTitle>
              {filteredAndSortedFiles.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  {selectedFiles.size === filteredAndSortedFiles.length
                    ? "すべて解除"
                    : "すべて選択"}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredAndSortedFiles.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">ファイルがありません</p>
                <p className="text-sm mt-2">
                  {searchQuery ||
                  filterType !== "all" ||
                  filterResource !== "all" ||
                  filterSubjectId !== "all"
                    ? "検索条件に一致するファイルが見つかりませんでした"
                    : "まだファイルがアップロードされていません"}
                </p>
              </div>
            ) : groupBySubject && groupedBySubject ? (
              // 科目別グループ表示
              <div className="space-y-6">
                {Object.entries(groupedBySubject).map(([groupKey, groupFiles]) => {
                  const subjectName =
                    groupKey === "unrelated"
                      ? "未関連付け"
                      : groupFiles[0]?.subject?.name || "不明"

                  return (
                    <div key={groupKey} className="space-y-3">
                      <div className="flex items-center gap-2 pb-2 border-b">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-800">
                          {subjectName}
                        </h3>
                        <Badge variant="secondary">{groupFiles.length}件</Badge>
                      </div>

                      {viewMode === "list" ? (
                        <div className="space-y-2">
                          {groupFiles.map((file) => renderFileListItem(file))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {groupFiles.map((file) => renderFileGridItem(file))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : viewMode === "list" ? (
              // 通常のリスト表示
              <div className="space-y-2">
                {filteredAndSortedFiles.map((file) => renderFileListItem(file))}
              </div>
            ) : (
              // 通常のグリッド表示
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredAndSortedFiles.map((file) => renderFileGridItem(file))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ファイルプレビューダイアログ */}
      <FilePreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        file={previewFile}
      />

      {/* AI処理ダイアログ */}
      <AIProcessDialog
        isOpen={isAiDialogOpen}
        onClose={() => {
          setIsAiDialogOpen(false)
          setAiProcessFile(null)
        }}
        file={aiProcessFile}
      />
    </>
  )
}
