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
  Calendar,
  Clock,
  MapPin,
  User,
} from "lucide-react"
import { getSubject } from "@/app/actions/subjects"

const weekDays = ["日", "月", "火", "水", "木", "金", "土"]
const subjectTypes = {
  regular: "通常授業",
  intensive: "集中講義",
  on_demand: "オンデマンド",
  other: "その他",
}

export default function SubjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const subjectId = params.id as string

  const [subject, setSubject] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // データ取得
  useEffect(() => {
    const fetchSubjectData = async () => {
      if (!subjectId) return

      setIsLoading(true)
      const result = await getSubject(subjectId)

      if (result.success && result.data) {
        setSubject(result.data)
      } else {
        router.push("/subjects")
      }

      setIsLoading(false)
    }

    fetchSubjectData()
  }, [subjectId, router])

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
                <p className="text-gray-500">課題: {subject.tasks?.length || 0}件</p>
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
                <p className="text-gray-500">イベント: {subject.events?.length || 0}件</p>
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
                <p className="text-gray-500">メモ: {subject.notes?.length || 0}件</p>
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
                <p className="text-gray-500">ファイル: {subject.files?.length || 0}件</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <h3 className="font-semibold mb-2">デバッグ情報</h3>
          <pre className="text-xs text-gray-600">
            {JSON.stringify({
              id: subject.id,
              name: subject.name,
              type: subject.type,
              tasksCount: subject.tasks?.length || 0,
              eventsCount: subject.events?.length || 0,
              notesCount: subject.notes?.length || 0,
              filesCount: subject.files?.length || 0,
            }, null, 2)}
          </pre>
        </div>
      </main>
    </div>
  )
}
