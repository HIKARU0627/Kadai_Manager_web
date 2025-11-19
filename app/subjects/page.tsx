"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AddSubjectModal } from "@/components/modals/AddSubjectModal"
import { EditSubjectModal } from "@/components/modals/EditSubjectModal"
import { SubjectDetailModal } from "@/components/modals/SubjectDetailModal"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import SemesterSelector from "@/components/SemesterSelector"
import SemesterManagementModal from "@/components/modals/SemesterManagementModal"
import { Plus, Clock, MapPin, User, FileText } from "lucide-react"
import { getWeeklySchedule, getSubjects, deleteSubject } from "@/app/actions/subjects"

const weekDays = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日"]
const periods = [
  { period: 1, startTime: "09:00", endTime: "10:30" },
  { period: 2, startTime: "10:40", endTime: "12:10" },
  { period: 3, startTime: "13:00", endTime: "14:30" },
  { period: 4, startTime: "14:40", endTime: "16:10" },
  { period: 5, startTime: "16:20", endTime: "17:50" },
]

interface Subject {
  id: string
  semesterId: string | null
  name: string
  teacher: string | null
  classroom: string | null
  color: string
  dayOfWeek: number
  period: number
  startTime: string | null
  endTime: string | null
}

export default function SubjectsPage() {
  const { data: session } = useSession()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSemesterManagementOpen, setIsSemesterManagementOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null)
  const [schedule, setSchedule] = useState<{ [key: number]: { [key: number]: Subject } }>({})
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  // データの取得
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return

      setIsLoading(true)
      const [scheduleResult, subjectsResult] = await Promise.all([
        getWeeklySchedule(session.user.id, selectedSemesterId || undefined),
        getSubjects(session.user.id, selectedSemesterId || undefined),
      ])

      if (scheduleResult.success) {
        setSchedule(scheduleResult.data)
      }

      if (subjectsResult.success) {
        setSubjects(subjectsResult.data)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [session?.user?.id, selectedSemesterId])

  // 重複を除いた科目リスト
  const uniqueSubjects = subjects.filter(
    (subject, index, self) =>
      index === self.findIndex((s) => s.name === subject.name)
  )

  // データ再取得の共通関数
  const fetchScheduleData = async () => {
    if (!session?.user?.id) return

    const [scheduleResult, subjectsResult] = await Promise.all([
      getWeeklySchedule(session.user.id, selectedSemesterId || undefined),
      getSubjects(session.user.id, selectedSemesterId || undefined),
    ])

    if (scheduleResult.success) {
      setSchedule(scheduleResult.data)
    }

    if (subjectsResult.success) {
      setSubjects(subjectsResult.data)
    }
  }

  // 追加モーダル閉じた時にデータを再取得
  const handleAddModalClose = async (open: boolean) => {
    setIsAddModalOpen(open)
    if (!open) {
      await fetchScheduleData()
    }
  }

  // 編集モーダル閉じた時にデータを再取得
  const handleEditModalClose = async (open: boolean) => {
    setIsEditModalOpen(open)
    if (!open) {
      await fetchScheduleData()
      setSelectedSubject(null)
    }
  }

  // 詳細表示のハンドラー
  const handleViewDetail = (subject: Subject) => {
    setSelectedSubject(subject)
    setIsDetailModalOpen(true)
  }

  // 編集ボタンのハンドラー
  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject)
    setIsEditModalOpen(true)
  }

  // 削除ボタンのハンドラー
  const handleDeleteClick = (subject: Subject) => {
    setSelectedSubject(subject)
    setIsDeleteDialogOpen(true)
  }

  // 削除確認のハンドラー
  const handleDeleteConfirm = async () => {
    if (!selectedSubject) return

    setIsDeleting(true)
    const result = await deleteSubject(selectedSubject.id)

    if (result.success) {
      setIsDeleteDialogOpen(false)
      setSelectedSubject(null)
      await fetchScheduleData()
    } else {
      alert(result.error || "削除に失敗しました")
    }

    setIsDeleting(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800">時間割</h2>
              <p className="text-gray-600 mt-2">週間スケジュール</p>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              科目を追加
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <SemesterSelector
              selectedSemesterId={selectedSemesterId}
              onSemesterChange={setSelectedSemesterId}
              onManageSemesters={() => setIsSemesterManagementOpen(true)}
            />
          </div>
        </div>

        {/* 時間割テーブル */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 border-b w-32">
                      時限
                    </th>
                    {weekDays.map((day, index) => (
                      <th
                        key={index}
                        className="px-4 py-3 text-center text-sm font-semibold text-gray-700 border-b"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr key={period.period} className="hover:bg-gray-50">
                      <td className="px-4 py-4 border-b border-r">
                        <div className="font-semibold text-gray-800">
                          {period.period}限
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {period.startTime} - {period.endTime}
                        </div>
                      </td>
                      {weekDays.map((day, dayIndex) => {
                        // dayIndex: 0=月曜, 1=火曜, ... -> dayOfWeek: 1=月曜, 2=火曜, ...
                        const dayOfWeek = dayIndex + 1
                        const subject = schedule[dayOfWeek]?.[period.period]

                        return (
                          <td
                            key={dayIndex}
                            className="px-4 py-4 border-b text-center"
                          >
                            {subject ? (
                              <div
                                className="p-3 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer"
                                style={{
                                  backgroundColor: `${subject.color}15`,
                                  borderLeft: `4px solid ${subject.color}`,
                                }}
                                onClick={() => handleViewDetail(subject)}
                              >
                                <p className="font-semibold text-gray-800">
                                  {subject.name}
                                </p>
                                {(subject.startTime || subject.endTime) && (
                                  <p className="text-xs text-gray-600 flex items-center justify-center mt-1">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {subject.startTime || "--:--"} - {subject.endTime || "--:--"}
                                  </p>
                                )}
                                {subject.teacher && (
                                  <p className="text-sm text-gray-600 flex items-center justify-center mt-1">
                                    <User className="w-3 h-3 mr-1" />
                                    {subject.teacher}
                                  </p>
                                )}
                                {subject.classroom && (
                                  <p className="text-sm text-gray-500 flex items-center justify-center mt-1">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {subject.classroom}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                className="w-full h-full text-gray-400 hover:text-gray-600"
                                onClick={() => setIsAddModalOpen(true)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* 科目一覧 */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            登録済み科目一覧
          </h3>
          {isLoading ? (
            <div className="text-center py-12 text-gray-500">
              読み込み中...
            </div>
          ) : uniqueSubjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniqueSubjects.map((subject) => (
                <Card
                  key={subject.id}
                  className="hover:shadow-md transition"
                  style={{ borderLeft: `4px solid ${subject.color}` }}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      {(subject.startTime || subject.endTime) && (
                        <p className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          時間: {subject.startTime || "--:--"} - {subject.endTime || "--:--"}
                        </p>
                      )}
                      {subject.teacher && (
                        <p className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          担当: {subject.teacher}
                        </p>
                      )}
                      {subject.classroom && (
                        <p className="flex items-center">
                          <MapPin className="w-4 h-4 mr-2" />
                          教室: {subject.classroom}
                        </p>
                      )}
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewDetail(subject)}
                        title="ファイル管理"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        ファイル
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(subject)}
                      >
                        編集
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteClick(subject)}
                      >
                        削除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-500">
                  登録されている科目がありません
                </p>
                <Button
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  最初の科目を追加
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* 科目追加モーダル */}
      <AddSubjectModal
        open={isAddModalOpen}
        onOpenChange={handleAddModalClose}
        userId={session?.user?.id || ""}
        defaultSemesterId={selectedSemesterId}
      />

      {/* 科目編集モーダル */}
      <EditSubjectModal
        open={isEditModalOpen}
        onOpenChange={handleEditModalClose}
        subject={selectedSubject}
      />

      {/* 科目詳細モーダル */}
      <SubjectDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        subject={selectedSubject}
        userId={session?.user?.id || ""}
      />

      {/* 削除確認ダイアログ */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="科目を削除しますか？"
        description={`「${selectedSubject?.name || ""}」を削除します。この操作は取り消せません。本当に削除してもよろしいですか？`}
        isDeleting={isDeleting}
      />

      {/* 学期管理モーダル */}
      <SemesterManagementModal
        isOpen={isSemesterManagementOpen}
        onClose={() => setIsSemesterManagementOpen(false)}
        onSemesterChange={fetchScheduleData}
      />
    </div>
  )
}
