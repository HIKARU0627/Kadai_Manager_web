"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AddTaskModal } from "@/components/modals/AddTaskModal"
import { Clock, Paperclip, Plus, Search, Edit } from "lucide-react"

// モックデータ
const mockSubjects = [
  { id: "1", name: "数学I", color: "#3B82F6" },
  { id: "2", name: "英語会話", color: "#10B981" },
  { id: "3", name: "プログラミング基礎", color: "#8B5CF6" },
  { id: "4", name: "日本史", color: "#6366F1" },
  { id: "5", name: "物理学", color: "#EC4899" },
]

const mockTasks = [
  {
    id: "1",
    title: "レポート: 微分積分の応用",
    description: "関数の極限と導関数について、具体例を用いてレポートを作成する。最低2000文字以上。",
    subject: "数学I",
    subjectColor: "blue",
    dueDate: "2025/11/17 23:59",
    status: "not_started",
    priority: 2,
    filesCount: 2,
  },
  {
    id: "2",
    title: "課題: 英作文エッセイ",
    description: "テーマ「My Future Career」について、300語以上のエッセイを英語で書く。",
    subject: "英語会話",
    subjectColor: "green",
    dueDate: "2025/11/17 18:00",
    status: "not_started",
    priority: 1,
    filesCount: 0,
  },
  {
    id: "3",
    title: "課題: Pythonプログラム作成",
    description: "ソートアルゴリズム（バブルソート、クイックソート）をPythonで実装し、実行時間を比較する。",
    subject: "プログラミング基礎",
    subjectColor: "purple",
    dueDate: "2025/11/20 23:59",
    status: "not_started",
    priority: 0,
    filesCount: 1,
  },
  {
    id: "4",
    title: "レポート: 江戸時代の経済",
    description: "江戸時代の商業発展について、参考文献を3冊以上用いてレポートを作成する。",
    subject: "日本史",
    subjectColor: "indigo",
    dueDate: "2025/11/25 23:59",
    status: "not_started",
    priority: 0,
    filesCount: 0,
  },
  {
    id: "5",
    title: "実験レポート: 力学実験",
    description: "振り子の周期測定実験の結果をまとめ、理論値との比較を行う。",
    subject: "物理学",
    subjectColor: "pink",
    dueDate: "2025/11/30 17:00",
    status: "not_started",
    priority: 0,
    filesCount: 0,
  },
]

const tabs = [
  { id: "not_started", label: "未着手", count: 5 },
  { id: "in_progress", label: "作業中", count: 3 },
  { id: "completed", label: "完了", count: 12 },
  { id: "all", label: "すべて", count: 20 },
]

const priorityLabels = {
  0: { label: "通常", color: "gray" },
  1: { label: "中優先度", color: "yellow" },
  2: { label: "高優先度", color: "red" },
}

const statusLabels = {
  not_started: "未着手",
  in_progress: "作業中",
  completed: "完了",
}

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState("not_started")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const getPriorityColor = (priority: number) => {
    const colors = {
      0: "border-gray-300",
      1: "border-yellow-500",
      2: "border-red-500",
    }
    return colors[priority as keyof typeof colors] || colors[0]
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

        {/* 検索バー */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="課題名、科目名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
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
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* 課題カードリスト */}
        <div className="space-y-4">
          {mockTasks.map((task) => {
            const priority = priorityLabels[task.priority as keyof typeof priorityLabels]
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
                      <Badge
                        className={`bg-${task.subjectColor}-100 text-${task.subjectColor}-700`}
                      >
                        {task.subject}
                      </Badge>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {task.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3">
                      {task.description}
                    </p>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span
                        className={`flex items-center ${
                          isUrgent ? "text-red-500" : ""
                        }`}
                      >
                        <Clock className="w-4 h-4 mr-1" />
                        締め切り: {task.dueDate}
                        {isUrgent && " (今日)"}
                      </span>
                      {task.filesCount > 0 && (
                        <span className="flex items-center">
                          <Paperclip className="w-4 h-4 mr-1" />
                          {task.filesCount}個のファイル添付
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col items-end">
                    <select className="mb-3 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option value="not_started">未着手</option>
                      <option value="in_progress">作業中</option>
                      <option value="completed">完了</option>
                    </select>
                    <Button variant="link" className="text-blue-600 mb-2">
                      詳細を見る
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-400">
                      <Edit className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* ページネーション */}
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-2">
            <Button variant="outline">前へ</Button>
            <Button className="bg-blue-600">1</Button>
            <Button variant="outline">2</Button>
            <Button variant="outline">3</Button>
            <Button variant="outline">次へ</Button>
          </nav>
        </div>
      </main>

      {/* 課題追加モーダル */}
      <AddTaskModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        subjects={mockSubjects}
        userId="mock-user-id"
      />
    </div>
  )
}
