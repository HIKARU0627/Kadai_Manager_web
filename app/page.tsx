import { Sidebar } from "@/components/layout/Sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Plus } from "lucide-react"
import { format } from "date-fns"
import { ja } from "date-fns/locale"

// モックデータ
const todaySubjects = [
  {
    id: "1",
    name: "数学I",
    period: 1,
    startTime: "09:00",
    endTime: "10:30",
    classroom: "A棟301",
    teacher: "佐藤先生",
    color: "#3B82F6",
  },
  {
    id: "2",
    name: "英語会話",
    period: 2,
    startTime: "10:40",
    endTime: "12:10",
    classroom: "B棟205",
    teacher: "Smith先生",
    color: "#10B981",
  },
  {
    id: "3",
    name: "プログラミング基礎",
    period: 3,
    startTime: "13:00",
    endTime: "14:30",
    classroom: "C棟コンピュータ室",
    teacher: "鈴木先生",
    color: "#8B5CF6",
  },
]

const todayTasks = [
  {
    id: "1",
    title: "レポート: 微分積分の応用",
    subject: "数学I",
    dueTime: "23:59",
    status: "作業中",
  },
  {
    id: "2",
    title: "課題: 英作文エッセイ",
    subject: "英語会話",
    dueTime: "18:00",
    status: "未着手",
  },
]

const todayEvents = [
  {
    id: "1",
    title: "図書館で自習",
    startTime: "15:00",
    endTime: "18:00",
    location: "大学図書館3階",
  },
]

export default function DashboardPage() {
  const today = new Date()
  const formattedDate = format(today, "yyyy年MM月dd日（E）", { locale: ja })

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
              <div className="space-y-3">
                {todaySubjects.map((subject) => (
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
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Clock className="w-4 h-4 mr-1" />
                      {subject.startTime} - {subject.endTime}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      教室: {subject.classroom} / 担当: {subject.teacher}
                    </p>
                  </div>
                ))}
              </div>
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
                        <p className="text-sm text-gray-600 mt-1">
                          科目: {task.subject}
                        </p>
                        <p className="text-sm text-red-600 font-medium mt-1">
                          締め切り: 今日 {task.dueTime}
                        </p>
                      </div>
                      <Badge
                        className={
                          task.status === "作業中"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }
                      >
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="space-y-3">
                {todayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg"
                  >
                    <p className="font-semibold text-gray-800">{event.title}</p>
                    <p className="text-sm text-gray-600 mt-1 flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {event.startTime} - {event.endTime}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {event.location}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* クイックアクション */}
        <div className="mt-8 flex space-x-4">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            新しい課題を追加
          </Button>
          <Button variant="outline">
            <Plus className="w-5 h-5 mr-2" />
            予定を追加
          </Button>
        </div>
      </main>
    </div>
  )
}
