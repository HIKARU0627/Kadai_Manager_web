"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export interface CreatePeriodInput {
  userId: string
  periodNumber: number
  startTime: string
  endTime: string
}

export interface UpdatePeriodInput {
  id: string
  startTime?: string
  endTime?: string
}

// デフォルトの時限設定
const DEFAULT_PERIODS = [
  { periodNumber: 1, startTime: "09:00", endTime: "10:30" },
  { periodNumber: 2, startTime: "10:40", endTime: "12:10" },
  { periodNumber: 3, startTime: "13:00", endTime: "14:30" },
  { periodNumber: 4, startTime: "14:40", endTime: "16:10" },
  { periodNumber: 5, startTime: "16:20", endTime: "17:50" },
]

// 時限を作成
export async function createPeriod(input: CreatePeriodInput) {
  try {
    const period = await prisma.period.create({
      data: {
        userId: input.userId,
        periodNumber: input.periodNumber,
        startTime: input.startTime,
        endTime: input.endTime,
      },
    })

    revalidatePath("/settings")
    revalidatePath("/subjects")

    return { success: true, data: period }
  } catch (error) {
    console.error("Failed to create period:", error)
    return { success: false, error: "時限の作成に失敗しました" }
  }
}

// 時限を更新
export async function updatePeriod(input: UpdatePeriodInput) {
  try {
    const updateData: any = {}

    if (input.startTime !== undefined) updateData.startTime = input.startTime
    if (input.endTime !== undefined) updateData.endTime = input.endTime

    const period = await prisma.period.update({
      where: { id: input.id },
      data: updateData,
    })

    revalidatePath("/settings")
    revalidatePath("/subjects")

    return { success: true, data: period }
  } catch (error) {
    console.error("Failed to update period:", error)
    return { success: false, error: "時限の更新に失敗しました" }
  }
}

// 時限を削除
export async function deletePeriod(id: string) {
  try {
    await prisma.period.delete({
      where: { id },
    })

    revalidatePath("/settings")
    revalidatePath("/subjects")

    return { success: true }
  } catch (error) {
    console.error("Failed to delete period:", error)
    return { success: false, error: "時限の削除に失敗しました" }
  }
}

// 時限を取得（一覧）
export async function getPeriods(userId: string) {
  try {
    const periods = await prisma.period.findMany({
      where: { userId },
      orderBy: { periodNumber: "asc" },
    })

    return periods
  } catch (error) {
    console.error("Failed to get periods:", error)
    return []
  }
}

// ユーザーの時限設定を初期化（デフォルト値で）
export async function initializeDefaultPeriods(userId: string) {
  try {
    // 既存の時限設定があるかチェック
    const existingPeriods = await prisma.period.findMany({
      where: { userId },
    })

    if (existingPeriods.length > 0) {
      return { success: true, message: "既に時限設定が存在します" }
    }

    // デフォルトの時限を作成
    const periods = await prisma.period.createMany({
      data: DEFAULT_PERIODS.map((p) => ({
        userId,
        periodNumber: p.periodNumber,
        startTime: p.startTime,
        endTime: p.endTime,
      })),
    })

    revalidatePath("/settings")
    revalidatePath("/subjects")

    return { success: true, data: periods }
  } catch (error) {
    console.error("Failed to initialize default periods:", error)
    return { success: false, error: "デフォルト時限の初期化に失敗しました" }
  }
}

// 時限番号から時限情報を取得
export async function getPeriodByNumber(userId: string, periodNumber: number) {
  try {
    const period = await prisma.period.findUnique({
      where: {
        userId_periodNumber: {
          userId,
          periodNumber,
        },
      },
    })

    return period
  } catch (error) {
    console.error("Failed to get period:", error)
    return null
  }
}
