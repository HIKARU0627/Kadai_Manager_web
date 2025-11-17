"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type NotificationType = "app" | "email" | "push"

export interface CreateReminderInput {
  userId: string
  taskId?: string
  eventId?: string
  noteId?: string
  reminderDatetime: Date
  notificationType?: NotificationType
}

export interface UpdateReminderInput {
  id: string
  reminderDatetime?: Date
  notificationType?: NotificationType
  isSent?: boolean
}

// リマインダーを作成
export async function createReminder(input: CreateReminderInput) {
  try {
    const reminder = await prisma.reminder.create({
      data: {
        userId: input.userId,
        taskId: input.taskId,
        eventId: input.eventId,
        noteId: input.noteId,
        reminderDatetime: input.reminderDatetime,
        notificationType: input.notificationType || "app",
        isSent: false,
      },
      include: {
        task: true,
        event: true,
        note: true,
      },
    })

    return { success: true, data: reminder }
  } catch (error) {
    console.error("Failed to create reminder:", error)
    return { success: false, error: "リマインダーの作成に失敗しました" }
  }
}

// リマインダーを更新
export async function updateReminder(input: UpdateReminderInput) {
  try {
    const updateData: any = {}

    if (input.reminderDatetime !== undefined) {
      updateData.reminderDatetime = input.reminderDatetime
    }
    if (input.notificationType !== undefined) {
      updateData.notificationType = input.notificationType
    }
    if (input.isSent !== undefined) {
      updateData.isSent = input.isSent
    }

    const reminder = await prisma.reminder.update({
      where: { id: input.id },
      data: updateData,
      include: {
        task: true,
        event: true,
        note: true,
      },
    })

    return { success: true, data: reminder }
  } catch (error) {
    console.error("Failed to update reminder:", error)
    return { success: false, error: "リマインダーの更新に失敗しました" }
  }
}

// リマインダーを削除
export async function deleteReminder(id: string) {
  try {
    await prisma.reminder.delete({
      where: { id },
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to delete reminder:", error)
    return { success: false, error: "リマインダーの削除に失敗しました" }
  }
}

// リマインダーを取得（単一）
export async function getReminder(id: string) {
  try {
    const reminder = await prisma.reminder.findUnique({
      where: { id },
      include: {
        task: true,
        event: true,
        note: true,
      },
    })

    return { success: true, data: reminder }
  } catch (error) {
    console.error("Failed to get reminder:", error)
    return { success: false, error: "リマインダーの取得に失敗しました" }
  }
}

// リマインダーを取得（一覧）
export async function getReminders(userId: string, filters?: {
  isSent?: boolean
  taskId?: string
  eventId?: string
  noteId?: string
}) {
  try {
    const where: any = { userId }

    if (filters?.isSent !== undefined) {
      where.isSent = filters.isSent
    }
    if (filters?.taskId) where.taskId = filters.taskId
    if (filters?.eventId) where.eventId = filters.eventId
    if (filters?.noteId) where.noteId = filters.noteId

    const reminders = await prisma.reminder.findMany({
      where,
      include: {
        task: true,
        event: true,
        note: true,
      },
      orderBy: {
        reminderDatetime: "asc",
      },
    })

    return { success: true, data: reminders }
  } catch (error) {
    console.error("Failed to get reminders:", error)
    return { success: false, error: "リマインダーの取得に失敗しました" }
  }
}

// 未送信のリマインダーを取得
export async function getPendingReminders(userId: string) {
  try {
    const now = new Date()

    const reminders = await prisma.reminder.findMany({
      where: {
        userId,
        isSent: false,
        reminderDatetime: {
          lte: now,
        },
      },
      include: {
        task: true,
        event: true,
        note: true,
      },
      orderBy: {
        reminderDatetime: "asc",
      },
    })

    return { success: true, data: reminders }
  } catch (error) {
    console.error("Failed to get pending reminders:", error)
    return { success: false, error: "未送信リマインダーの取得に失敗しました" }
  }
}

// 今後のリマインダーを取得
export async function getUpcomingReminders(userId: string, days: number = 7) {
  try {
    const now = new Date()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    const reminders = await prisma.reminder.findMany({
      where: {
        userId,
        isSent: false,
        reminderDatetime: {
          gte: now,
          lte: futureDate,
        },
      },
      include: {
        task: true,
        event: true,
        note: true,
      },
      orderBy: {
        reminderDatetime: "asc",
      },
    })

    return { success: true, data: reminders }
  } catch (error) {
    console.error("Failed to get upcoming reminders:", error)
    return { success: false, error: "今後のリマインダーの取得に失敗しました" }
  }
}

// リマインダーを送信済みにマーク
export async function markReminderAsSent(id: string) {
  try {
    const reminder = await prisma.reminder.update({
      where: { id },
      data: { isSent: true },
    })

    return { success: true, data: reminder }
  } catch (error) {
    console.error("Failed to mark reminder as sent:", error)
    return { success: false, error: "リマインダーの更新に失敗しました" }
  }
}

// 課題用のデフォルトリマインダーを作成
export async function createTaskReminders(userId: string, taskId: string, dueDate: Date) {
  try {
    const reminders = []

    // 1日前のリマインダー
    const oneDayBefore = new Date(dueDate)
    oneDayBefore.setDate(oneDayBefore.getDate() - 1)
    oneDayBefore.setHours(9, 0, 0, 0)

    reminders.push(
      await prisma.reminder.create({
        data: {
          userId,
          taskId,
          reminderDatetime: oneDayBefore,
          notificationType: "app",
        },
      })
    )

    // 当日朝のリマインダー
    const sameDayMorning = new Date(dueDate)
    sameDayMorning.setHours(9, 0, 0, 0)

    if (sameDayMorning < dueDate) {
      reminders.push(
        await prisma.reminder.create({
          data: {
            userId,
            taskId,
            reminderDatetime: sameDayMorning,
            notificationType: "app",
          },
        })
      )
    }

    return { success: true, data: reminders }
  } catch (error) {
    console.error("Failed to create task reminders:", error)
    return { success: false, error: "課題リマインダーの作成に失敗しました" }
  }
}
