"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  setIsOpen: (value: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const [mounted, setMounted] = useState(false)

  // ローカルストレージから状態を復元（ハイドレーション問題を回避）
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sidebarOpen')
    if (saved !== null) {
      setIsOpen(JSON.parse(saved))
    }
  }, [])

  // 状態をローカルストレージに保存
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('sidebarOpen', JSON.stringify(isOpen))
    }
  }, [isOpen, mounted])

  const toggle = () => {
    setIsOpen(prev => !prev)
  }

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
