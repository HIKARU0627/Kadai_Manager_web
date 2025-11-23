"use client"

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
  const params = useParams()
  const router = useRouter()
  const subjectId = params.id as string

  const [subject, setSubject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // データ取得
  useEffect(() => {
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

    fetchSubjectData()
  }, [subjectId])

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
                <CardTitle>課題一覧</CardTitle>
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
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>課題がありません</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* イベントタブ */}
          <TabsContent value="events" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>テスト・予定一覧</CardTitle>
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
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>テストや予定がありません</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* メモタブ */}
          <TabsContent value="notes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>授業メモ一覧</CardTitle>
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
                            <p className="text-sm text-gray-600 mb-2 whitespace-pre-wrap">
                              {note.content}
                            </p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(note.createdAt), "yyyy年MM月dd日 HH:mm", { locale: ja })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>授業メモがありません</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ファイルタブ */}
          <TabsContent value="files" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>ファイル一覧</CardTitle>
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
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <p>ファイルがありません</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
