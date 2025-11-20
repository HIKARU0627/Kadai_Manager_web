"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Home,
  Calendar,
  CheckSquare,
  CalendarDays,
  FileText,
  LogOut,
  Settings,
  FolderOpen,
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
  {
    title: "ファイル管理",
    href: "/files",
    icon: FolderOpen,
  },
  {
    title: "設定",
    href: "/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const userInitial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : session?.user?.email?.charAt(0).toUpperCase() || "U"

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

      <div className="p-4 border-t border-gray-200 bg-white space-y-3">
        {session?.user && (
          <>
            <Link
              href="/settings"
              className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {userInitial}
              </div>
              <div className="ml-3 flex-1 overflow-hidden">
                <p className="font-medium text-gray-700 truncate">
                  {session.user.name || session.user.username}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {session.user.email}
                </p>
              </div>
            </Link>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              ログアウト
            </Button>
          </>
        )}
      </div>
    </aside>
  )
}
