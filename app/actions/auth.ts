"use server"

import { prisma } from "@/lib/prisma"
import { hash } from "bcryptjs"
import { initializeDefaultEventTypes } from "./eventTypes"

export interface RegisterUserInput {
  username: string
  email: string
  password: string
  fullName?: string
}

// ユーザー登録
export async function registerUser(input: RegisterUserInput) {
  try {
    // メールアドレスの重複チェック
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    })

    if (existingUser) {
      return { success: false, error: "このメールアドレスは既に登録されています" }
    }

    // ユーザー名の重複チェック
    const existingUsername = await prisma.user.findUnique({
      where: { username: input.username },
    })

    if (existingUsername) {
      return { success: false, error: "このユーザー名は既に使用されています" }
    }

    // パスワードのハッシュ化
    const passwordHash = await hash(input.password, 12)

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash,
        fullName: input.fullName,
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
    })

    // デフォルトのEventTypeを初期化
    await initializeDefaultEventTypes(user.id)

    return { success: true, data: user }
  } catch (error) {
    console.error("Failed to register user:", error)
    return { success: false, error: "ユーザー登録に失敗しました" }
  }
}

// テストユーザー作成（開発用）
export async function createTestUser() {
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    })

    if (existingUser) {
      return { success: true, message: "テストユーザーは既に存在します" }
    }

    const passwordHash = await hash("password123", 12)

    const user = await prisma.user.create({
      data: {
        username: "testuser",
        email: "test@example.com",
        passwordHash,
        fullName: "テストユーザー",
      },
    })

    return { success: true, data: user }
  } catch (error) {
    console.error("Failed to create test user:", error)
    return { success: false, error: "テストユーザーの作成に失敗しました" }
  }
}
