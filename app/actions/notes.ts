"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type NoteType = "general" | "announcement"

export interface CreateNoteInput {
  userId: string
  subjectId: string
  title?: string
  content: string
  noteType?: NoteType
}

export interface UpdateNoteInput {
  id: string
  title?: string
  content?: string
  noteType?: NoteType
  subjectId?: string
}

// メモを作成
export async function createNote(input: CreateNoteInput) {
  try {
    const note = await prisma.note.create({
      data: {
        userId: input.userId,
        subjectId: input.subjectId,
        title: input.title,
        content: input.content,
        noteType: input.noteType || "general",
      },
      include: {
        subject: true,
      },
    })

    revalidatePath("/notes")

    return { success: true, data: note }
  } catch (error) {
    console.error("Failed to create note:", error)
    return { success: false, error: "メモの作成に失敗しました" }
  }
}

// メモを更新
export async function updateNote(input: UpdateNoteInput) {
  try {
    const updateData: any = { updatedAt: new Date() }

    if (input.title !== undefined) updateData.title = input.title
    if (input.content !== undefined) updateData.content = input.content
    if (input.noteType !== undefined) updateData.noteType = input.noteType
    if (input.subjectId !== undefined) updateData.subjectId = input.subjectId

    const note = await prisma.note.update({
      where: { id: input.id },
      data: updateData,
      include: {
        subject: true,
      },
    })

    revalidatePath("/notes")

    return { success: true, data: note }
  } catch (error) {
    console.error("Failed to update note:", error)
    return { success: false, error: "メモの更新に失敗しました" }
  }
}

// メモを削除
export async function deleteNote(id: string) {
  try {
    await prisma.note.delete({
      where: { id },
    })

    revalidatePath("/notes")

    return { success: true }
  } catch (error) {
    console.error("Failed to delete note:", error)
    return { success: false, error: "メモの削除に失敗しました" }
  }
}

// メモを取得（単一）
export async function getNote(id: string) {
  try {
    const note = await prisma.note.findUnique({
      where: { id },
      include: {
        subject: true,
        files: true,
      },
    })

    return { success: true, data: note }
  } catch (error) {
    console.error("Failed to get note:", error)
    return { success: false, error: "メモの取得に失敗しました" }
  }
}

// メモを取得（一覧）
export async function getNotes(userId: string, filters?: {
  subjectId?: string
  semesterId?: string
  noteType?: NoteType
  search?: string
}) {
  try {
    const where: any = { userId }

    if (filters?.subjectId) {
      where.subjectId = filters.subjectId
    }

    // Filter by semester through subject relation
    if (filters?.semesterId) {
      where.subject = {
        semesterId: filters.semesterId
      }
    }

    if (filters?.noteType) {
      where.noteType = filters.noteType
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { content: { contains: filters.search } },
      ]
    }

    const notes = await prisma.note.findMany({
      where,
      include: {
        subject: true,
        files: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, data: notes }
  } catch (error) {
    console.error("Failed to get notes:", error)
    return { success: false, error: "メモの取得に失敗しました" }
  }
}

// 小テスト日程を取得
export async function getUpcomingQuizzes(userId: string) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const notes = await prisma.note.findMany({
      where: {
        userId,
        noteType: "quiz",
        quizDate: {
          gte: today,
        },
      },
      include: {
        subject: true,
      },
      orderBy: {
        quizDate: "asc",
      },
    })

    return { success: true, data: notes }
  } catch (error) {
    console.error("Failed to get upcoming quizzes:", error)
    return { success: false, error: "小テスト日程の取得に失敗しました" }
  }
}

// 科目別メモ数を取得
export async function getNoteCountBySubject(userId: string) {
  try {
    const notes = await prisma.note.findMany({
      where: { userId },
      select: {
        subjectId: true,
        subject: {
          select: {
            name: true,
            color: true,
          },
        },
      },
    })

    // 科目別にカウント
    const countBySubject: { [key: string]: { name: string; color: string; count: number } } = {}

    notes.forEach((note) => {
      const subjectId = note.subjectId
      if (!countBySubject[subjectId]) {
        countBySubject[subjectId] = {
          name: note.subject.name,
          color: note.subject.color,
          count: 0,
        }
      }
      countBySubject[subjectId].count++
    })

    return { success: true, data: countBySubject }
  } catch (error) {
    console.error("Failed to get note count by subject:", error)
    return { success: false, error: "科目別メモ数の取得に失敗しました" }
  }
}
