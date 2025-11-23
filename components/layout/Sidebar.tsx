"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Home,
  Calendar,
  CheckSquare,
  CalendarDays,
  FileText,
  LogOut,
  Settings,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { useSidebar } from "@/components/providers/SidebarProvider"

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
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { isOpen, toggle } = useSidebar()

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const userInitial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : session?.user?.email?.charAt(0).toUpperCase() || "U"

  return (
    <aside
      className={cn(
        "bg-white shadow-lg flex flex-col transition-all duration-300 relative",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div className={cn(
        "border-b border-gray-200 flex items-center justify-between",
        isOpen ? "p-6" : "p-4"
      )}>
        <h1 className={cn(
          "text-2xl font-bold text-blue-600 whitespace-nowrap overflow-hidden transition-all duration-300",
          isOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
        )}>
          学校管理アプリ
        </h1>
        <button
          onClick={toggle}
          className={cn(
            "p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0",
            !isOpen && "mx-auto"
          )}
          aria-label={isOpen ? "サイドバーを閉じる" : "サイドバーを開く"}
        >
          {isOpen ? (
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      <nav className="p-4 flex-1 overflow-hidden">
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
                      : "text-gray-600 hover:bg-gray-50",
                    !isOpen && "justify-center"
                  )}
                  title={!isOpen ? item.title : undefined}
                >
                  <Icon className={cn("w-5 h-5 flex-shrink-0", isOpen && "mr-3")} />
                  <span className={cn(
                    "whitespace-nowrap overflow-hidden transition-all duration-300",
                    isOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
                  )}>
                    {item.title}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200 bg-white">
        {session?.user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className={cn(
                "flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer",
                !isOpen && "justify-center"
              )}>
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  {userInitial}
                </div>
                <div className={cn(
                  "ml-3 flex-1 overflow-hidden transition-all duration-300",
                  isOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
                )}>
                  <p className="font-medium text-gray-700 truncate whitespace-nowrap">
                    {session.user.name || session.user.username}
                  </p>
                  <p className="text-sm text-gray-500 truncate whitespace-nowrap">
                    {session.user.email}
                  </p>
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  設定
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                ログアウト
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </aside>
  )
}
