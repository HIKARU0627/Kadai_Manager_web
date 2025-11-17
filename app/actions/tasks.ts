"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type TaskStatus = "not_started" | "in_progress" | "completed"

export interface CreateTaskInput {
  userId: string
  subjectId?: string
  title: string
  description?: string
  dueDate: Date
  status?: TaskStatus
  priority?: number
}

export interface UpdateTaskInput {
  id: string
  title?: string
  description?: string
  dueDate?: Date
  status?: TaskStatus
  priority?: number
  subjectId?: string
}

// 課題を作成
export async function createTask(input: CreateTaskInput) {
  try {
    const task = await prisma.task.create({
      data: {
        userId: input.userId,
        subjectId: input.subjectId,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
        status: input.status || "not_started",
        priority: input.priority || 0,
      },
      include: {
        subject: true,
      },
    })

    revalidatePath("/tasks")
    revalidatePath("/")

    return { success: true, data: task }
  } catch (error) {
    console.error("Failed to create task:", error)
    return { success: false, error: "課題の作成に失敗しました" }
  }
}

// 課題を更新
export async function updateTask(input: UpdateTaskInput) {
  try {
    const updateData: any = {}

    if (input.title !== undefined) updateData.title = input.title
    if (input.description !== undefined) updateData.description = input.description
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate
    if (input.status !== undefined) {
      updateData.status = input.status
      if (input.status === "completed") {
        updateData.completedAt = new Date()
      }
    }
    if (input.priority !== undefined) updateData.priority = input.priority
    if (input.subjectId !== undefined) updateData.subjectId = input.subjectId

    updateData.updatedAt = new Date()

    const task = await prisma.task.update({
      where: { id: input.id },
      data: updateData,
      include: {
        subject: true,
      },
    })

    revalidatePath("/tasks")
    revalidatePath("/")

    return { success: true, data: task }
  } catch (error) {
    console.error("Failed to update task:", error)
    return { success: false, error: "課題の更新に失敗しました" }
  }
}

// 課題を削除
export async function deleteTask(id: string) {
  try {
    await prisma.task.delete({
      where: { id },
    })

    revalidatePath("/tasks")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Failed to delete task:", error)
    return { success: false, error: "課題の削除に失敗しました" }
  }
}

// 課題を取得（単一）
export async function getTask(id: string) {
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        subject: true,
        files: true,
        reminders: true,
      },
    })

    return { success: true, data: task }
  } catch (error) {
    console.error("Failed to get task:", error)
    return { success: false, error: "課題の取得に失敗しました" }
  }
}

// 課題を取得（一覧）
export async function getTasks(userId: string, filters?: {
  status?: TaskStatus
  subjectId?: string
  search?: string
}) {
  try {
    const where: any = { userId }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.subjectId) {
      where.subjectId = filters.subjectId
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
      ]
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        subject: true,
        files: true,
      },
      orderBy: [
        { priority: "desc" },
        { dueDate: "asc" },
      ],
    })

    return { success: true, data: tasks }
  } catch (error) {
    console.error("Failed to get tasks:", error)
    return { success: false, error: "課題の取得に失敗しました" }
  }
}

// 今日が締め切りの課題を取得
export async function getTodayTasks(userId: string) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const tasks = await prisma.task.findMany({
      where: {
        userId,
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          not: "completed",
        },
      },
      include: {
        subject: true,
      },
      orderBy: {
        dueDate: "asc",
      },
    })

    return { success: true, data: tasks }
  } catch (error) {
    console.error("Failed to get today's tasks:", error)
    return { success: false, error: "今日の課題の取得に失敗しました" }
  }
}
