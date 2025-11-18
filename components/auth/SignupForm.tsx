"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { registerUser } from "@/app/actions/users"
import Link from "next/link"

export function SignupForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      // Validate password confirmation
      if (formData.password !== formData.confirmPassword) {
        setError("パスワードが一致しません")
        setIsLoading(false)
        return
      }

      const result = await registerUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      })

      if (result.success) {
        // Registration successful, redirect to login
        router.push("/login?registered=true")
      } else {
        setError(result.error || "登録に失敗しました")
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError("エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">新規登録</CardTitle>
        <CardDescription className="text-center">
          アカウントを作成してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">
              ユーザー名 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="山田太郎"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              メールアドレス <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="example@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              パスワード <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="6文字以上"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">
              パスワード（確認） <span className="text-red-500">*</span>
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="パスワードを再入力"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? "登録中..." : "アカウントを作成"}
          </Button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>
            既にアカウントをお持ちですか？{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              ログイン
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
