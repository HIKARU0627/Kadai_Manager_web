"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export interface CreateEventInput {
  userId: string
  title: string
  description?: string
  eventType?: string
  subjectId?: string
  startDatetime: Date
  endDatetime: Date
  location?: string
  color?: string
}

export interface UpdateEventInput {
  id: string
  title?: string
  description?: string
  eventType?: string
  subjectId?: string
  startDatetime?: Date
  endDatetime?: Date
  location?: string
  color?: string
}

// 予定を作成
export async function createEvent(input: CreateEventInput) {
  try {
    const event = await prisma.event.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description,
        eventType: input.eventType || "event",
        subjectId: input.subjectId,
        startDatetime: input.startDatetime,
        endDatetime: input.endDatetime,
        location: input.location,
        color: input.color || "#10B981",
      },
    })

    revalidatePath("/calendar")
    revalidatePath("/subjects")
    revalidatePath("/")

    return { success: true, data: event }
  } catch (error) {
    console.error("Failed to create event:", error)
    return { success: false, error: "予定の作成に失敗しました" }
  }
}

// 予定を更新
export async function updateEvent(input: UpdateEventInput) {
  try {
    const updateData: any = { updatedAt: new Date() }

    if (input.title !== undefined) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description
    if (input.eventType !== undefined) updateData.eventType = input.eventType
    if (input.subjectId !== undefined) updateData.subjectId = input.subjectId
    if (input.startDatetime !== undefined) updateData.startDatetime = input.startDatetime
    if (input.endDatetime !== undefined) updateData.endDatetime = input.endDatetime
    if (input.location !== undefined) updateData.location = input.location
    if (input.color !== undefined) updateData.color = input.color

    const event = await prisma.event.update({
      where: { id: input.id },
      data: updateData,
    })

    revalidatePath("/calendar")
    revalidatePath("/subjects")
    revalidatePath("/")

    return { success: true, data: event }
  } catch (error) {
    console.error("Failed to update event:", error)
    return { success: false, error: "予定の更新に失敗しました" }
  }
}

// 予定を削除
export async function deleteEvent(id: string) {
  try {
    await prisma.event.delete({
      where: { id },
    })

    revalidatePath("/calendar")
    revalidatePath("/subjects")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Failed to delete event:", error)
    return { success: false, error: "予定の削除に失敗しました" }
  }
}

// 予定を取得（単一）
export async function getEvent(id: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        reminders: true,
      },
    })

    return { success: true, data: event }
  } catch (error) {
    console.error("Failed to get event:", error)
    return { success: false, error: "予定の取得に失敗しました" }
  }
}

// 予定を取得（一覧）
export async function getEvents(userId: string, filters?: {
  startDate?: Date
  endDate?: Date
}) {
  try {
    const where: any = { userId }

    if (filters?.startDate && filters?.endDate) {
      where.startDatetime = {
        gte: filters.startDate,
        lte: filters.endDate,
      }
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: {
        startDatetime: "asc",
      },
    })

    return { success: true, data: events }
  } catch (error) {
    console.error("Failed to get events:", error)
    return { success: false, error: "予定の取得に失敗しました" }
  }
}

// 今日の予定を取得
export async function getTodayEvents(userId: string) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const events = await prisma.event.findMany({
      where: {
        userId,
        startDatetime: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: {
        startDatetime: "asc",
      },
    })

    return { success: true, data: events }
  } catch (error) {
    console.error("Failed to get today's events:", error)
    return { success: false, error: "今日の予定の取得に失敗しました" }
  }
}

// 月間の予定を取得
export async function getMonthlyEvents(userId: string, year: number, month: number) {
  try {
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)

    const events = await prisma.event.findMany({
      where: {
        userId,
        startDatetime: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        startDatetime: "asc",
      },
    })

    return { success: true, data: events }
  } catch (error) {
    console.error("Failed to get monthly events:", error)
    return { success: false, error: "月間予定の取得に失敗しました" }
  }
}
