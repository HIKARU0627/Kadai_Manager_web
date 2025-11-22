"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AddTaskModal } from "@/components/modals/AddTaskModal"
import { EditTaskModal } from "@/components/modals/EditTaskModal"
import { TaskDetailModal } from "@/components/modals/TaskDetailModal"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import SemesterSelector from "@/components/SemesterSelector"
import { Clock, Paperclip, Plus, Search, Edit, Trash2 } from "lucide-react"
import { getTasks, updateTask, deleteTask, TaskStatus } from "@/app/actions/tasks"
import { getSubjects } from "@/app/actions/subjects"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

const priorityLabels = {
  0: { label: "通常", color: "gray" },
  1: { label: "中優先度", color: "yellow" },
  2: { label: "高優先度", color: "red" },
}

const statusLabels = {
  not_started: "未着手",
  in_progress: "作業中",
  completed: "完了",
  overdue: "時間切れ",
}

type Task = {
  id: string
  title: string
  description: string | null
  dueDate: Date
  status: string
  priority: number
  subject: { id: string; name: string; color: string } | null
  files: any[]
}

type Subject = {
  id: string
  name: string
  color: string
}

export default function TasksPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<TaskStatus | "all">("not_started")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  // データを取得
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return

      setIsLoading(true)
      try {
        const [tasksResult, subjectsResult] = await Promise.all([
          getTasks(session.user.id, {
            search: searchQuery || undefined,
            semesterId: selectedSemesterId || undefined,
          }),
          getSubjects(session.user.id, selectedSemesterId || undefined),
        ])

        if (tasksResult.success) {
          setTasks(tasksResult.data as Task[])
        }
        if (subjectsResult.success) {
          setSubjects(subjectsResult.data as Subject[])
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [session?.user?.id, searchQuery, selectedSemesterId])

  // データ再取得の共通関数
  const fetchTasksData = async () => {
    if (!session?.user?.id) return

    setIsLoading(true)
    try {
      const [tasksResult, subjectsResult] = await Promise.all([
        getTasks(session.user.id, {
          search: searchQuery || undefined,
          semesterId: selectedSemesterId || undefined,
        }),
        getSubjects(session.user.id, selectedSemesterId || undefined),
      ])

      if (tasksResult.success) {
        setTasks(tasksResult.data as Task[])
      }
      if (subjectsResult.success) {
        setSubjects(subjectsResult.data as Subject[])
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      const result = await updateTask({ id: taskId, status: newStatus })
      if (result.success) {
        // 状態を更新
        setTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, status: newStatus } : task
          )
        )
      }
    } catch (error) {
      console.error("Failed to update task status:", error)
    }
  }

  // 追加モーダル閉じた時にデータを再取得
  const handleAddModalClose = async (open: boolean) => {
    setIsAddModalOpen(open)
    if (!open) {
      await fetchTasksData()
    }
  }

  // 編集モーダル閉じた時にデータを再取得
  const handleEditModalClose = async (open: boolean) => {
    setIsEditModalOpen(open)
    if (!open) {
      await fetchTasksData()
      setSelectedTask(null)
    }
  }

  // 詳細表示ハンドラー
  const handleViewDetail = (task: Task) => {
    setSelectedTask(task)
    setIsDetailModalOpen(true)
  }

  // 編集ボタンのハンドラー
  const handleEdit = (task: Task) => {
    setSelectedTask(task)
    setIsEditModalOpen(true)
  }

  // 削除ボタンのハンドラー
  const handleDeleteClick = (task: Task) => {
    setSelectedTask(task)
    setIsDeleteDialogOpen(true)
  }

  // 削除確認のハンドラー
  const handleDeleteConfirm = async () => {
    if (!selectedTask) return

    setIsDeleting(true)
    const result = await deleteTask(selectedTask.id)

    if (result.success) {
      setIsDeleteDialogOpen(false)
      setSelectedTask(null)
      await fetchTasksData()
    } else {
      alert(result.error || "削除に失敗しました")
    }

    setIsDeleting(false)
  }

  const getPriorityColor = (priority: number) => {
    const colors = {
      0: "border-gray-300",
      1: "border-yellow-500",
      2: "border-red-500",
    }
    return colors[priority as keyof typeof colors] || colors[0]
  }

  // タブのカウントを計算
  const getTabCount = (status: TaskStatus | "all") => {
    if (status === "all") return tasks.length
    return tasks.filter((t) => t.status === status).length
  }

  // 表示する課題をフィルタリング
  const filteredTasks = activeTab === "all"
    ? tasks
    : tasks.filter((t) => t.status === activeTab)

  const tabs = [
    { id: "not_started" as const, label: "未着手" },
    { id: "in_progress" as const, label: "作業中" },
    { id: "completed" as const, label: "完了" },
    { id: "overdue" as const, label: "時間切れ" },
    { id: "all" as const, label: "すべて" },
  ]

  if (!session?.user?.id) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">ログインしてください</p>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        {/* ヘッダー */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">課題一覧</h2>
            <p className="text-gray-600 mt-2">すべての課題を管理</p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            新規課題を追加
          </Button>
        </div>

        {/* 検索バーと学期フィルター */}
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="課題名、科目名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            </div>
            <SemesterSelector
              selectedSemesterId={selectedSemesterId}
              onSemesterChange={setSelectedSemesterId}
            />
          </div>
        </div>

        {/* タブ */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-1 border-b-2 font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 px-2 py-1 rounded-full text-sm ${
                    activeTab === tab.id
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {getTabCount(tab.id)}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* 課題カードリスト */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const priority =
                priorityLabels[task.priority as keyof typeof priorityLabels]
              const isUrgent = task.priority === 2

              return (
                <Card
                  key={task.id}
                  className={`p-6 border-l-4 hover:shadow-lg transition ${getPriorityColor(
                    task.priority
                  )}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <Badge
                          className={`mr-2 ${
                            isUrgent
                              ? "bg-red-100 text-red-700"
                              : priority.color === "yellow"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {priority.label}
                        </Badge>
                        {task.subject && (
                          <Badge
                            style={{
                              backgroundColor: `${task.subject.color}20`,
                              color: task.subject.color,
                            }}
                          >
                            {task.subject.name}
                          </Badge>
                        )}
                      </div>

                      <h3
                        className="text-xl font-semibold text-gray-800 mb-2 cursor-pointer hover:text-blue-600 transition"
                        onClick={() => handleViewDetail(task)}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-gray-600 text-sm mb-3">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span
                          className={`flex items-center ${
                            isUrgent ? "text-red-500" : ""
                          }`}
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          締め切り:{" "}
                          {format(new Date(task.dueDate), "yyyy/MM/dd HH:mm", {
                            locale: ja,
                          })}
                        </span>
                        {task.files && task.files.length > 0 && (
                          <span className="flex items-center">
                            <Paperclip className="w-4 h-4 mr-1" />
                            {task.files.length}個のファイル添付
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ml-6 flex flex-col items-end space-y-2">
                      <select
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task.id, e.target.value as TaskStatus)
                        }
                      >
                        <option value="not_started">未着手</option>
                        <option value="in_progress">作業中</option>
                        <option value="completed">完了</option>
                        <option value="overdue">時間切れ</option>
                      </select>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-blue-600"
                          onClick={() => handleEdit(task)}
                        >
                          <Edit className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-red-600"
                          onClick={() => handleDeleteClick(task)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">課題がありません</p>
          </div>
        )}
      </main>

      {/* 課題追加モーダル */}
      <AddTaskModal
        open={isAddModalOpen}
        onOpenChange={handleAddModalClose}
        subjects={subjects}
        userId={session.user.id}
      />

      {/* 課題編集モーダル */}
      <EditTaskModal
        open={isEditModalOpen}
        onOpenChange={handleEditModalClose}
        subjects={subjects}
        task={selectedTask}
      />

      {/* 課題詳細モーダル */}
      <TaskDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        task={selectedTask}
      />

      {/* 削除確認ダイアログ */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="課題を削除しますか？"
        description={`「${selectedTask?.title || ""}」を削除します。この操作は取り消せません。本当に削除してもよろしいですか？`}
        isDeleting={isDeleting}
      />
    </div>
  )
}
