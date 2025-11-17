"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AddNoteModal } from "@/components/modals/AddNoteModal"
import { Plus, Search, FileText, AlertCircle, Calendar } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

// モックデータ
const mockNotes = [
  {
    id: "1",
    title: "第5回講義の重要ポイント",
    content:
      "微分積分の応用について。ロピタルの定理を使った極限の計算が試験に出る予定。次回までに練習問題1-10を解いてくること。",
    subject: "数学I",
    subjectColor: "#3B82F6",
    noteType: "general",
    createdAt: new Date(2025, 10, 15),
  },
  {
    id: "2",
    title: "小テスト日程",
    content: "11月22日（金）に第1章〜第3章の範囲で小テストを実施します。",
    subject: "数学I",
    subjectColor: "#3B82F6",
    noteType: "quiz",
    quizDate: new Date(2025, 10, 22),
    createdAt: new Date(2025, 10, 14),
  },
  {
    id: "3",
    title: "プレゼンテーション課題について",
    content:
      "最終課題として、グループプレゼンテーションを実施します。テーマは自由。発表時間は10分、質疑応答5分。",
    subject: "英語会話",
    subjectColor: "#10B981",
    noteType: "announcement",
    createdAt: new Date(2025, 10, 16),
  },
  {
    id: "4",
    title: "アルゴリズムの計算量",
    content:
      "O(n), O(n²), O(log n)の違いについて復習。バブルソートとクイックソートの比較を理解すること。",
    subject: "プログラミング基礎",
    subjectColor: "#8B5CF6",
    noteType: "general",
    createdAt: new Date(2025, 10, 17),
  },
  {
    id: "5",
    title: "次回の実験について",
    content:
      "次回は振り子の周期測定実験を行います。実験ノート、筆記用具、関数電卓を持参してください。",
    subject: "物理学",
    subjectColor: "#EC4899",
    noteType: "announcement",
    createdAt: new Date(2025, 10, 16),
  },
  {
    id: "6",
    title: "中間テスト日程",
    content:
      "12月5日（木）に中間テストを実施します。範囲は江戸時代〜明治時代まで。",
    subject: "日本史",
    subjectColor: "#6366F1",
    noteType: "quiz",
    quizDate: new Date(2025, 11, 5),
    createdAt: new Date(2025, 10, 15),
  },
]

const subjects = [
  { name: "すべて", color: "#6B7280" },
  { name: "数学I", color: "#3B82F6" },
  { name: "英語会話", color: "#10B981" },
  { name: "プログラミング基礎", color: "#8B5CF6" },
  { name: "物理学", color: "#EC4899" },
  { name: "日本史", color: "#6366F1" },
]

const mockSubjects = [
  { id: "1", name: "数学I", color: "#3B82F6" },
  { id: "2", name: "英語会話", color: "#10B981" },
  { id: "3", name: "プログラミング基礎", color: "#8B5CF6" },
  { id: "4", name: "物理学", color: "#EC4899" },
  { id: "5", name: "日本史", color: "#6366F1" },
]

const noteTypes = [
  { id: "all", label: "すべて", icon: FileText },
  { id: "general", label: "一般", icon: FileText },
  { id: "quiz", label: "小テスト", icon: AlertCircle },
  { id: "announcement", label: "お知らせ", icon: Calendar },
]

export default function NotesPage() {
  const [selectedSubject, setSelectedSubject] = useState("すべて")
  const [selectedNoteType, setSelectedNoteType] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const filteredNotes = mockNotes.filter((note) => {
    const matchesSubject =
      selectedSubject === "すべて" || note.subject === selectedSubject
    const matchesType =
      selectedNoteType === "all" || note.noteType === selectedNoteType
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSubject && matchesType && matchesSearch
  })

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
                  {subjects.map((subject) => (
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
                      {mockNotes.length}件
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">小テスト</span>
                    <Badge className="bg-red-100 text-red-600">
                      {mockNotes.filter((n) => n.noteType === "quiz").length}件
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">お知らせ</span>
                    <Badge className="bg-blue-100 text-blue-600">
                      {
                        mockNotes.filter((n) => n.noteType === "announcement")
                          .length
                      }
                      件
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
              {filteredNotes.length > 0 ? (
                filteredNotes.map((note) => (
                  <Card
                    key={note.id}
                    className="hover:shadow-md transition border-l-4"
                    style={{ borderLeftColor: note.subjectColor }}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center space-x-2">
                          <Badge
                            style={{
                              backgroundColor: `${note.subjectColor}20`,
                              color: note.subjectColor,
                            }}
                          >
                            {note.subject}
                          </Badge>
                          <Badge className={getNoteTypeColor(note.noteType)}>
                            {getNoteTypeLabel(note.noteType)}
                          </Badge>
                        </div>
                        <span className="text-sm text-gray-500">
                          {format(note.createdAt, "yyyy/MM/dd", { locale: ja })}
                        </span>
                      </div>

                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {note.title}
                      </h3>

                      <p className="text-gray-600 mb-3">{note.content}</p>

                      {note.quizDate && (
                        <div className="flex items-center text-sm text-red-600 bg-red-50 p-2 rounded">
                          <Calendar className="w-4 h-4 mr-2" />
                          小テスト日程:{" "}
                          {format(note.quizDate, "yyyy年MM月dd日（E）", {
                            locale: ja,
                          })}
                        </div>
                      )}

                      <div className="mt-4 flex space-x-2">
                        <Button variant="outline" size="sm">
                          編集
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
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
                      メモが見つかりませんでした
                    </p>
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
        onOpenChange={setIsAddModalOpen}
        subjects={mockSubjects}
        userId="mock-user-id"
      />
    </div>
  )
}
