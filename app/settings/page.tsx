import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { getUserProfile } from "@/app/actions/users"
import { SettingsForm } from "@/components/settings/SettingsForm"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  const result = await getUserProfile(session.user.id)

  if (!result.success || !result.data) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-600">ユーザー情報の読み込みに失敗しました</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">設定</h1>
      <SettingsForm user={result.data} userId={session.user.id} />
    </div>
  )
}
