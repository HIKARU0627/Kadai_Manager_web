"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateUsername, updateEmail, updatePassword, updateFullName } from "@/app/actions/users"
import { User, Mail, Lock, UserCircle } from "lucide-react"
import { useRouter } from "next/navigation"

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

  return (
    <Tabs defaultValue="profile" className="w-full max-w-3xl">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="profile">
          <UserCircle className="w-4 h-4 mr-2" />
          プロフィール
        </TabsTrigger>
        <TabsTrigger value="account">
          <Mail className="w-4 h-4 mr-2" />
          アカウント
        </TabsTrigger>
        <TabsTrigger value="security">
          <Lock className="w-4 h-4 mr-2" />
          セキュリティ
        </TabsTrigger>
      </TabsList>

      {/* Profile Tab */}
      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>プロフィール情報</CardTitle>
            <CardDescription>
              ユーザー名と氏名を変更できます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">
                  ユーザー名 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yamada_taro"
                  required
                  disabled={profileLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">氏名</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="山田 太郎"
                  disabled={profileLoading}
                />
              </div>

              {profileError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {profileError}
                </div>
              )}

              {profileSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                  {profileSuccess}
                </div>
              )}

              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={profileLoading}
              >
                {profileLoading ? "更新中..." : "プロフィールを更新"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Account Tab */}
      <TabsContent value="account">
        <Card>
          <CardHeader>
            <CardTitle>アカウント情報</CardTitle>
            <CardDescription>
              メールアドレスを変更できます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">
                  メールアドレス <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@example.com"
                  required
                  disabled={emailLoading}
                />
              </div>

              {emailError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {emailError}
                </div>
              )}

              {emailSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                  {emailSuccess}
                </div>
              )}

              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={emailLoading}
              >
                {emailLoading ? "更新中..." : "メールアドレスを更新"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-500">
                アカウント作成日: {new Date(user.createdAt).toLocaleDateString("ja-JP")}
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Security Tab */}
      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>セキュリティ</CardTitle>
            <CardDescription>
              パスワードを変更できます
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">
                  現在のパスワード <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="現在のパスワード"
                  required
                  disabled={passwordLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">
                  新しいパスワード <span className="text-red-500">*</span>
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  新しいパスワード（確認） <span className="text-red-500">*</span>
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
                />
              </div>

              {passwordError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                  {passwordSuccess}
                </div>
              )}

              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700"
                disabled={passwordLoading}
              >
                {passwordLoading ? "更新中..." : "パスワードを更新"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
