import { Sidebar } from "@/components/layout/Sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Clock, MapPin, User } from "lucide-react"

// モックデータ
const weekDays = ["月曜日", "火曜日", "水曜日", "木曜日", "金曜日"]
const periods = [
  { period: 1, startTime: "09:00", endTime: "10:30" },
  { period: 2, startTime: "10:40", endTime: "12:10" },
  { period: 3, startTime: "13:00", endTime: "14:30" },
  { period: 4, startTime: "14:40", endTime: "16:10" },
  { period: 5, startTime: "16:20", endTime: "17:50" },
]

const schedule = {
  1: { // 月曜日
    1: {
      name: "数学I",
      teacher: "佐藤先生",
      classroom: "A棟301",
      color: "#3B82F6",
    },
    2: {
      name: "英語会話",
      teacher: "Smith先生",
      classroom: "B棟205",
      color: "#10B981",
    },
    3: {
      name: "プログラミング基礎",
      teacher: "鈴木先生",
      classroom: "C棟コンピュータ室",
      color: "#8B5CF6",
    },
  },
  2: { // 火曜日
    1: {
      name: "物理学",
      teacher: "山田先生",
      classroom: "A棟205",
      color: "#EC4899",
    },
    2: {
      name: "日本史",
      teacher: "田中先生",
      classroom: "B棟301",
      color: "#6366F1",
    },
  },
  3: { // 水曜日
    1: {
      name: "化学",
      teacher: "伊藤先生",
      classroom: "A棟401",
      color: "#F59E0B",
    },
    3: {
      name: "体育",
      teacher: "中村先生",
      classroom: "体育館",
      color: "#14B8A6",
    },
  },
  4: { // 木曜日
    1: {
      name: "数学I",
      teacher: "佐藤先生",
      classroom: "A棟301",
      color: "#3B82F6",
    },
    2: {
      name: "英語会話",
      teacher: "Smith先生",
      classroom: "B棟205",
      color: "#10B981",
    },
  },
  5: { // 金曜日
    2: {
      name: "プログラミング基礎",
      teacher: "鈴木先生",
      classroom: "C棟コンピュータ室",
      color: "#8B5CF6",
    },
    3: {
      name: "世界史",
      teacher: "小林先生",
      classroom: "B棟302",
      color: "#EF4444",
    },
  },
}

export default function SubjectsPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        {/* ヘッダー */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">時間割</h2>
            <p className="text-gray-600 mt-2">週間スケジュール</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            科目を追加
          </Button>
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
                        const subject =
                          schedule[
                            (dayIndex + 1) as keyof typeof schedule
                          ]?.[period.period as keyof typeof schedule[1]]

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
                              >
                                <p className="font-semibold text-gray-800">
                                  {subject.name}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center justify-center mt-1">
                                  <User className="w-3 h-3 mr-1" />
                                  {subject.teacher}
                                </p>
                                <p className="text-sm text-gray-500 flex items-center justify-center mt-1">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {subject.classroom}
                                </p>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                className="w-full h-full text-gray-400 hover:text-gray-600"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(schedule)
              .flatMap((day) => Object.values(day))
              .filter(
                (subject, index, self) =>
                  index ===
                  self.findIndex((s) => s.name === subject.name)
              )
              .map((subject, index) => (
                <Card
                  key={index}
                  className="hover:shadow-md transition"
                  style={{ borderLeft: `4px solid ${subject.color}` }}
                >
                  <CardHeader>
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        担当: {subject.teacher}
                      </p>
                      <p className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        教室: {subject.classroom}
                      </p>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        編集
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-red-600 hover:bg-red-50"
                      >
                        削除
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </main>
    </div>
  )
}
