"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateUsername, updateEmail, updatePassword, updateFullName } from "@/app/actions/users"
import { User, Mail, Lock, UserCircle, Shield, Calendar, CheckCircle2, AlertCircle, BookOpen } from "lucide-react"
import { useRouter } from "next/navigation"
import SemesterManagementModal from "@/components/modals/SemesterManagementModal"

interface SettingsFormProps {
  user: {
    id: string
    username: string
    email: string
    fullName: string | null
    createdAt: Date
  }
  userId: string
}

export function SettingsForm({ user, userId }: SettingsFormProps) {
  const router = useRouter()

  // Profile state
  const [username, setUsername] = useState(user.username)
  const [fullName, setFullName] = useState(user.fullName || "")
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

  // Email state
  const [email, setEmail] = useState(user.email)
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null)

  // Password state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  // Semester management state
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(null)
    setProfileLoading(true)

    try {
      // Update username
      const usernameResult = await updateUsername(userId, username)
      if (!usernameResult.success) {
        setProfileError(usernameResult.error || "更新に失敗しました")
        setProfileLoading(false)
        return
      }

      // Update full name
      const fullNameResult = await updateFullName(userId, fullName)
      if (!fullNameResult.success) {
        setProfileError(fullNameResult.error || "更新に失敗しました")
        setProfileLoading(false)
        return
      }

      setProfileSuccess("プロフィールを更新しました")
      router.refresh()
    } catch (error) {
      setProfileError("エラーが発生しました")
    } finally {
      setProfileLoading(false)
    }
  }

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError(null)
    setEmailSuccess(null)
    setEmailLoading(true)

    try {
      const result = await updateEmail(userId, email)
      if (result.success) {
        setEmailSuccess("メールアドレスを更新しました")
        router.refresh()
      } else {
        setEmailError(result.error || "更新に失敗しました")
      }
    } catch (error) {
      setEmailError("エラーが発生しました")
    } finally {
      setEmailLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)

    if (newPassword !== confirmPassword) {
      setPasswordError("新しいパスワードが一致しません")
      return
    }

    setPasswordLoading(true)

    try {
      const result = await updatePassword(userId, currentPassword, newPassword)
      if (result.success) {
        setPasswordSuccess("パスワードを更新しました")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setPasswordError(result.error || "更新に失敗しました")
      }
    } catch (error) {
      setPasswordError("エラーが発生しました")
    } finally {
      setPasswordLoading(false)
    }
  }

  const userInitial = user.fullName?.charAt(0) || user.username.charAt(0).toUpperCase()

  return (
    <div className="space-y-6">
      {/* User Profile Header */}
      <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {userInitial}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800">
                {user.fullName || user.username}
              </h2>
              <p className="text-gray-600 flex items-center mt-1">
                <Mail className="w-4 h-4 mr-2" />
                {user.email}
              </p>
              <p className="text-sm text-gray-500 flex items-center mt-1">
                <Calendar className="w-4 h-4 mr-2" />
                登録日: {new Date(user.createdAt).toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-14 bg-gray-100">
          <TabsTrigger value="profile" className="text-base">
            <UserCircle className="w-5 h-5 mr-2" />
            プロフィール
          </TabsTrigger>
          <TabsTrigger value="account" className="text-base">
            <Mail className="w-5 h-5 mr-2" />
            アカウント
          </TabsTrigger>
          <TabsTrigger value="security" className="text-base">
            <Shield className="w-5 h-5 mr-2" />
            セキュリティ
          </TabsTrigger>
          <TabsTrigger value="semester" className="text-base">
            <BookOpen className="w-5 h-5 mr-2" />
            学期管理
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-xl">
                <User className="w-6 h-6 mr-2" />
                プロフィール情報
              </CardTitle>
              <CardDescription className="text-blue-100">
                ユーザー名と氏名を変更できます
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-base font-medium flex items-center">
                    <User className="w-4 h-4 mr-2 text-blue-600" />
                    ユーザー名 <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="yamada_taro"
                    required
                    disabled={profileLoading}
                    className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-base font-medium flex items-center">
                    <UserCircle className="w-4 h-4 mr-2 text-blue-600" />
                    氏名
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="山田 太郎"
                    disabled={profileLoading}
                    className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                  />
                </div>

                {profileError && (
                  <div className="flex items-center text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200 animate-in slide-in-from-top">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    {profileError}
                  </div>
                )}

                {profileSuccess && (
                  <div className="flex items-center text-sm text-green-600 bg-green-50 p-4 rounded-lg border border-green-200 animate-in slide-in-from-top">
                    <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                    {profileSuccess}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                  disabled={profileLoading}
                >
                  {profileLoading ? "更新中..." : "プロフィールを更新"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-xl">
                <Mail className="w-6 h-6 mr-2" />
                アカウント情報
              </CardTitle>
              <CardDescription className="text-purple-100">
                メールアドレスを変更できます
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleUpdateEmail} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-base font-medium flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-purple-600" />
                    メールアドレス <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@example.com"
                    required
                    disabled={emailLoading}
                    className="h-12 text-base border-2 focus:border-purple-500 transition-colors"
                  />
                </div>

                {emailError && (
                  <div className="flex items-center text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200 animate-in slide-in-from-top">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    {emailError}
                  </div>
                )}

                {emailSuccess && (
                  <div className="flex items-center text-sm text-green-600 bg-green-50 p-4 rounded-lg border border-green-200 animate-in slide-in-from-top">
                    <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                    {emailSuccess}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                  disabled={emailLoading}
                >
                  {emailLoading ? "更新中..." : "メールアドレスを更新"}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    アカウント情報
                  </h4>
                  <p className="text-sm text-gray-600">
                    アカウントID: <span className="font-mono text-xs bg-white px-2 py-1 rounded">{user.id}</span>
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    作成日: {new Date(user.createdAt).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-xl">
                <Shield className="w-6 h-6 mr-2" />
                セキュリティ
              </CardTitle>
              <CardDescription className="text-green-100">
                パスワードを変更して、アカウントを安全に保ちましょう
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleUpdatePassword} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-base font-medium flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-green-600" />
                    現在のパスワード <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="現在のパスワード"
                    required
                    disabled={passwordLoading}
                    className="h-12 text-base border-2 focus:border-green-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-base font-medium flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-green-600" />
                    新しいパスワード <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="6文字以上"
                    required
                    minLength={6}
                    disabled={passwordLoading}
                    className="h-12 text-base border-2 focus:border-green-500 transition-colors"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-base font-medium flex items-center">
                    <Lock className="w-4 h-4 mr-2 text-green-600" />
                    新しいパスワード（確認） <span className="text-red-500 ml-1">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="パスワードを再入力"
                    required
                    minLength={6}
                    disabled={passwordLoading}
                    className="h-12 text-base border-2 focus:border-green-500 transition-colors"
                  />
                </div>

                {passwordError && (
                  <div className="flex items-center text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200 animate-in slide-in-from-top">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="flex items-center text-sm text-green-600 bg-green-50 p-4 rounded-lg border border-green-200 animate-in slide-in-from-top">
                    <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
                    {passwordSuccess}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? "更新中..." : "パスワードを更新"}
                </Button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    セキュリティのヒント
                  </h4>
                  <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                    <li>パスワードは定期的に変更しましょう</li>
                    <li>推測されにくい複雑なパスワードを使用しましょう</li>
                    <li>他のサービスと同じパスワードを使わないようにしましょう</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Semester Tab */}
        <TabsContent value="semester" className="mt-6">
          <Card className="border-none shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center text-xl">
                <BookOpen className="w-6 h-6 mr-2" />
                学期管理
              </CardTitle>
              <CardDescription className="text-orange-100">
                年度と学期を管理して、時間割を整理しましょう
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-lg border border-orange-200">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-orange-600" />
                    学期について
                  </h4>
                  <p className="text-sm text-gray-700 mb-4">
                    学期を設定することで、年度ごとや学期ごとに教科を管理できます。
                    例：2024年度 春1期、2024年度 秋2期など
                  </p>
                  <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                    <li>年度と学期名を自由に設定できます</li>
                    <li>各学期に開始日・終了日を設定できます</li>
                    <li>現在の学期を選択できます</li>
                    <li>教科を学期ごとに整理できます</li>
                  </ul>
                </div>

                <Button
                  onClick={() => setIsSemesterModalOpen(true)}
                  className="w-full h-12 text-base bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-700 hover:to-yellow-700 shadow-lg"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  学期を管理
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Semester Management Modal */}
      <SemesterManagementModal
        isOpen={isSemesterModalOpen}
        onClose={() => setIsSemesterModalOpen(false)}
        onSemesterChange={() => {}}
      />
    </div>
  )
}
