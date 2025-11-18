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
        passwordHash: hashedPassword,
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

// Get user profile
export async function getUserProfile(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        createdAt: true,
      },
    })

    if (!user) {
      return { success: false, error: "ユーザーが見つかりません" }
    }

    return { success: true, data: user }
  } catch (error) {
    console.error("Get user profile error:", error)
    return { success: false, error: "ユーザー情報の取得に失敗しました" }
  }
}

// Update username
export async function updateUsername(userId: string, username: string) {
  try {
    if (!username || username.trim().length < 2) {
      return { success: false, error: "ユーザー名は2文字以上である必要があります" }
    }

    // Check if username is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        username: username.trim(),
        NOT: { id: userId },
      },
    })

    if (existingUser) {
      return { success: false, error: "このユーザー名は既に使用されています" }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { username: username.trim() },
    })

    revalidatePath("/settings")

    return {
      success: true,
      data: { username: user.username },
    }
  } catch (error) {
    console.error("Update username error:", error)
    return { success: false, error: "ユーザー名の更新に失敗しました" }
  }
}

// Update email
export async function updateEmail(userId: string, email: string) {
  try {
    if (!email || !email.includes("@")) {
      return { success: false, error: "有効なメールアドレスを入力してください" }
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
        NOT: { id: userId },
      },
    })

    if (existingUser) {
      return { success: false, error: "このメールアドレスは既に使用されています" }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { email: email.toLowerCase().trim() },
    })

    revalidatePath("/settings")

    return {
      success: true,
      data: { email: user.email },
    }
  } catch (error) {
    console.error("Update email error:", error)
    return { success: false, error: "メールアドレスの更新に失敗しました" }
  }
}

// Update password
export async function updatePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  try {
    if (!currentPassword || !newPassword) {
      return { success: false, error: "すべてのフィールドを入力してください" }
    }

    if (newPassword.length < 6) {
      return { success: false, error: "新しいパスワードは6文字以上である必要があります" }
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return { success: false, error: "ユーザーが見つかりません" }
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)

    if (!isPasswordValid) {
      return { success: false, error: "現在のパスワードが正しくありません" }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    })

    return { success: true }
  } catch (error) {
    console.error("Update password error:", error)
    return { success: false, error: "パスワードの更新に失敗しました" }
  }
}

// Update full name
export async function updateFullName(userId: string, fullName: string) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { fullName: fullName.trim() || null },
    })

    revalidatePath("/settings")

    return {
      success: true,
      data: { fullName: user.fullName },
    }
  } catch (error) {
    console.error("Update full name error:", error)
    return { success: false, error: "氏名の更新に失敗しました" }
  }
}
