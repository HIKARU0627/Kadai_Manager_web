"use server"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export type EventTypeConfig = {
  id: string
  name: string
  color: string
  requiresSubject: boolean
  isDefault: boolean
  order: number
}

// ユーザーのイベントタイプ設定を取得
export async function getUserEventTypes(): Promise<EventTypeConfig[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("認証が必要です")
  }

  try {
    const eventTypes = await prisma.eventTypeConfig.findMany({
      where: { userId: session.user.id },
      orderBy: { order: "asc" },
    })

    // イベントタイプが存在しない場合はデフォルトを作成
    if (eventTypes.length === 0) {
      return await initializeDefaultEventTypes(session.user.id)
    }

    return eventTypes.map((et) => ({
      id: et.id,
      name: et.name,
      color: et.color,
      requiresSubject: et.requiresSubject,
      isDefault: et.isDefault,
      order: et.order,
    }))
  } catch (error) {
    console.error("Failed to fetch event types:", error)
    throw new Error("イベントタイプの取得に失敗しました")
  }
}

// デフォルトのイベントタイプを初期化
async function initializeDefaultEventTypes(userId: string): Promise<EventTypeConfig[]> {
  const defaultTypes = [
    {
      id: `${userId}_event`,
      userId,
      name: "予定",
      color: "#10B981",
      requiresSubject: false,
      isDefault: true,
      order: 0,
    },
    {
      id: `${userId}_test`,
      userId,
      name: "テスト",
      color: "#8B5CF6",
      requiresSubject: true,
      isDefault: true,
      order: 1,
    },
  ]

  await prisma.eventTypeConfig.createMany({
    data: defaultTypes,
  })

  return defaultTypes.map((et) => ({
    id: et.id,
    name: et.name,
    color: et.color,
    requiresSubject: et.requiresSubject,
    isDefault: et.isDefault,
    order: et.order,
  }))
}

// イベントタイプを取得（IDで検索）
export async function getEventTypeById(id: string): Promise<EventTypeConfig | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error("認証が必要です")
  }

  try {
    const eventType = await prisma.eventTypeConfig.findUnique({
      where: {
        userId_id: {
          userId: session.user.id,
          id,
        },
      },
    })

    if (!eventType) {
      return null
    }

    return {
      id: eventType.id,
      name: eventType.name,
      color: eventType.color,
      requiresSubject: eventType.requiresSubject,
      isDefault: eventType.isDefault,
      order: eventType.order,
    }
  } catch (error) {
    console.error("Failed to fetch event type:", error)
    return null
  }
}

// カスタムイベントタイプを追加
export async function createEventType(data: {
  name: string
  color: string
  requiresSubject: boolean
}): Promise<{ success: boolean; eventType?: EventTypeConfig; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { success: false, error: "認証が必要です" }
  }

  try {
    // 既存のイベントタイプの最大orderを取得
    const maxOrder = await prisma.eventTypeConfig.aggregate({
      where: { userId: session.user.id },
      _max: { order: true },
    })

    const newOrder = (maxOrder._max.order ?? -1) + 1

    // ユニークなIDを生成（ユーザーIDとタイムスタンプ）
    const id = `${session.user.id}_${Date.now()}`

    const eventType = await prisma.eventTypeConfig.create({
      data: {
        id,
        userId: session.user.id,
        name: data.name,
        color: data.color,
        requiresSubject: data.requiresSubject,
        isDefault: false,
        order: newOrder,
      },
    })

    return {
      success: true,
      eventType: {
        id: eventType.id,
        name: eventType.name,
        color: eventType.color,
        requiresSubject: eventType.requiresSubject,
        isDefault: eventType.isDefault,
        order: eventType.order,
      },
    }
  } catch (error) {
    console.error("Failed to create event type:", error)
    return { success: false, error: "イベントタイプの作成に失敗しました" }
  }
}

// イベントタイプを更新
export async function updateEventType(
  id: string,
  data: {
    name?: string
    color?: string
    requiresSubject?: boolean
  }
): Promise<{ success: boolean; eventType?: EventTypeConfig; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { success: false, error: "認証が必要です" }
  }

  try {
    // デフォルトの項目かチェック
    const existing = await prisma.eventTypeConfig.findUnique({
      where: {
        userId_id: {
          userId: session.user.id,
          id,
        },
      },
    })

    if (!existing) {
      return { success: false, error: "イベントタイプが見つかりません" }
    }

    if (existing.isDefault) {
      return { success: false, error: "デフォルトのイベントタイプは編集できません" }
    }

    const eventType = await prisma.eventTypeConfig.update({
      where: {
        userId_id: {
          userId: session.user.id,
          id,
        },
      },
      data: {
        name: data.name,
        color: data.color,
        requiresSubject: data.requiresSubject,
      },
    })

    return {
      success: true,
      eventType: {
        id: eventType.id,
        name: eventType.name,
        color: eventType.color,
        requiresSubject: eventType.requiresSubject,
        isDefault: eventType.isDefault,
        order: eventType.order,
      },
    }
  } catch (error) {
    console.error("Failed to update event type:", error)
    return { success: false, error: "イベントタイプの更新に失敗しました" }
  }
}

// イベントタイプを削除
export async function deleteEventType(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { success: false, error: "認証が必要です" }
  }

  try {
    // デフォルトの項目かチェック
    const existing = await prisma.eventTypeConfig.findUnique({
      where: {
        userId_id: {
          userId: session.user.id,
          id,
        },
      },
    })

    if (!existing) {
      return { success: false, error: "イベントタイプが見つかりません" }
    }

    if (existing.isDefault) {
      return { success: false, error: "デフォルトのイベントタイプは削除できません" }
    }

    await prisma.eventTypeConfig.delete({
      where: {
        userId_id: {
          userId: session.user.id,
          id,
        },
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to delete event type:", error)
    return { success: false, error: "イベントタイプの削除に失敗しました" }
  }
}

// イベントタイプの順序を更新
export async function reorderEventTypes(
  eventTypeIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { success: false, error: "認証が必要です" }
  }

  try {
    // トランザクション内で順序を更新
    await prisma.$transaction(
      eventTypeIds.map((id, index) =>
        prisma.eventTypeConfig.update({
          where: {
            userId_id: {
              userId: session.user.id,
              id,
            },
          },
          data: { order: index },
        })
      )
    )

    return { success: true }
  } catch (error) {
    console.error("Failed to reorder event types:", error)
    return { success: false, error: "イベントタイプの順序更新に失敗しました" }
  }
}
