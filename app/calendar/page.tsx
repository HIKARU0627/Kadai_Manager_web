"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AddEventModal } from "@/components/modals/AddEventModal"
import { EditEventModal } from "@/components/modals/EditEventModal"
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Edit, Trash2 } from "lucide-react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import { ja } from "date-fns/locale"
import { getMonthlyEvents, deleteEvent } from "@/app/actions/events"
import { getTasks } from "@/app/actions/tasks"
import { getSubjects } from "@/app/actions/subjects"
import { getEventTypes } from "@/app/actions/eventTypes"

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: string  // "task" またはイベントタイプのvalue
  color: string
  status?: string
  description?: string | null
  startDatetime?: Date
  endDatetime?: Date
  location?: string | null
  subjectId?: string
  subjectName?: string
}

interface Subject {
  id: string
  name: string
  color: string
}

interface EventType {
  id: string
  name: string
  value: string
  color: string
}

export default function CalendarPage() {
  const { data: session } = useSession()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [dateForNewEvent, setDateForNewEvent] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart, { locale: ja })
  const endDate = endOfWeek(monthEnd, { locale: ja })

  // データの取得
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return

      setIsLoading(true)
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()

      const [eventsResult, tasksResult, subjectsResult, eventTypesResult] = await Promise.all([
        getMonthlyEvents(session.user.id, year, month),
        getTasks(session.user.id, {}),
        getSubjects(session.user.id),
        getEventTypes(session.user.id),
      ])

      const calendarEvents: CalendarEvent[] = []

      // 科目マップを作成 (IDから名前を引けるように)
      const subjectMap = new Map<string, string>()
      if (subjectsResult.success) {
        subjectsResult.data.forEach((s: any) => {
          subjectMap.set(s.id, s.name)
        })
      }

      // イベントタイプマップを作成（valueからcolorを引けるように）
      const eventTypeColorMap = new Map<string, string>()
      if (eventTypesResult.success) {
        eventTypesResult.data.forEach((t: any) => {
          eventTypeColorMap.set(t.value, t.color)
        })
      }

      // 予定を追加（イベント、テスト）
      if (eventsResult.success) {
        eventsResult.data.forEach((event: any) => {
          const eventType = event.eventType || "event"
          const subjectName = event.subjectId ? subjectMap.get(event.subjectId) : undefined

          // イベントタイプの色を取得（なければイベント自体の色、それもなければデフォルト）
          const color = eventTypeColorMap.get(eventType) || event.color || "#10B981"

          calendarEvents.push({
            id: event.id,
            title: event.title,
            date: new Date(event.startDatetime),
            type: eventType,
            color: color,
            description: event.description,
            startDatetime: new Date(event.startDatetime),
            endDatetime: new Date(event.endDatetime),
            location: event.location,
            subjectId: event.subjectId,
            subjectName: subjectName,
          })
        })
      }

      // 課題を追加
      if (tasksResult.success) {
        tasksResult.data.forEach((task: any) => {
          if (task.dueDate) {
            const dueDate = new Date(task.dueDate)
            const taskMonth = dueDate.getMonth()
            const taskYear = dueDate.getFullYear()

            // 現在の月のタスクのみ追加
            if (taskYear === year && taskMonth === month) {
              const isToday = isSameDay(dueDate, new Date())
              calendarEvents.push({
                id: task.id,
                title: task.title,
                date: dueDate,
                type: "task",
                color: isToday ? "#EF4444" : "#F59E0B",
                status: task.status,
              })
            }
          }
        })
      }

      if (subjectsResult.success) {
        setSubjects(subjectsResult.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          color: s.color,
        })))
      }

      if (eventTypesResult.success) {
        setEventTypes(eventTypesResult.data.map((t: any) => ({
          id: t.id,
          name: t.name,
          value: t.value,
          color: t.color,
        })))
      }

      setEvents(calendarEvents)
      setIsLoading(false)
    }

    fetchData()
  }, [session?.user?.id, currentMonth])

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const handleDateClick = (day: Date) => {
    setSelectedDate(day)
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(event.date, date))
  }

  // モーダル閉じた時にデータを再取得
  const handleModalClose = async (open: boolean) => {
    setIsAddModalOpen(open)
    if (!open && session?.user?.id) {
      // データを再フェッチ
      const year = currentMonth.getFullYear()
      const month = currentMonth.getMonth()

      const [eventsResult, tasksResult, subjectsResult, eventTypesResult] = await Promise.all([
        getMonthlyEvents(session.user.id, year, month),
        getTasks(session.user.id, {}),
        getSubjects(session.user.id),
        getEventTypes(session.user.id),
      ])

      const calendarEvents: CalendarEvent[] = []

      // 科目マップを作成
      const subjectMap = new Map<string, string>()
      if (subjectsResult.success) {
        subjectsResult.data.forEach((s: any) => {
          subjectMap.set(s.id, s.name)
        })
      }

      // イベントタイプマップを作成（valueからcolorを引けるように）
      const eventTypeColorMap = new Map<string, string>()
      if (eventTypesResult.success) {
        eventTypesResult.data.forEach((t: any) => {
          eventTypeColorMap.set(t.value, t.color)
        })
      }

      // 予定を追加（イベント、テスト）
      if (eventsResult.success) {
        eventsResult.data.forEach((event: any) => {
          const eventType = event.eventType || "event"
          const subjectName = event.subjectId ? subjectMap.get(event.subjectId) : undefined

          // イベントタイプの色を取得（なければイベント自体の色、それもなければデフォルト）
          const color = eventTypeColorMap.get(eventType) || event.color || "#10B981"

          calendarEvents.push({
            id: event.id,
            title: event.title,
            date: new Date(event.startDatetime),
            type: eventType,
            color: color,
            description: event.description,
            startDatetime: new Date(event.startDatetime),
            endDatetime: new Date(event.endDatetime),
            location: event.location,
            subjectId: event.subjectId,
            subjectName: subjectName,
          })
        })
      }

      if (tasksResult.success) {
        tasksResult.data.forEach((task: any) => {
          if (task.dueDate) {
            const dueDate = new Date(task.dueDate)
            const taskMonth = dueDate.getMonth()
            const taskYear = dueDate.getFullYear()

            if (taskYear === year && taskMonth === month) {
              const isToday = isSameDay(dueDate, new Date())
              calendarEvents.push({
                id: task.id,
                title: task.title,
                date: dueDate,
                type: "task",
                color: isToday ? "#EF4444" : "#F59E0B",
                status: task.status,
              })
            }
          }
        })
      }

      if (subjectsResult.success) {
        setSubjects(subjectsResult.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          color: s.color,
        })))
      }

      if (eventTypesResult.success) {
        setEventTypes(eventTypesResult.data.map((t: any) => ({
          id: t.id,
          name: t.name,
          value: t.value,
          color: t.color,
        })))
      }

      setEvents(calendarEvents)
    }
  }

  // 編集モーダル閉じた時にデータを再取得
  const handleEditModalClose = async (open: boolean) => {
    setIsEditModalOpen(open)
    if (!open && session?.user?.id) {
      await handleModalClose(false)
      setSelectedEvent(null)
    }
  }

  // 編集ボタンのハンドラー（イベント全般）
  const handleEdit = (event: CalendarEvent) => {
    if (event.type !== "task" && event.startDatetime && event.endDatetime) {
      setSelectedEvent(event)
      setIsEditModalOpen(true)
    }
  }

  // 削除ボタンのハンドラー（イベント全般）
  const handleDeleteClick = (event: CalendarEvent) => {
    if (event.type !== "task") {
      setSelectedEvent(event)
      setIsDeleteDialogOpen(true)
    }
  }

  // 削除確認のハンドラー
  const handleDeleteConfirm = async () => {
    if (!selectedEvent || selectedEvent.type === "task") return

    setIsDeleting(true)
    const result = await deleteEvent(selectedEvent.id)

    if (result.success) {
      setIsDeleteDialogOpen(false)
      setSelectedEvent(null)
      await handleModalClose(false)
    } else {
      alert(result.error || "削除に失敗しました")
    }

    setIsDeleting(false)
  }

  // セルのダブルクリックハンドラー
  const handleDateDoubleClick = (date: Date) => {
    setDateForNewEvent(date)
    setIsAddModalOpen(true)
  }

  const renderCalendar = () => {
    const days = []
    let day = startDate

    while (day <= endDate) {
      days.push(day)
      day = addDays(day, 1)
    }

    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7))
    }

    return weeks.map((week, weekIndex) => (
      <div key={weekIndex} className="grid grid-cols-7 gap-2">
        {week.map((day, dayIndex) => {
          const dayEvents = getEventsForDate(day)
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isSelected = selectedDate && isSameDay(day, selectedDate)
          const isTodayDate = isToday(day)

          return (
            <div
              key={dayIndex}
              onClick={() => handleDateClick(day)}
              onDoubleClick={() => handleDateDoubleClick(day)}
              className={`min-h-24 p-2 border rounded-lg cursor-pointer transition ${
                isCurrentMonth
                  ? "bg-white hover:bg-gray-50"
                  : "bg-gray-50 text-gray-400"
              } ${isSelected ? "ring-2 ring-blue-500" : ""} ${
                isTodayDate ? "border-blue-500 border-2" : ""
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span
                  className={`text-sm font-semibold ${
                    isTodayDate ? "text-blue-600" : ""
                  }`}
                >
                  {format(day, "d")}
                </span>
                {isTodayDate && (
                  <Badge className="bg-blue-100 text-blue-600 text-xs">
                    今日
                  </Badge>
                )}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded truncate"
                    style={{
                      backgroundColor: `${event.color}20`,
                      borderLeft: `3px solid ${event.color}`,
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 2}件
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    ))
  }

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : []

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        {/* ヘッダー */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">カレンダー</h2>
            <p className="text-gray-600 mt-2">
              課題の締め切りと予定を確認
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => setCurrentMonth(new Date())}>
              今日
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="w-5 h-5 mr-2" />
              予定を追加
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* カレンダー */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-6">
                {/* 月選択 */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {format(currentMonth, "yyyy年MM月", { locale: ja })}
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePreviousMonth}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNextMonth}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* 曜日ヘッダー */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["日", "月", "火", "水", "木", "金", "土"].map((day, index) => (
                    <div
                      key={index}
                      className="text-center text-sm font-semibold text-gray-600 p-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* カレンダーグリッド */}
                <div className="space-y-2">{renderCalendar()}</div>

                {/* 凡例 */}
                <div className="mt-6 flex flex-wrap gap-4 text-sm">
                  {/* 課題（固定） */}
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded mr-2"
                      style={{ backgroundColor: "#F59E0B" }}
                    ></div>
                    <span>課題</span>
                  </div>

                  {/* ユーザーのイベントタイプ（動的） */}
                  {eventTypes.map((eventType) => (
                    <div key={eventType.id} className="flex items-center">
                      <div
                        className="w-4 h-4 rounded mr-2"
                        style={{ backgroundColor: eventType.color }}
                      ></div>
                      <span>{eventType.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* サイドバー: 選択された日の詳細 */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  {selectedDate
                    ? format(selectedDate, "MM月dd日（E）", { locale: ja })
                    : "日付を選択"}
                </h3>

                {selectedDate && selectedDateEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 rounded-lg border-l-4"
                        style={{
                          backgroundColor: `${event.color}10`,
                          borderLeftColor: event.color,
                        }}
                      >
                        <p className="font-semibold text-gray-800 text-sm">
                          {event.title}
                        </p>
                        {event.subjectName && (
                          <p className="text-xs text-gray-500 mt-1">
                            {event.subjectName}
                          </p>
                        )}
                        <div className="flex justify-between items-center mt-2">
                          <Badge
                            style={{
                              backgroundColor: `${event.color}20`,
                              color: event.color,
                            }}
                          >
                            {event.type === "task"
                              ? "課題"
                              : eventTypes.find(t => t.value === event.type)?.name || "予定"}
                          </Badge>
                          {event.type !== "task" && (
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-blue-600"
                                onClick={() => handleEdit(event)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-gray-400 hover:text-red-600"
                                onClick={() => handleDeleteClick(event)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedDate ? (
                  <p className="text-gray-500 text-sm">
                    この日には予定がありません
                  </p>
                ) : (
                  <p className="text-gray-500 text-sm">
                    カレンダーから日付を選択してください
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 今月の統計 */}
            <Card className="mt-4">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  今月の統計
                </h3>
                <div className="space-y-3">
                  {/* 課題（固定） */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">課題</span>
                    <Badge className="bg-orange-100 text-orange-600">
                      {events.filter((e) => e.type === "task").length}件
                    </Badge>
                  </div>

                  {/* ユーザーのイベントタイプ（動的） */}
                  {eventTypes.map((eventType) => {
                    const count = events.filter((e) => e.type === eventType.value).length
                    // カウントが0の場合は表示しない
                    if (count === 0) return null

                    return (
                      <div key={eventType.id} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{eventType.name}</span>
                        <Badge
                          style={{
                            backgroundColor: `${eventType.color}20`,
                            color: eventType.color
                          }}
                        >
                          {count}件
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* 予定追加モーダル */}
      <AddEventModal
        open={isAddModalOpen}
        onOpenChange={handleModalClose}
        userId={session?.user?.id || ""}
        initialDate={dateForNewEvent || undefined}
        subjects={subjects}
        eventTypes={eventTypes}
      />

      {/* 予定編集モーダル */}
      {selectedEvent && selectedEvent.type !== "task" && (
        <EditEventModal
          open={isEditModalOpen}
          onOpenChange={handleEditModalClose}
          event={selectedEvent.startDatetime && selectedEvent.endDatetime ? {
            id: selectedEvent.id,
            title: selectedEvent.title,
            description: selectedEvent.description || null,
            eventType: selectedEvent.type,
            subjectId: selectedEvent.subjectId,
            startDatetime: selectedEvent.startDatetime,
            endDatetime: selectedEvent.endDatetime,
            location: selectedEvent.location || null,
            color: selectedEvent.color,
          } : null}
          subjects={subjects}
          eventTypes={eventTypes}
        />
      )}

      {/* 削除確認ダイアログ */}
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="予定を削除しますか？"
        description={`「${selectedEvent?.title || ""}」を削除します。この操作は取り消せません。本当に削除してもよろしいですか？`}
        isDeleting={isDeleting}
      />
    </div>
  )
}
