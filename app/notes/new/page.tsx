"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "@/components/layout/Sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MarkdownEditor } from "@/components/ui/markdown-editor"
import { createNote, NoteType } from "@/app/actions/notes"
import { getSubjects } from "@/app/actions/subjects"
import { ArrowLeft, Save, Upload, X, FileIcon } from "lucide-react"

interface Subject {
  id: string
  name: string
  color: string
}

export default function NewNotePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const subjectIdParam = searchParams.get("subjectId")

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<string>("")

  const [formData, setFormData] = useState({
    subjectId: subjectIdParam || "",
    title: "",
    content: "",
    noteType: "general" as NoteType,
  })

  // 科目を取得
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!session?.user?.id) return

      const subjectsResult = await getSubjects(session.user.id)
      if (subjectsResult.success) {
        setSubjects(subjectsResult.data)
      }
    }

    fetchSubjects()
  }, [session?.user?.id])

  // URLパラメータから科目IDが渡された場合
  useEffect(() => {
    if (subjectIdParam) {
      setFormData((prev) => ({ ...prev, subjectId: subjectIdParam }))
    }
  }, [subjectIdParam])

  // ファイル選択ハンドラー
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      const invalidFiles = newFiles.filter((file) => file.size > 10 * 1024 * 1024)
      if (invalidFiles.length > 0) {
        setError("ファイルサイズは10MB以下にしてください")
        return
      }
      setSelectedFiles((prev) => [...prev, ...newFiles])
      setError(null)
    }
  }

  // ファイル削除ハンドラー
  const handleFileRemove = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // ファイルサイズをフォーマット
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

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

      const result = await createNote({
        userId: session?.user?.id || "",
        subjectId: formData.subjectId,
        title: formData.title || undefined,
        content: formData.content,
        noteType: formData.noteType,
      })

      if (result.success && result.data) {
        const noteId = result.data.id

        // ファイルをアップロード
        if (selectedFiles.length > 0) {
          setUploadProgress(`ファイルをアップロード中... (0/${selectedFiles.length})`)

          for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i]
            const fileFormData = new FormData()
            fileFormData.append("file", file)
            fileFormData.append("noteId", noteId)

            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: fileFormData,
            })

            if (!uploadResponse.ok) {
              console.error(`Failed to upload file: ${file.name}`)
            }

            setUploadProgress(
              `ファイルをアップロード中... (${i + 1}/${selectedFiles.length})`
            )
          }
        }

        // ノート一覧ページに戻る
        router.push("/notes")
      } else {
        setError(result.error || "ノートの作成に失敗しました")
      }
    } catch (err) {
      setError("エラーが発生しました")
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
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
            <h1 className="text-3xl font-bold text-gray-800">授業ノートを作成</h1>
            <p className="text-gray-600 mt-2">
              マークダウンで授業の詳細なノートを作成できます
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* メインエリア */}
              <div className="lg:col-span-2 space-y-6">
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
                      placeholder="マークダウンでノートの内容を入力してください

# 講義概要

## 学んだこと
- ポイント1
- ポイント2

## 重要な公式
\`\`\`
E = mc²
\`\`\`

## 参考リンク
- [参考資料](https://example.com)"
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

                {/* ファイル添付 */}
                <Card>
                  <CardHeader>
                    <CardTitle>ファイル添付</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Input
                        id="files"
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("files")?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        ファイルを選択
                      </Button>
                      <p className="text-xs text-gray-500">
                        最大10MBまでのファイルをアップロードできます
                      </p>

                      {/* 選択されたファイルのリスト */}
                      {selectedFiles.length > 0 && (
                        <div className="space-y-2">
                          {selectedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                            >
                              <div className="flex items-center space-x-2 flex-1 min-w-0">
                                <FileIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                <span className="text-sm truncate">{file.name}</span>
                                <span className="text-xs text-gray-500 flex-shrink-0">
                                  ({formatFileSize(file.size)})
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleFileRemove(index)}
                                className="h-6 w-6 text-gray-400 hover:text-red-600"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* アップロード進捗 */}
                {uploadProgress && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <p className="text-sm text-blue-600">{uploadProgress}</p>
                    </CardContent>
                  </Card>
                )}

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
                    {isSubmitting ? "保存中..." : "ノートを保存"}
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
