"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "@/components/layout/Sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MarkdownEditor } from "@/components/ui/markdown-editor"
import { updateNote, getNote, NoteType } from "@/app/actions/notes"
import { getSubjects } from "@/app/actions/subjects"
import { ArrowLeft, Save } from "lucide-react"

interface Subject {
  id: string
  name: string
  color: string
}

interface Note {
  id: string
  title: string | null
  content: string
  noteType: string
  subject: {
    id: string
    name: string
    color: string
  }
}

export default function EditNotePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const noteId = params.id as string

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    subjectId: "",
    title: "",
    content: "",
    noteType: "general" as NoteType,
  })

  // ノートと科目を取得
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id || !noteId) return

      setIsLoading(true)

      // 科目を取得
      const subjectsResult = await getSubjects(session.user.id)
      if (subjectsResult.success) {
        setSubjects(subjectsResult.data)
      }

      // ノートを取得
      const noteResult = await getNote(noteId)
      if (noteResult.success && noteResult.data) {
        const note = noteResult.data as Note
        setFormData({
          subjectId: note.subject.id,
          title: note.title || "",
          content: note.content,
          noteType: note.noteType as NoteType,
        })
      } else {
        setError("ノートの読み込みに失敗しました")
      }

      setIsLoading(false)
    }

    fetchData()
  }, [session?.user?.id, noteId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      // Validation
      if (!formData.subjectId) {
        setError("科目を選択してください")
        setIsSubmitting(false)
        return
      }

      if (!formData.content.trim()) {
        setError("内容を入力してください")
        setIsSubmitting(false)
        return
      }

      const result = await updateNote({
        id: noteId,
        subjectId: formData.subjectId,
        title: formData.title || undefined,
        content: formData.content,
        noteType: formData.noteType,
      })

      if (result.success) {
        // ノート一覧ページに戻る
        router.push("/notes")
      } else {
        setError(result.error || "ノートの更新に失敗しました")
      }
    } catch (err) {
      setError("エラーが発生しました")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto flex items-center justify-center">
          <p className="text-gray-500">読み込み中...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="w-full p-8">
          {/* ヘッダー */}
          <div className="mb-6">
            <Link href="/notes">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                ノート一覧に戻る
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">授業ノートを編集</h1>
            <p className="text-gray-600 mt-2">
              マークダウンで授業ノートを編集できます
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* メインエリア */}
              <div className="lg:col-span-4 space-y-6">
                {/* タイトル */}
                <Card>
                  <CardHeader>
                    <CardTitle>タイトル</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="例: 第5回講義 - データ構造とアルゴリズム"
                      className="text-lg"
                    />
                  </CardContent>
                </Card>

                {/* 内容 */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      内容 <span className="text-red-500">*</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MarkdownEditor
                      value={formData.content}
                      onChange={(value) =>
                        setFormData({ ...formData, content: value })
                      }
                      placeholder="マークダウンでノートの内容を入力してください"
                      height={600}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* サイドバー */}
              <div className="space-y-6">
                {/* 科目選択 */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      科目 <span className="text-red-500">*</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={formData.subjectId}
                      onValueChange={(value) =>
                        setFormData({ ...formData, subjectId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="科目を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            <div className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: subject.color }}
                              ></div>
                              {subject.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* ノートタイプ */}
                <Card>
                  <CardHeader>
                    <CardTitle>種類</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={formData.noteType}
                      onValueChange={(value: NoteType) =>
                        setFormData({ ...formData, noteType: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">授業ノート</SelectItem>
                        <SelectItem value="announcement">お知らせ</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* エラーメッセージ */}
                {error && (
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-red-600">{error}</p>
                    </CardContent>
                  </Card>
                )}

                {/* 保存ボタン */}
                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {isSubmitting ? "保存中..." : "変更を保存"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/notes")}
                    disabled={isSubmitting}
                    className="w-full"
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
