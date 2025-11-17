import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { createFile } from "@/app/actions/files"

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "認証が必要です" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const taskId = formData.get("taskId") as string | null
    const noteId = formData.get("noteId") as string | null
    const subjectId = formData.get("subjectId") as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: "ファイルが選択されていません" },
        { status: 400 }
      )
    }

    // ファイルサイズチェック (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: "ファイルサイズは10MB以下にしてください" },
        { status: 400 }
      )
    }

    // ファイルを保存
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // アップロードディレクトリを作成
    const uploadDir = join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // ファイル名を生成（タイムスタンプ + オリジナル名）
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const fileName = `${timestamp}_${sanitizedFileName}`
    const filePath = join(uploadDir, fileName)
    const fileUrl = `/uploads/${fileName}`

    // ファイルを書き込み
    await writeFile(filePath, buffer)

    // データベースに保存
    const result = await createFile({
      userId: session.user.id,
      taskId: taskId || undefined,
      noteId: noteId || undefined,
      subjectId: subjectId || undefined,
      fileName: file.name,
      filePath: filePath,
      fileUrl: fileUrl,
      fileType: file.type,
      fileSize: file.size,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.data.id,
        fileName: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
        fileType: file.type,
      },
    })
  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json(
      { success: false, error: "ファイルのアップロードに失敗しました" },
      { status: 500 }
    )
  }
}
