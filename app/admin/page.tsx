"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import RoomEditor from "@/components/admin/RoomEditor"
import AvatarBaseManager from "@/components/admin/AvatarBaseManager"
import AdminSettings from "@/components/admin/AdminSettings"

type Tab = "rooms" | "avatars" | "settings"

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
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
      if (!session.user.twitchLogin && !session.user.isMainAdmin) {
        setIsLoading(false)
        return
      }
      setIsLoading(false)
    }
  }, [session, status, router])

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

  if (!session?.user?.twitchLogin && !session?.user?.isMainAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-2">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Доступ запрещен</h1>
          <p>У вас нет прав доступа к административной панели.</p>
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
              <p className="text-sm text-gray-600">Добро пожаловать, {session.user.name}!</p>
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
