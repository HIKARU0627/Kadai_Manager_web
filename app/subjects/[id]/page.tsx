"use client"

import { useParams } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SubjectDetailPage() {
  const params = useParams()
  const subjectId = params.id as string

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

        <h1 className="text-3xl font-bold text-gray-800 mb-4">授業詳細ページ</h1>
        <p className="text-gray-600">Subject ID: {subjectId}</p>

        <div className="mt-8 p-6 bg-white rounded-lg shadow">
          <p className="text-gray-700">このページは正常に表示されています。</p>
          <p className="text-gray-700 mt-2">ルーティングは正しく動作しています。</p>
        </div>
      </main>
    </div>
  )
}
