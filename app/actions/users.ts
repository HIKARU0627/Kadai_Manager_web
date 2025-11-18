"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

interface RegisterUserInput {
  username: string
  email: string
  password: string
}

export async function registerUser(data: RegisterUserInput) {
  try {
    // Validate input
    if (!data.username || data.username.trim().length < 2) {
      return { success: false, error: "ユーザー名は2文字以上である必要があります" }
    }

    if (!data.email || !data.email.includes("@")) {
      return { success: false, error: "有効なメールアドレスを入力してください" }
    }

    if (!data.password || data.password.length < 6) {
      return { success: false, error: "パスワードは6文字以上である必要があります" }
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (existingUser) {
      return { success: false, error: "このメールアドレスは既に登録されています" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        username: data.username.trim(),
        email: data.email.toLowerCase().trim(),
        password: hashedPassword,
      },
    })

    revalidatePath("/login")

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    }
  } catch (error) {
    console.error("User registration error:", error)
    return { success: false, error: "ユーザー登録に失敗しました" }
  }
}
