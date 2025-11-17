"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Calendar,
  CheckSquare,
  CalendarDays,
  FileText,
} from "lucide-react"

const navItems = [
  {
    title: "ダッシュボード",
    href: "/",
    icon: Home,
  },
  {
    title: "時間割",
    href: "/subjects",
    icon: Calendar,
  },
  {
    title: "課題",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    title: "カレンダー",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    title: "授業メモ",
    href: "/notes",
    icon: FileText,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-blue-600">学校管理アプリ</h1>
      </div>

      <nav className="p-4 flex-1">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center p-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.title}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            田
          </div>
          <div className="ml-3">
            <p className="font-medium text-gray-700">田中太郎</p>
            <p className="text-sm text-gray-500">student@example.com</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
