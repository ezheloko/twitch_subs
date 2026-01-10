"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface StreamSettings {
  id: string
  slideDuration: number
  transitionType: string
  streamUrl?: string
}

interface User {
  id: string
  name?: string
  email?: string
  twitchLogin?: string
  isMainAdmin: boolean
}

export default function AdminSettings() {
  const { data: session } = useSession()
  const [streamSettings, setStreamSettings] = useState<StreamSettings | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [newAdminLogin, setNewAdminLogin] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
    if (session?.user?.isMainAdmin) {
      fetchUsers()
    }
  }, [session])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/stream-settings")
      if (response.ok) {
        const data = await response.json()
        setStreamSettings(data)
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleUpdateSettings = async () => {
    if (!streamSettings) return

    try {
      const response = await fetch("/api/stream-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(streamSettings),
      })

      if (response.ok) {
        alert("Настройки сохранены")
      }
    } catch (error) {
      console.error("Error updating settings:", error)
      alert("Ошибка при сохранении настроек")
    }
  }

  const handleAddAdmin = async () => {
    if (!newAdminLogin.trim()) {
      alert("Введите Twitch логин")
      return
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twitchLogin: newAdminLogin.trim() }),
      })

      if (response.ok) {
        await fetchUsers()
        setNewAdminLogin("")
        alert("Администратор добавлен")
      } else {
        const error = await response.json()
        alert(error.error || "Ошибка при добавлении администратора")
      }
    } catch (error) {
      console.error("Error adding admin:", error)
      alert("Ошибка при добавлении администратора")
    }
  }

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этого администратора?")) return

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchUsers()
        alert("Администратор успешно удален")
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("Failed to delete admin:", response.status, errorData)
        alert(errorData.error || `Ошибка при удалении администратора: ${response.statusText}`)
      }
    } catch (error: any) {
      console.error("Error deleting admin:", error)
      alert(error.message || "Ошибка при удалении администратора")
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Загрузка настроек...</div>
  }

  const isMainAdmin = session?.user?.isMainAdmin

  return (
    <div className="space-y-8">
      {/* Stream Settings */}
      <div className="bg-background-1 border border-stroke-1 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-secondary mb-4">Настройки стрима</h2>
        {streamSettings && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Длительность показа комнаты (секунды)
              </label>
              <input
                type="number"
                min="1"
                value={streamSettings.slideDuration}
                onChange={(e) =>
                  setStreamSettings({
                    ...streamSettings,
                    slideDuration: parseInt(e.target.value) || 15,
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Тип перехода</label>
              <select
                value={streamSettings.transitionType}
                onChange={(e) =>
                  setStreamSettings({
                    ...streamSettings,
                    transitionType: e.target.value,
                  })
                }
              >
                <option value="none">Без анимации</option>
                <option value="fade">Растворение (fade)</option>
              </select>
            </div>
            <button
              onClick={handleUpdateSettings}
              className="btn btn-primary btn-base"
            >
              <span>Сохранить настройки</span>
            </button>
            
            {/* Ссылка на страницу стрима */}
            <div className="mt-4 p-4 bg-background-2 rounded-lg border border-stroke-1">
              <p className="text-sm font-medium mb-2">Ссылка на страницу стрима:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-background-1 px-3 py-2 rounded text-sm border border-stroke-1">
                  {typeof window !== "undefined" ? `${window.location.origin}/stream` : "/stream"}
                </code>
                <button
                  onClick={() => {
                    const url = typeof window !== "undefined" ? `${window.location.origin}/stream` : "/stream"
                    navigator.clipboard.writeText(url)
                    alert("Ссылка скопирована в буфер обмена")
                  }}
                  className="btn btn-sm bg-gray-600 border-gray-700 text-white hover:bg-gray-700"
                >
                  <span>Копировать</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Admin Management (только для главного админа) */}
      {isMainAdmin && (
        <div className="bg-background-1 border border-stroke-1 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-secondary mb-4">Управление администраторами</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newAdminLogin}
                onChange={(e) => setNewAdminLogin(e.target.value)}
                placeholder="Twitch логин нового администратора"
                className="flex-1 px-4 py-2 border border-stroke-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={handleAddAdmin}
                className="btn btn-primary btn-base"
              >
                <span>Добавить</span>
              </button>
            </div>
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-background-2 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{user.name || user.twitchLogin || user.email}</p>
                    <p className="text-sm text-gray-600">
                      {user.twitchLogin && `@${user.twitchLogin}`}
                      {user.isMainAdmin && " (Главный администратор)"}
                    </p>
                  </div>
                  {!user.isMainAdmin && (
                    <button
                      onClick={() => handleDeleteAdmin(user.id)}
                      className="btn btn-sm bg-red-600 border-red-700 text-white hover:bg-red-700"
                    >
                      <span>Удалить</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
