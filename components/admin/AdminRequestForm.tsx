"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface AdminRequest {
  id: string
  status: "pending" | "approved" | "rejected"
  message?: string
  createdAt: string
  reviewedAt?: string
}

export default function AdminRequestForm() {
  const { data: session } = useSession()
  const [request, setRequest] = useState<AdminRequest | null>(null)
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRequest()
  }, [])

  const fetchRequest = async () => {
    try {
      const response = await fetch("/api/admin-requests")
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          setRequest(data[0])
          if (data[0].message) {
            setMessage(data[0].message)
          }
        }
      }
    } catch (error) {
      console.error("Error fetching request:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/admin-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message.trim() || null }),
      })

      if (response.ok) {
        const data = await response.json()
        setRequest(data)
        alert("Заявка отправлена! Главный администратор рассмотрит её в ближайшее время.")
      } else {
        const error = await response.json()
        alert(error.error || "Ошибка при отправке заявки")
      }
    } catch (error) {
      console.error("Error submitting request:", error)
      alert("Ошибка при отправке заявки")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-4">Загрузка...</div>
  }

  if (request?.status === "approved") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800 font-medium">✅ Ваша заявка на администрирование одобрена!</p>
        <p className="text-green-600 text-sm mt-1">
          Обновите страницу, чтобы получить доступ к админ-панели.
        </p>
      </div>
    )
  }

  if (request?.status === "rejected") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-medium">❌ Ваша заявка на администрирование отклонена</p>
        {request.reviewedAt && (
          <p className="text-red-600 text-sm mt-1">
            Рассмотрена: {new Date(request.reviewedAt).toLocaleString("ru-RU")}
          </p>
        )}
        <button
          onClick={() => {
            setRequest(null)
            setMessage("")
          }}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Отправить новую заявку
        </button>
      </div>
    )
  }

  if (request?.status === "pending") {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800 font-medium">⏳ Ваша заявка на администрирование ожидает рассмотрения</p>
        <p className="text-yellow-600 text-sm mt-1">
          Отправлена: {new Date(request.createdAt).toLocaleString("ru-RU")}
        </p>
        {request.message && (
          <p className="text-yellow-700 text-sm mt-2 italic">"{request.message}"</p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-background-1 border border-stroke-1 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Заявка на администрирование</h3>
      <p className="text-gray-600 mb-4">
        Отправьте заявку главному администратору для получения доступа к админ-панели.
        Ваши данные из Twitch будут автоматически переданы.
      </p>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Сообщение (необязательно)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Расскажите, почему вы хотите стать администратором..."
            className="w-full px-4 py-2 border border-stroke-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={4}
          />
        </div>
        <div className="bg-background-2 p-3 rounded-lg text-sm">
          <p className="font-medium mb-1">Ваши данные из Twitch:</p>
          <p>Логин: <strong>{session?.user?.twitchLogin || "не указан"}</strong></p>
          <p>Имя: <strong>{session?.user?.name || "не указано"}</strong></p>
          <p>Email: <strong>{session?.user?.email || "не указан"}</strong></p>
        </div>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="btn btn-primary btn-base w-full disabled:opacity-50"
        >
          <span>{isSubmitting ? "Отправка..." : "Отправить заявку"}</span>
        </button>
      </div>
    </div>
  )
}
