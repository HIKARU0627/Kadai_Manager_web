"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export interface CreateSubjectInput {
  userId: string
  name: string
  teacher?: string
  classroom?: string
  dayOfWeek: number // 0=日曜, 1=月曜, ..., 6=土曜
  period: number
  startTime?: string
  endTime?: string
  color?: string
}

export interface UpdateSubjectInput {
  id: string
  name?: string
  teacher?: string
  classroom?: string
  dayOfWeek?: number
  period?: number
  startTime?: string
  endTime?: string
  color?: string
}

// 科目を作成
export async function createSubject(input: CreateSubjectInput) {
  try {
    const subject = await prisma.subject.create({
      data: {
        userId: input.userId,
        name: input.name,
        teacher: input.teacher,
        classroom: input.classroom,
        dayOfWeek: input.dayOfWeek,
        period: input.period,
        startTime: input.startTime,
        endTime: input.endTime,
        color: input.color || "#3B82F6",
      },
    })

    revalidatePath("/subjects")
    revalidatePath("/")

    return { success: true, data: subject }
  } catch (error) {
    console.error("Failed to create subject:", error)
    return { success: false, error: "科目の作成に失敗しました" }
  }
}

// 科目を更新
export async function updateSubject(input: UpdateSubjectInput) {
  try {
    const updateData: any = { updatedAt: new Date() }

    if (input.name !== undefined) updateData.name = input.name
    if (input.teacher !== undefined) updateData.teacher = input.teacher
    if (input.classroom !== undefined) updateData.classroom = input.classroom
    if (input.dayOfWeek !== undefined) updateData.dayOfWeek = input.dayOfWeek
    if (input.period !== undefined) updateData.period = input.period
    if (input.startTime !== undefined) updateData.startTime = input.startTime
    if (input.endTime !== undefined) updateData.endTime = input.endTime
    if (input.color !== undefined) updateData.color = input.color

    const subject = await prisma.subject.update({
      where: { id: input.id },
      data: updateData,
    })

    revalidatePath("/subjects")
    revalidatePath("/")

    return { success: true, data: subject }
  } catch (error) {
    console.error("Failed to update subject:", error)
    return { success: false, error: "科目の更新に失敗しました" }
  }
}

// 科目を削除
export async function deleteSubject(id: string) {
  try {
    await prisma.subject.delete({
      where: { id },
    })

    revalidatePath("/subjects")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Failed to delete subject:", error)
    return { success: false, error: "科目の削除に失敗しました" }
  }
}

// 科目を取得（単一）
export async function getSubject(id: string) {
  try {
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        tasks: true,
        notes: true,
      },
    })

    return { success: true, data: subject }
  } catch (error) {
    console.error("Failed to get subject:", error)
    return { success: false, error: "科目の取得に失敗しました" }
  }
}

// 科目を取得（一覧）
export async function getSubjects(userId: string) {
  try {
    const subjects = await prisma.subject.findMany({
      where: { userId },
      orderBy: [
        { dayOfWeek: "asc" },
        { period: "asc" },
      ],
    })

    return { success: true, data: subjects }
  } catch (error) {
    console.error("Failed to get subjects:", error)
    return { success: false, error: "科目の取得に失敗しました" }
  }
}

// 今日の時間割を取得
export async function getTodaySubjects(userId: string) {
  try {
    const today = new Date()
    const dayOfWeek = today.getDay()

    const subjects = await prisma.subject.findMany({
      where: {
        userId,
        dayOfWeek,
      },
      orderBy: {
        period: "asc",
      },
    })

    return { success: true, data: subjects }
  } catch (error) {
    console.error("Failed to get today's subjects:", error)
    return { success: false, error: "今日の時間割の取得に失敗しました" }
  }
}

// 週間時間割を取得
export async function getWeeklySchedule(userId: string) {
  try {
    const subjects = await prisma.subject.findMany({
      where: { userId },
      orderBy: [
        { dayOfWeek: "asc" },
        { period: "asc" },
      ],
    })

    // 曜日と時限でグループ化
    const schedule: { [key: number]: { [key: number]: any } } = {}

    subjects.forEach((subject) => {
      if (!schedule[subject.dayOfWeek]) {
        schedule[subject.dayOfWeek] = {}
      }
      schedule[subject.dayOfWeek][subject.period] = subject
    })

    return { success: true, data: schedule }
  } catch (error) {
    console.error("Failed to get weekly schedule:", error)
    return { success: false, error: "週間時間割の取得に失敗しました" }
  }
}
