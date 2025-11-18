import { Sidebar } from "@/components/layout/Sidebar"
import { FileManagerContent } from "@/components/files/FileManagerContent"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { getFiles, getTotalFileSize } from "@/app/actions/files"
import { getTasks } from "@/app/actions/tasks"
import { getNotes } from "@/app/actions/notes"
import { getSubjects } from "@/app/actions/subjects"

export default async function FilesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  // データを取得
  const [filesResult, totalSizeResult, tasksResult, notesResult, subjectsResult] = await Promise.all([
    getFiles(session.user.id),
    getTotalFileSize(session.user.id),
    getTasks(session.user.id),
    getNotes(session.user.id),
    getSubjects(session.user.id),
  ])

  const files = filesResult.success ? filesResult.data : []
  const totalSize = totalSizeResult.success ? totalSizeResult.data : 0
  const tasks = tasksResult.success ? tasksResult.data : []
  const notes = notesResult.success ? notesResult.data : []
  const subjects = subjectsResult.success ? subjectsResult.data : []

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <FileManagerContent
          initialFiles={files}
          totalSize={totalSize}
          tasks={tasks}
          notes={notes}
          subjects={subjects}
          userId={session.user.id}
        />
      </main>
    </div>
  )
}
