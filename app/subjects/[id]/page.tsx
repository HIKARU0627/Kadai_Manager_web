"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Sidebar } from "@/components/layout/Sidebar"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { getSubject } from "@/app/actions/subjects"

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

      console.log("Fetching subject with ID:", subjectId)
      setIsLoading(true)

      try {
        const result = await getSubject(subjectId)
        console.log("getSubject result:", result)

        if (result.success && result.data) {
          console.log("Subject data loaded successfully:", result.data)
          setSubject(result.data)
          setError(null)
        } else {
          console.error("Failed to load subject:", result.error)
          setError(result.error || "授業データの取得に失敗しました")
          // リダイレクトをコメントアウトしてエラーを表示
          // router.push("/subjects")
        }
      } catch (err) {
        console.error("Exception while fetching subject:", err)
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
          <div className="text-center py-12 text-gray-500">
            <p>読み込み中...</p>
            <p className="text-sm mt-2">授業ID: {subjectId}</p>
          </div>
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
            <p className="text-red-700 mb-4">{error}</p>

            <div className="bg-white rounded p-4 mt-4">
              <h3 className="font-semibold mb-2">デバッグ情報:</h3>
              <pre className="text-xs text-gray-600">
{JSON.stringify({
  subjectId: subjectId,
  error: error,
}, null, 2)}
              </pre>
            </div>

            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">考えられる原因:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>指定された授業が存在しない</li>
                <li>データベース接続エラー</li>
                <li>権限がない</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!subject) {
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

          <div className="text-center py-12 text-gray-500">
            <p>授業が見つかりませんでした</p>
            <p className="text-sm mt-2">ID: {subjectId}</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <Link href="/subjects">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-gray-800 mb-4">{subject.name}</h1>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-green-800 mb-4">✅ 成功！授業データが読み込めました</h2>

          <div className="bg-white rounded p-4">
            <h3 className="font-semibold mb-2">授業情報:</h3>
            <pre className="text-xs text-gray-600 overflow-auto">
{JSON.stringify(subject, null, 2)}
            </pre>
          </div>
        </div>
      </main>
    </div>
  )
}
