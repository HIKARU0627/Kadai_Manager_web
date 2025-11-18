import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { getUserProfile } from "@/app/actions/users"
import { SettingsForm } from "@/components/settings/SettingsForm"
import { Settings, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  const result = await getUserProfile(session.user.id)

  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
          ユーザー情報の読み込みに失敗しました
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="mb-4 hover:bg-blue-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            ダッシュボードに戻る
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4 shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                設定
              </h1>
              <p className="text-gray-600 mt-1">アカウント情報とセキュリティ設定を管理</p>
            </div>
          </div>
        </div>
      </div>
      <SettingsForm user={result.data} userId={session.user.id} />
    </div>
  )
}
