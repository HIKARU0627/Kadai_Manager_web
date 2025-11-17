"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export interface CreateFileInput {
  userId: string
  taskId?: string
  noteId?: string
  subjectId?: string
  fileName: string
  filePath?: string
  fileUrl?: string
  fileType?: string
  fileSize?: number
}

export interface UpdateFileInput {
  id: string
  fileName?: string
  filePath?: string
  fileUrl?: string
}

// ファイルを作成
export async function createFile(input: CreateFileInput) {
  try {
    const file = await prisma.file.create({
      data: {
        userId: input.userId,
        taskId: input.taskId,
        noteId: input.noteId,
        subjectId: input.subjectId,
        fileName: input.fileName,
        filePath: input.filePath,
        fileUrl: input.fileUrl,
        fileType: input.fileType,
        fileSize: input.fileSize,
      },
    })

    // 関連ページを再検証
    if (input.taskId) revalidatePath("/tasks")
    if (input.noteId) revalidatePath("/notes")
    if (input.subjectId) revalidatePath("/subjects")

    return { success: true, data: file }
  } catch (error) {
    console.error("Failed to create file:", error)
    return { success: false, error: "ファイルの作成に失敗しました" }
  }
}

// ファイルを更新
export async function updateFile(input: UpdateFileInput) {
  try {
    const updateData: any = {}

    if (input.fileName !== undefined) updateData.fileName = input.fileName
    if (input.filePath !== undefined) updateData.filePath = input.filePath
    if (input.fileUrl !== undefined) updateData.fileUrl = input.fileUrl

    const file = await prisma.file.update({
      where: { id: input.id },
      data: updateData,
    })

    return { success: true, data: file }
  } catch (error) {
    console.error("Failed to update file:", error)
    return { success: false, error: "ファイルの更新に失敗しました" }
  }
}

// ファイルを削除
export async function deleteFile(id: string) {
  try {
    await prisma.file.delete({
      where: { id },
    })

    revalidatePath("/tasks")
    revalidatePath("/notes")
    revalidatePath("/subjects")

    return { success: true }
  } catch (error) {
    console.error("Failed to delete file:", error)
    return { success: false, error: "ファイルの削除に失敗しました" }
  }
}

// ファイルを取得（単一）
export async function getFile(id: string) {
  try {
    const file = await prisma.file.findUnique({
      where: { id },
    })

    return { success: true, data: file }
  } catch (error) {
    console.error("Failed to get file:", error)
    return { success: false, error: "ファイルの取得に失敗しました" }
  }
}

// ファイルを取得（一覧）
export async function getFiles(userId: string, filters?: {
  taskId?: string
  noteId?: string
  subjectId?: string
}) {
  try {
    const where: any = { userId }

    if (filters?.taskId) where.taskId = filters.taskId
    if (filters?.noteId) where.noteId = filters.noteId
    if (filters?.subjectId) where.subjectId = filters.subjectId

    const files = await prisma.file.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, data: files }
  } catch (error) {
    console.error("Failed to get files:", error)
    return { success: false, error: "ファイルの取得に失敗しました" }
  }
}

// 課題に関連するファイルを取得
export async function getTaskFiles(taskId: string) {
  try {
    const files = await prisma.file.findMany({
      where: { taskId },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, data: files }
  } catch (error) {
    console.error("Failed to get task files:", error)
    return { success: false, error: "課題ファイルの取得に失敗しました" }
  }
}

// メモに関連するファイルを取得
export async function getNoteFiles(noteId: string) {
  try {
    const files = await prisma.file.findMany({
      where: { noteId },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, data: files }
  } catch (error) {
    console.error("Failed to get note files:", error)
    return { success: false, error: "メモファイルの取得に失敗しました" }
  }
}

// 科目に関連するファイルを取得
export async function getSubjectFiles(subjectId: string) {
  try {
    const files = await prisma.file.findMany({
      where: { subjectId },
      orderBy: {
        createdAt: "desc",
      },
    })

    return { success: true, data: files }
  } catch (error) {
    console.error("Failed to get subject files:", error)
    return { success: false, error: "科目ファイルの取得に失敗しました" }
  }
}

// ファイルサイズの合計を取得
export async function getTotalFileSize(userId: string) {
  try {
    const result = await prisma.file.aggregate({
      where: { userId },
      _sum: {
        fileSize: true,
      },
    })

    return { success: true, data: result._sum.fileSize || 0 }
  } catch (error) {
    console.error("Failed to get total file size:", error)
    return { success: false, error: "ファイルサイズの取得に失敗しました" }
  }
}
