"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "@/components/layout/Sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  Edit,
  Plus,
  Calendar,
  Clock,
  MapPin,
  User,
  FileText,
  Upload,
  Download,
  Trash2,
} from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { getSubject } from "@/app/actions/subjects"
import { deleteTask } from "@/app/actions/tasks"
import { deleteEvent } from "@/app/actions/events"
import { deleteNote } from "@/app/actions/notes"
import { deleteFile } from "@/app/actions/files"
import { EditSubjectModal } from "@/components/modals/EditSubjectModal"
import { AddTaskModal } from "@/components/modals/AddTaskModal"
import { EditTaskModal } from "@/components/modals/EditTaskModal"
import { AddEventModal } from "@/components/modals/AddEventModal"
import { EditEventModal } from "@/components/modals/EditEventModal"
import { AddNoteModal } from "@/components/modals/AddNoteModal"
import { EditNoteModal } from "@/components/modals/EditNoteModal"
import { FileUploadModal } from "@/components/modals/FileUploadModal"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"

const weekDays = ["日", "月", "火", "水", "木", "金", "土"]
const subjectTypes = {
  regular: "通常授業",
  intensive: "集中講義",
  on_demand: "オンデマンド",
  other: "その他",
}

const statusLabels = {
  not_started: "未着手",
  in_progress: "作業中",
  completed: "完了",
  overdue: "時間切れ",
}

const statusColors = {
  not_started: "bg-gray-100 text-gray-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
}

export default function SubjectDetailPage() {
  const { data: session } = useSession()
  const params = useParams()
  const router = useRouter()
  const subjectId = params.id as string

  const [subject, setSubject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // モーダル状態
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false)
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false)
  const [isAddNoteModalOpen, setIsAddNoteModalOpen] = useState(false)
  const [isEditNoteModalOpen, setIsEditNoteModalOpen] = useState(false)
  const [isFileUploadModalOpen, setIsFileUploadModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // 選択されたアイテム
  const [selectedTask, setSelectedTask] = useState<any>(null)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)
  const [selectedNote, setSelectedNote] = useState<any>(null)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "task" | "event" | "note" | "file"
    id: string
    name: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // データ取得
  const fetchSubjectData = async () => {
    if (!subjectId) {
      setError("授業IDが見つかりません")
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      const result = await getSubject(subjectId)

      if (result.success && result.data) {
        setSubject(result.data)
        setError(null)
      } else {
        setError(result.error || "授業データの取得に失敗しました")
      }
    } catch (err) {
      setError(`エラーが発生しました: ${err}`)
    }

    setIsLoading(false)
  }

  useEffect(() => {
    fetchSubjectData()
  }, [subjectId])

  // モーダルクローズハンドラー
  const handleModalClose = async (open: boolean, setter: (value: boolean) => void) => {
    setter(open)
    if (!open) {
      await fetchSubjectData()
    }
  }

  // 削除ハンドラー
  const handleDeleteClick = (type: "task" | "event" | "note" | "file", id: string, name: string) => {
    setDeleteTarget({ type, id, name })
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    setIsDeleting(true)
    let result

    switch (deleteTarget.type) {
      case "task":
        result = await deleteTask(deleteTarget.id)
        break
      case "event":
        result = await deleteEvent(deleteTarget.id)
        break
      case "note":
        result = await deleteNote(deleteTarget.id)
        break
      case "file":
        result = await deleteFile(deleteTarget.id)
        break
    }

    if (result.success) {
      setIsDeleteDialogOpen(false)
      setDeleteTarget(null)
      await fetchSubjectData()
    } else {
      alert(result.error || "削除に失敗しました")
    }

    setIsDeleting(false)
  }

  // ファイルダウンロード
  const handleFileDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement("a")
    link.href = fileUrl
    link.download = fileName
    link.click()
  }

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="text-center py-12 text-gray-500">読み込み中...</div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8">
          <Link href="/subjects">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              時間割に戻る
            </Button>
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-4">エラーが発生しました</h2>
            <p className="text-red-700">{error}</p>
          </div>
        </main>
      </div>
    )
  }

  if (!subject) {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <Link href="/subjects">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              戻る
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-gray-800">{subject.name}</h2>
                <Badge variant="secondary">
                  {subjectTypes[subject.type as keyof typeof subjectTypes] || subject.type}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-gray-600 mt-4">
                {subject.semester && (
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {subject.semester.name}
                  </div>
                )}
                {subject.dayOfWeek !== null && subject.period !== null && (
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {weekDays[subject.dayOfWeek]}曜日 {subject.period}限
                  </div>
                )}
                {subject.teacher && (
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    {subject.teacher}
                  </div>
                )}
                {subject.classroom && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {subject.classroom}
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={() => setIsEditModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              授業情報を編集
            </Button>
          </div>
        </div>

        {/* タブコンテンツ */}
        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tasks">
              課題 ({subject.tasks?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="events">
              テスト・予定 ({subject.events?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="notes">
              授業メモ ({subject.notes?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="files">
              ファイル ({subject.files?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* 課題タブ */}
          <TabsContent value="tasks" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>課題一覧</CardTitle>
                  <Button
                    onClick={() => setIsAddTaskModalOpen(true)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    課題を追加
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {subject.tasks && subject.tasks.length > 0 ? (
                  <div className="space-y-3">
                    {subject.tasks.map((task: any) => (
                      <div
                        key={task.id}
                        className="border rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-800">{task.title}</h4>
                              <Badge className={statusColors[task.status as keyof typeof statusColors]}>
                                {statusLabels[task.status as keyof typeof statusLabels]}
                              </Badge>
                              {task.priority === 1 && (
                                <Badge variant="destructive">高優先度</Badge>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">{task.description}</p>
                            )}
                            {task.dueDate && (
                              <p className="text-sm text-gray-500">
                                期限: {format(new Date(task.dueDate), "yyyy年MM月dd日（E）HH:mm", { locale: ja })}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTask(task)
                                setIsEditTaskModalOpen(true)
                              }}
                            >
                              編集
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteClick("task", task.id, task.title)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>課題がありません</p>
                    <Button
                      onClick={() => setIsAddTaskModalOpen(true)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      最初の課題を追加
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* イベントタブ */}
          <TabsContent value="events" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>テスト・予定一覧</CardTitle>
                  <Button
                    onClick={() => setIsAddEventModalOpen(true)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    予定を追加
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {subject.events && subject.events.length > 0 ? (
                  <div className="space-y-3">
                    {subject.events.map((event: any) => (
                      <div
                        key={event.id}
                        className="border rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-800">{event.title}</h4>
                              <Badge variant="outline">{event.eventType || "イベント"}</Badge>
                            </div>
                            {event.description && (
                              <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                            )}
                            <p className="text-sm text-gray-500">
                              {format(new Date(event.startDatetime), "yyyy年MM月dd日（E）HH:mm", { locale: ja })}
                              {event.endDatetime && ` - ${format(new Date(event.endDatetime), "HH:mm", { locale: ja })}`}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedEvent(event)
                                setIsEditEventModalOpen(true)
                              }}
                            >
                              編集
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteClick("event", event.id, event.title)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>テストや予定がありません</p>
                    <Button
                      onClick={() => setIsAddEventModalOpen(true)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      最初の予定を追加
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* メモタブ */}
          <TabsContent value="notes" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>授業メモ一覧</CardTitle>
                  <div className="flex gap-2">
                    <Link href={`/notes/new?subjectId=${subject.id}`}>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        ノート作成
                      </Button>
                    </Link>
                    <Button
                      onClick={() => setIsAddNoteModalOpen(true)}
                      size="sm"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      メモ追加
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {subject.notes && subject.notes.length > 0 ? (
                  <div className="space-y-3">
                    {subject.notes.map((note: any) => (
                      <div
                        key={note.id}
                        className="border rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-800">{note.title}</h4>
                              {note.noteType === "announcement" && (
                                <Badge variant="secondary">お知らせ</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 mb-2 bg-gray-50 p-3 rounded border border-gray-200">
                              <MarkdownRenderer content={note.content} className="text-sm" />
                            </div>
                            <p className="text-xs text-gray-400">
                              {format(new Date(note.createdAt), "yyyy年MM月dd日 HH:mm", { locale: ja })}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Link href={`/notes/${note.id}/edit`}>
                              <Button
                                variant="outline"
                                size="sm"
                              >
                                編集
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteClick("note", note.id, note.title)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>授業メモがありません</p>
                    <Link href={`/notes/new?subjectId=${subject.id}`}>
                      <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                        <FileText className="w-4 h-4 mr-2" />
                        最初のノートを作成
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ファイルタブ */}
          <TabsContent value="files" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>ファイル一覧</CardTitle>
                  <Button
                    onClick={() => setIsFileUploadModalOpen(true)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    ファイルをアップロード
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {subject.files && subject.files.length > 0 ? (
                  <div className="space-y-3">
                    {subject.files.map((file: any) => (
                      <div
                        key={file.id}
                        className="border rounded-lg p-4 hover:shadow-md transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <FileText className="w-8 h-8 text-blue-500 mr-3" />
                            <div>
                              <h4 className="font-semibold text-gray-800">{file.fileName}</h4>
                              <p className="text-xs text-gray-400">
                                {file.fileSize && `${(file.fileSize / 1024).toFixed(2)} KB`}
                                {file.createdAt && ` ・ ${format(new Date(file.createdAt), "yyyy年MM月dd日", { locale: ja })}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            {file.fileUrl && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFileDownload(file.fileUrl, file.fileName)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                ダウンロード
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteClick("file", file.id, file.fileName)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>ファイルがありません</p>
                    <Button
                      onClick={() => setIsFileUploadModalOpen(true)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      最初のファイルをアップロード
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* モーダル群 */}
      <EditSubjectModal
        open={isEditModalOpen}
        onOpenChange={(open) => handleModalClose(open, setIsEditModalOpen)}
        subject={subject}
      />

      <AddTaskModal
        open={isAddTaskModalOpen}
        onOpenChange={(open) => handleModalClose(open, setIsAddTaskModalOpen)}
        userId={session?.user?.id || ""}
        subjects={[subject]}
        defaultSubjectId={subject.id}
      />

      <EditTaskModal
        open={isEditTaskModalOpen}
        onOpenChange={(open) => handleModalClose(open, setIsEditTaskModalOpen)}
        task={selectedTask}
        subjects={[subject]}
      />

      <AddEventModal
        open={isAddEventModalOpen}
        onOpenChange={(open) => handleModalClose(open, setIsAddEventModalOpen)}
        userId={session?.user?.id || ""}
        subjects={[subject]}
        defaultSubjectId={subject.id}
      />

      <EditEventModal
        open={isEditEventModalOpen}
        onOpenChange={(open) => handleModalClose(open, setIsEditEventModalOpen)}
        event={selectedEvent}
        subjects={[subject]}
      />

      <AddNoteModal
        open={isAddNoteModalOpen}
        onOpenChange={(open) => handleModalClose(open, setIsAddNoteModalOpen)}
        userId={session?.user?.id || ""}
        subjects={[subject]}
        defaultSubjectId={subject.id}
      />

      <EditNoteModal
        open={isEditNoteModalOpen}
        onOpenChange={(open) => handleModalClose(open, setIsEditNoteModalOpen)}
        note={selectedNote}
        subjects={[subject]}
      />

      <FileUploadModal
        open={isFileUploadModalOpen}
        onOpenChange={(open) => handleModalClose(open, setIsFileUploadModalOpen)}
        userId={session?.user?.id || ""}
        subjectId={subject.id}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title={`${deleteTarget?.type === "task" ? "課題" : deleteTarget?.type === "event" ? "予定" : deleteTarget?.type === "note" ? "メモ" : "ファイル"}を削除しますか？`}
        description={`「${deleteTarget?.name || ""}」を削除します。この操作は取り消せません。`}
        isDeleting={isDeleting}
      />
    </div>
  )
}
