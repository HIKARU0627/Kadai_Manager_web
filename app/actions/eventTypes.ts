"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export interface EventType {
  id: string
  userId: string
  name: string
  value: string
  color: string
  isDefault: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateEventTypeInput {
  userId: string
  name: string
  color?: string
  order?: number
}

export interface UpdateEventTypeInput {
  id: string
  name?: string
  color?: string
  order?: number
}

// イベントタイプを作成
export async function createEventType(input: CreateEventTypeInput) {
  try {
    // 内部値を自動生成（ユニークなID）
    const value = crypto.randomUUID()

    const eventType = await prisma.eventType.create({
      data: {
        userId: input.userId,
        name: input.name,
        value: value,
        color: input.color || "#10B981",
        order: input.order ?? 999,
      },
    })

    revalidatePath("/settings")
    revalidatePath("/calendar")

    return { success: true, data: eventType }
  } catch (error) {
    console.error("Failed to create event type:", error)
    return { success: false, error: "イベントタイプの作成に失敗しました" }
  }
}

// イベントタイプを更新
export async function updateEventType(input: UpdateEventTypeInput) {
  try {
    const updateData: any = { updatedAt: new Date() }

    if (input.name !== undefined) updateData.name = input.name
    if (input.color !== undefined) updateData.color = input.color
    if (input.order !== undefined) updateData.order = input.order

    const updated = await prisma.eventType.update({
      where: { id: input.id },
      data: updateData,
    })

    revalidatePath("/settings")
    revalidatePath("/calendar")

    return { success: true, data: updated }
  } catch (error) {
    console.error("Failed to update event type:", error)
    return { success: false, error: "イベントタイプの更新に失敗しました" }
  }
}

// イベントタイプを削除
export async function deleteEventType(id: string) {
  try {
    // 削除前にデフォルトタイプかどうかチェック
    const eventType = await prisma.eventType.findUnique({
      where: { id },
    })

    if (!eventType) {
      return { success: false, error: "イベントタイプが見つかりません" }
    }

    if (eventType.isDefault) {
      return { success: false, error: "デフォルトのイベントタイプは削除できません" }
    }

    // このタイプを使用しているイベントがあるかチェック
    const eventsWithType = await prisma.event.count({
      where: {
        userId: eventType.userId,
        eventType: eventType.value,
      },
    })

    if (eventsWithType > 0) {
      return {
        success: false,
        error: `このイベントタイプを使用している予定が${eventsWithType}件あります。先に予定のタイプを変更してください。`
      }
    }

    await prisma.eventType.delete({
      where: { id },
    })

    revalidatePath("/settings")
    revalidatePath("/calendar")

    return { success: true }
  } catch (error) {
    console.error("Failed to delete event type:", error)
    return { success: false, error: "イベントタイプの削除に失敗しました" }
  }
}

// イベントタイプを取得（一覧）
export async function getEventTypes(userId: string) {
  try {
    let eventTypes = await prisma.eventType.findMany({
      where: { userId },
      orderBy: [
        { order: "asc" },
        { createdAt: "asc" },
      ],
    })

    // イベントタイプが存在しない場合、デフォルトのイベントタイプを自動初期化
    if (eventTypes.length === 0) {
      console.log(`No event types found for user ${userId}, initializing defaults...`)
      const initResult = await initializeDefaultEventTypes(userId)
      if (initResult.success) {
        // 再度取得
        eventTypes = await prisma.eventType.findMany({
          where: { userId },
          orderBy: [
            { order: "asc" },
            { createdAt: "asc" },
          ],
        })
      }
    }

    return { success: true, data: eventTypes }
  } catch (error) {
    console.error("Failed to get event types:", error)
    return { success: false, error: "イベントタイプの取得に失敗しました" }
  }
}

// デフォルトのイベントタイプを初期化（ユーザー登録時などに実行）
export async function initializeDefaultEventTypes(userId: string) {
  try {
    // 既にイベントタイプが存在するかチェック
    const existing = await prisma.eventType.count({
      where: { userId },
    })

    if (existing > 0) {
      return { success: true, message: "既にイベントタイプが存在します" }
    }

    // デフォルトのイベントタイプを作成
    await prisma.eventType.createMany({
      data: [
        {
          userId,
          name: "予定",
          value: "event",
          color: "#10B981",
          isDefault: true,
          order: 0,
        },
        {
          userId,
          name: "テスト",
          value: "test",
          color: "#EF4444",
          isDefault: true,
          order: 1,
        },
      ],
    })

    revalidatePath("/settings")
    revalidatePath("/calendar")

    return { success: true, message: "デフォルトのイベントタイプを作成しました" }
  } catch (error) {
    console.error("Failed to initialize default event types:", error)
    return { success: false, error: "デフォルトイベントタイプの初期化に失敗しました" }
  }
}
