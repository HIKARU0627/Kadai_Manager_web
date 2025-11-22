import { Sidebar } from "@/components/layout/Sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Plus } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { getTodaySubjects } from "@/app/actions/subjects"
import { getTodayTasks } from "@/app/actions/tasks"
import { getTodayEvents } from "@/app/actions/events"
import { getPeriods } from "@/app/actions/periods"
import Link from "next/link"

const statusLabels = {
  not_started: "未着手",
  in_progress: "作業中",
  completed: "完了",
  overdue: "時間切れ",
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login")
  }

  const today = new Date()
  const formattedDate = format(today, "yyyy年MM月dd日（E）", { locale: ja })

  // データベースからデータを取得
  const [subjectsResult, tasksResult, eventsResult, periods] = await Promise.all([
    getTodaySubjects(session.user.id),
    getTodayTasks(session.user.id),
    getTodayEvents(session.user.id),
    getPeriods(session.user.id),
  ])

  const todaySubjects = subjectsResult.success ? subjectsResult.data : []
  const todayTasks = tasksResult.success ? tasksResult.data : []
  const todayEvents = eventsResult.success ? eventsResult.data : []

  // 時限番号から時刻情報を取得するためのマップを作成
  const periodMap = new Map(
    periods.map((p) => [p.periodNumber, { startTime: p.startTime, endTime: p.endTime }])
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">ダッシュボード</h2>
          <p className="text-gray-600 mt-2">{formattedDate}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 今日の時間割カード */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-blue-500" />
                  今日の時間割
                </CardTitle>
                <Badge className="bg-blue-100 text-blue-600">
                  {todaySubjects.length}件
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {todaySubjects.length > 0 ? (
                <div className="space-y-3">
                  {todaySubjects.map((subject) => {
                    const periodTime = periodMap.get(subject.period)
                    return (
                      <div
                        key={subject.id}
                        className="border-l-4 p-4 rounded-r-lg"
                        style={{
                          borderLeftColor: subject.color,
                          backgroundColor: `${subject.color}10`,
                        }}
                      >
                        <p className="font-semibold text-gray-800">
                          {subject.period}限: {subject.name}
                        </p>
                        {periodTime && (
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <Clock className="w-4 h-4 mr-1" />
                            {periodTime.startTime} - {periodTime.endTime}
                          </p>
                        )}
                        {(subject.classroom || subject.teacher) && (
                          <p className="text-sm text-gray-500 mt-1">
                            {subject.classroom && `教室: ${subject.classroom}`}
                            {subject.classroom && subject.teacher && " / "}
                            {subject.teacher && `担当: ${subject.teacher}`}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  今日の授業はありません
                </p>
              )}
            </CardContent>
          </Card>

          {/* 今日が締め切りの課題カード */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center">
                  <Clock className="w-6 h-6 mr-2 text-red-500" />
                  今日が締め切りの課題
                </CardTitle>
                <Badge className="bg-red-100 text-red-600">
                  {todayTasks.length}件
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {todayTasks.length > 0 ? (
                <div className="space-y-3">
                  {todayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-red-200 bg-red-50 p-4 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">
                            {task.title}
                          </p>
                          {task.subject && (
                            <p className="text-sm text-gray-600 mt-1">
                              科目: {task.subject.name}
                            </p>
                          )}
                          <p className="text-sm text-red-600 font-medium mt-1">
                            締め切り: {format(task.dueDate, "HH:mm", { locale: ja })}
                          </p>
                        </div>
                        <Badge
                          className={
                            task.status === "in_progress"
                              ? "bg-yellow-100 text-yellow-800"
                              : task.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }
                        >
                          {statusLabels[task.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  今日締め切りの課題はありません
                </p>
              )}
            </CardContent>
          </Card>

          {/* 今日の個人的な予定カード */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold flex items-center">
                  <Calendar className="w-6 h-6 mr-2 text-green-500" />
                  今日の個人的な予定
                </CardTitle>
                <Badge className="bg-green-100 text-green-600">
                  {todayEvents.length}件
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {todayEvents.length > 0 ? (
                <div className="space-y-3">
                  {todayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="border-l-4 p-4 rounded-r-lg"
                      style={{
                        borderLeftColor: event.color,
                        backgroundColor: `${event.color}10`,
                      }}
                    >
                      <p className="font-semibold text-gray-800">{event.title}</p>
                      <p className="text-sm text-gray-600 mt-1 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {format(event.startDatetime, "HH:mm", { locale: ja })} -{" "}
                        {format(event.endDatetime, "HH:mm", { locale: ja })}
                      </p>
                      {event.location && (
                        <p className="text-sm text-gray-500 mt-1 flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  今日の予定はありません
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* クイックアクション */}
        <div className="mt-8 flex space-x-4">
          <Link href="/tasks">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-5 h-5 mr-2" />
              新しい課題を追加
            </Button>
          </Link>
          <Link href="/calendar">
            <Button variant="outline">
              <Plus className="w-5 h-5 mr-2" />
              予定を追加
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}
