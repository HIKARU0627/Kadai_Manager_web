"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AddNoteModal } from "@/components/modals/AddNoteModal"
import { EditNoteModal } from "@/components/modals/EditNoteModal"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { Plus, Search, FileText, AlertCircle, Calendar, Edit, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { getNotes, deleteNote, type NoteType } from "@/app/actions/notes"
import { getSubjects } from "@/app/actions/subjects"

const noteTypes = [
  { id: "all", label: "すべて", icon: FileText },
  { id: "general", label: "一般", icon: FileText },
  { id: "quiz", label: "小テスト", icon: AlertCircle },
  { id: "announcement", label: "お知らせ", icon: Calendar },
]

interface Note {
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
}

interface Subject {
  id: string
  name: string
  color: string
}

export default function NotesPage() {
  const { data: session } = useSession()
  const [selectedSubject, setSelectedSubject] = useState("すべて")
  const [selectedNoteType, setSelectedNoteType] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  // データの取得
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return

      setIsLoading(true)
      const [notesResult, subjectsResult] = await Promise.all([
        getNotes(session.user.id, {}),
        getSubjects(session.user.id),
      ])

      if (notesResult.success) {
        setNotes(notesResult.data as Note[])
      }

      if (subjectsResult.success) {
        setSubjects(subjectsResult.data)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [session?.user?.id])

  // フィルタリングされたノート
  const filteredNotes = notes.filter((note) => {
    const matchesSubject =
      selectedSubject === "すべて" || note.subject?.name === selectedSubject
    const matchesType =
      selectedNoteType === "all" || note.noteType === selectedNoteType
    const matchesSearch =
      (note.title?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSubject && matchesType && matchesSearch
  })

  // 科目リスト（すべてを含む）
  const subjectFilters = [
    { name: "すべて", color: "#6B7280" },
    ...subjects,
  ]

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

  // データ再取得の共通関数
  const fetchNotesData = async () => {
    if (!session?.user?.id) return

    setIsLoading(true)
    const [notesResult, subjectsResult] = await Promise.all([
      getNotes(session.user.id, {}),
      getSubjects(session.user.id),
    ])

    if (notesResult.success) {
      setNotes(notesResult.data as Note[])
    }

    if (subjectsResult.success) {
      setSubjects(subjectsResult.data)
    }

    setIsLoading(false)
  }

  // 追加モーダル閉じた時にデータを再取得
  const handleModalClose = async (open: boolean) => {
    setIsAddModalOpen(open)
    if (!open) {
      await fetchNotesData()
    }
  }

  // 編集モーダル閉じた時にデータを再取得
  const handleEditModalClose = async (open: boolean) => {
    setIsEditModalOpen(open)
    if (!open) {
      await fetchNotesData()
      setSelectedNote(null)
    }
  }

  // 編集ボタンのハンドラー
  const handleEdit = (note: Note) => {
    setSelectedNote(note)
    setIsEditModalOpen(true)
  }

  // 削除ボタンのハンドラー
  const handleDeleteClick = (note: Note) => {
    setSelectedNote(note)
    setIsDeleteDialogOpen(true)
  }

  // 削除確認のハンドラー
  const handleDeleteConfirm = async () => {
    if (!selectedNote) return

    setIsDeleting(true)
    const result = await deleteNote(selectedNote.id)

    if (result.success) {
      setIsDeleteDialogOpen(false)
      setSelectedNote(null)
      await fetchNotesData()
    } else {
      alert(result.error || "削除に失敗しました")
    }

    setIsDeleting(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        {/* ヘッダー */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">授業メモ</h2>
            <p className="text-gray-600 mt-2">
              授業の重要事項、小テスト日程、連絡事項を管理
            </p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            新規メモを追加
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* フィルターサイドバー */}
          <div className="lg:col-span-1 space-y-4">
            {/* 科目フィルター */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">科目</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {subjectFilters.map((subject) => (
                    <button
                      key={subject.name}
                      onClick={() => setSelectedSubject(subject.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        selectedSubject === subject.name
                          ? "bg-blue-50 text-blue-600 font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: subject.color }}
                        ></div>
                        {subject.name}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* タイプフィルター */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">タイプ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {noteTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.id}
                        onClick={() => setSelectedNoteType(type.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition flex items-center ${
                          selectedNoteType === type.id
                            ? "bg-blue-50 text-blue-600 font-medium"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {type.label}
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* 統計 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">統計</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">総メモ数</span>
                    <Badge className="bg-blue-100 text-blue-600">
                      {notes.length}件
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">小テスト</span>
                    <Badge className="bg-red-100 text-red-600">
                      {notes.filter((n) => n.noteType === "quiz").length}件
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">お知らせ</span>
                    <Badge className="bg-blue-100 text-blue-600">
                      {notes.filter((n) => n.noteType === "announcement").length}件
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* メモ一覧 */}
          <div className="lg:col-span-3">
            {/* 検索バー */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="メモを検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* メモカード */}
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center py-12 text-gray-500">
                  読み込み中...
                </div>
              ) : filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <Card
                    key={note.id}
                    className="hover:shadow-md transition border-l-4"
                    style={{ borderLeftColor: note.subject?.color || "#6B7280" }}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge
                            style={{
                              backgroundColor: `${note.subject?.color || "#6B7280"}20`,
                              color: note.subject?.color || "#6B7280",
                            }}
                          >
                            {note.subject?.name || "不明"}
                          </Badge>
                          <Badge className={getNoteTypeColor(note.noteType)}>
                            {getNoteTypeLabel(note.noteType)}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {format(new Date(note.createdAt), "yyyy/MM/dd", { locale: ja })}
                        </span>
                      </div>

                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {note.title || "無題"}
                      </h3>

                      <p className="text-gray-600 mb-3">{note.content}</p>

                      {note.quizDate && (
                        <div className="flex items-center text-sm text-red-600 bg-red-50 p-2 rounded">
                          <Calendar className="w-4 h-4 mr-2" />
                          小テスト日程:{" "}
                          {format(new Date(note.quizDate), "yyyy年MM月dd日（E）", {
                            locale: ja,
                          })}
                        </div>
                      )}

                      <div className="mt-4 flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(note)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          編集
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteClick(note)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          削除
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {notes.length === 0
                        ? "メモがまだありません"
                        : "条件に一致するメモが見つかりませんでした"}
                    </p>
                    {notes.length === 0 && (
                      <Button
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                        onClick={() => setIsAddModalOpen(true)}
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        最初のメモを追加
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* メモ追加モーダル */}
      <AddNoteModal
        open={isAddModalOpen}
        onOpenChange={handleModalClose}
        subjects={subjects}
        userId={session?.user?.id || ""}
      />

      {/* メモ編集モーダル */}
      <EditNoteModal
        open={isEditModalOpen}
        onOpenChange={handleEditModalClose}
        subjects={subjects}
        note={selectedNote}
      />

      {/* 削除確認ダイアログ */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="メモを削除しますか？"
        description={`「${selectedNote?.title || "無題"}」を削除します。この操作は取り消せません。本当に削除してもよろしいですか？`}
        isDeleting={isDeleting}
      />
    </div>
  )
}
