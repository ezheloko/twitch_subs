"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface StreamSettings {
  id: string
  slideDuration: number
  transitionType: string
  streamUrl?: string
}

interface AdminRequest {
  id: string
  userId: string
  status: "pending" | "approved" | "rejected"
  message?: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
  user: {
    id: string
    email?: string
    name?: string
    image?: string
    twitchLogin?: string
  }
}

interface User {
  id: string
  name?: string
  email?: string
  twitchLogin?: string
  isMainAdmin: boolean
  adminRequest?: {
    id: string
    status: string
    createdAt: string
  } | null
}

export default function AdminSettings() {
  const { data: session } = useSession()
  const [streamSettings, setStreamSettings] = useState<StreamSettings | null>(null)
  const [adminRequests, setAdminRequests] = useState<AdminRequest[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMainAdmin, setIsMainAdmin] = useState(false)

  useEffect(() => {
    fetchSettings()
    // Загружаем заявки и пользователей, если пользователь главный админ
    // Проверяем через API, так как сессия может быть не полностью загружена
    checkAndLoadAdminData()
  }, [session])

  const checkAndLoadAdminData = async () => {
    try {
      const accessResponse = await fetch("/api/check-admin-access")
      if (accessResponse.ok) {
        const accessData = await accessResponse.json()
        const mainAdmin = accessData.isMainAdmin === true
        setIsMainAdmin(mainAdmin)
        if (mainAdmin) {
          fetchAdminRequests()
          fetchUsers()
        }
      }
    } catch (error) {
      console.error("Error checking admin access:", error)
      setIsMainAdmin(false)
    }
  }

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

  const fetchAdminRequests = async () => {
    try {
      const response = await fetch("/api/admin-requests")
      if (response.ok) {
        const data = await response.json()
        console.log("[AdminSettings] Loaded admin requests:", data)
        setAdminRequests(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("[AdminSettings] Error fetching admin requests:", response.status, errorData)
      }
    } catch (error) {
      console.error("[AdminSettings] Error fetching admin requests:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        console.log("[AdminSettings] Loaded users:", data)
        setUsers(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error("[AdminSettings] Error fetching users:", response.status, errorData)
      }
    } catch (error) {
      console.error("[AdminSettings] Error fetching users:", error)
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

  const handleReviewRequest = async (requestId: string, status: "approved" | "rejected") => {
    if (!confirm(`Вы уверены, что хотите ${status === "approved" ? "одобрить" : "отклонить"} эту заявку?`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin-requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        await fetchAdminRequests()
        await fetchUsers()
        alert(`Заявка ${status === "approved" ? "одобрена" : "отклонена"}`)
      } else {
        const error = await response.json()
        alert(error.error || "Ошибка при обновлении заявки")
      }
    } catch (error) {
      console.error("Error reviewing request:", error)
      alert("Ошибка при обновлении заявки")
    }
  }

  const handleTransferMainAdmin = async (userId: string) => {
    if (!confirm("Вы уверены, что хотите передать права главного администратора? Вы потеряете эти права!")) {
      return
    }

    try {
      const response = await fetch("/api/admin/transfer-main-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        alert("Права главного администратора успешно переданы. Пожалуйста, перезагрузите страницу.")
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || "Ошибка при передаче прав")
      }
    } catch (error) {
      console.error("Error transferring main admin:", error)
      alert("Ошибка при передаче прав")
    }
  }

  // Не удаляет пользователя - только отзывает права администратора
  // (удаляет его AdminRequest). Сам аккаунт и его данные остаются.
  const handleRevokeAdmin = async (id: string) => {
    if (!confirm("Отозвать права администратора у этого пользователя?")) return

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchUsers()
        alert("Права администратора отозваны")
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        alert(errorData.error || `Ошибка при отзыве прав администратора`)
      }
    } catch (error: any) {
      console.error("Error revoking admin:", error)
      alert(error.message || "Ошибка при отзыве прав администратора")
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Загрузка настроек...</div>
  }

  const pendingRequests = adminRequests.filter(r => r.status === "pending")
  const approvedAdmins = users.filter(u => 
    u.isMainAdmin || (u.adminRequest && u.adminRequest.status === "approved")
  )

  console.log("[AdminSettings] Debug:", {
    sessionUserId: session?.user?.id,
    sessionIsMainAdmin: session?.user?.isMainAdmin,
    isMainAdmin,
    usersCount: users.length,
    approvedAdminsCount: approvedAdmins.length,
    users: users.map(u => ({ id: u.id, email: u.email, isMainAdmin: u.isMainAdmin, hasRequest: !!u.adminRequest }))
  })

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
        <>
          {/* Заявки на администрирование */}
          <div className="bg-background-1 border border-stroke-1 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-secondary mb-4">
              Заявки на администрирование
              {pendingRequests.length > 0 && (
                <span className="ml-2 text-sm font-normal text-yellow-600">
                  ({pendingRequests.length} ожидают рассмотрения)
                </span>
              )}
            </h2>
            {adminRequests.length === 0 ? (
              <p className="text-gray-600">Нет заявок на администрирование</p>
            ) : (
              <div className="space-y-4">
                {adminRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-4 rounded-lg border ${
                      request.status === "pending"
                        ? "bg-yellow-50 border-yellow-200"
                        : request.status === "approved"
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {request.user.image && (
                            <img
                              src={request.user.image}
                              alt={request.user.name || "User"}
                              className="w-10 h-10 rounded-full"
                            />
                          )}
                          <div>
                            <p className="font-medium">
                              {request.user.name || request.user.twitchLogin || request.user.email}
                            </p>
                            <p className="text-sm text-gray-600">
                              @{request.user.twitchLogin || "не указан"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {request.user.email}
                            </p>
                          </div>
                        </div>
                        {request.message && (
                          <p className="text-sm text-gray-700 mt-2 italic">
                            "{request.message}"
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Отправлена: {new Date(request.createdAt).toLocaleString("ru-RU")}
                        </p>
                        {request.reviewedAt && (
                          <p className="text-xs text-gray-500">
                            Рассмотрена: {new Date(request.reviewedAt).toLocaleString("ru-RU")}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {request.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleReviewRequest(request.id, "approved")}
                              className="btn btn-sm bg-green-600 border-green-700 text-white hover:bg-green-700"
                            >
                              Одобрить
                            </button>
                            <button
                              onClick={() => handleReviewRequest(request.id, "rejected")}
                              className="btn btn-sm bg-red-600 border-red-700 text-white hover:bg-red-700"
                            >
                              Отклонить
                            </button>
                          </>
                        )}
                        {request.status === "approved" && (
                          <span className="text-green-700 font-medium">✓ Одобрена</span>
                        )}
                        {request.status === "rejected" && (
                          <span className="text-red-700 font-medium">✗ Отклонена</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Управление администраторами */}
          <div className="bg-background-1 border border-stroke-1 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-secondary mb-4">Управление администраторами</h2>
            {approvedAdmins.length === 0 ? (
              <p className="text-gray-600">Нет администраторов</p>
            ) : (
              <div className="space-y-2">
                {approvedAdmins.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-background-2 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{user.name || user.twitchLogin || user.email}</p>
                        <p className="text-sm text-gray-600">
                          {user.twitchLogin && `@${user.twitchLogin}`}
                          {user.isMainAdmin && (
                            <span className="ml-2 text-primary-600 font-semibold">
                              (Главный администратор)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!user.isMainAdmin && (
                        <button
                          onClick={() => handleTransferMainAdmin(user.id)}
                          className="btn btn-sm bg-blue-600 border-blue-700 text-white hover:bg-blue-700"
                          title="Передать права главного администратора"
                        >
                          Сделать главным
                        </button>
                      )}
                      {!user.isMainAdmin && (
                        <button
                          onClick={() => handleRevokeAdmin(user.id)}
                          className="btn btn-sm bg-red-600 border-red-700 text-white hover:bg-red-700"
                          title="Отозвать права администратора (аккаунт не удаляется)"
                        >
                          Отозвать права
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
