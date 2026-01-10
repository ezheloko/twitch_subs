"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import RoomEditor from "@/components/admin/RoomEditor"
import AvatarBaseManager from "@/components/admin/AvatarBaseManager"
import AdminSettings from "@/components/admin/AdminSettings"
import AdminRequestForm from "@/components/admin/AdminRequestForm"

type Tab = "rooms" | "avatars" | "settings"

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("rooms")

  useEffect(() => {
    // Добавляем класс для админ-панели
    document.body.classList.add("admin-page")
    return () => {
      document.body.classList.remove("admin-page")
    }
  }, [])

  useEffect(() => {
    if (status === "loading") return

    if (status === "unauthenticated") {
      signIn("twitch", { callbackUrl: "/admin" })
      return
    }

    if (status === "authenticated" && session?.user) {
      // Проверяем доступ через API
      checkAdminAccess()
    }
  }, [session, status, router])

  const checkAdminAccess = async () => {
    try {
      const response = await fetch("/api/check-admin-access")
      if (response.ok) {
        const data = await response.json()
        console.log("[Admin Access Check]", data)
        setHasAccess(data.hasAccess || false)
      } else {
        console.log("[Admin Access Check] Failed:", response.status)
        setHasAccess(false)
      }
    } catch (error) {
      console.error("[Admin Access Check] Error:", error)
      setHasAccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-2">
        <div className="text-lg">Загрузка...</div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  if (!hasAccess && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-2">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-4">Доступ запрещен</h1>
            <p className="text-gray-600">У вас нет прав доступа к административной панели.</p>
          </div>
          <AdminRequestForm />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-2">
      {/* Header */}
      <header className="bg-background-1 border-b border-stroke-1">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-secondary">Административная панель</h1>
              <p className="text-sm text-gray-600">Добро пожаловать, {session?.user?.name || session?.user?.email || 'Пользователь'}!</p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/admin" })}
              className="btn btn-primary btn-sm"
            >
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-stroke-1 bg-background-1">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab("rooms")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "rooms"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-600 hover:text-secondary"
              }`}
            >
              Комнаты
            </button>
            <button
              onClick={() => setActiveTab("avatars")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "avatars"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-600 hover:text-secondary"
              }`}
            >
              База аватаров
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "settings"
                  ? "text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-600 hover:text-secondary"
              }`}
            >
              Настройки
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        {activeTab === "rooms" && <RoomEditor />}
        {activeTab === "avatars" && <AvatarBaseManager />}
        {activeTab === "settings" && <AdminSettings />}
      </main>
    </div>
  )
}
