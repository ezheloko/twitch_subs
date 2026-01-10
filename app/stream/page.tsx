"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import PublicRoomView from "@/components/PublicRoomView"

interface Room {
  id: string
  title: string
  orderNumber: number
  backgroundUrl: string
  avatars: Array<{
    id: string
    username: string
    imageUrl: string
    x: number
    y: number
    width: number
    height: number
    layerIndex: number
    twitchUrl: string
    userpicUrl?: string | null
    subscriptionDate: string | Date
    createdAt: string | Date
    reactivationCount?: number
  }>
  furniture: Array<{
    id: string
    imageUrl: string
    x: number
    y: number
    width: number
    height: number
    layerIndex: number
  }>
}

interface StreamSettings {
  id: string
  slideDuration: number
  transitionType: "none" | "fade"
  streamUrl?: string
}

export default function StreamPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0)
  const [streamSettings, setStreamSettings] = useState<StreamSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    fetchRooms()
    fetchStreamSettings()
  }, [])

  const startAutoSwitch = useCallback(() => {
    // Очищаем предыдущие таймеры
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }

    if (!streamSettings || rooms.length === 0) return

    const duration = streamSettings.slideDuration * 1000 // Конвертируем в миллисекунды

    timerRef.current = setTimeout(() => {
      if (streamSettings.transitionType === "none") {
        // Без анимации - сразу переключаем
        setCurrentRoomIndex((prev) => (prev + 1) % rooms.length)
      } else {
        // С анимацией fade
        setIsTransitioning(true)
        // Задержка для анимации перехода (500ms для fade)
        transitionTimerRef.current = setTimeout(() => {
          // Переходим к следующей комнате (циклически)
          setCurrentRoomIndex((prev) => (prev + 1) % rooms.length)
          // Сбрасываем флаг перехода после завершения анимации
          setTimeout(() => {
            setIsTransitioning(false)
          }, 50)
        }, 500) // Длительность fade анимации
      }
    }, duration)
  }, [streamSettings, rooms.length])

  // Инициализация: запускаем таймер когда данные готовы
  useEffect(() => {
    if (rooms.length > 0 && streamSettings && !isInitializedRef.current) {
      isInitializedRef.current = true
      startAutoSwitch()
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current)
      }
    }
  }, [rooms, streamSettings, startAutoSwitch])

  // Перезапускаем таймер только после завершения перехода (для fade) или сразу (для none)
  useEffect(() => {
    // Для "none" не нужно ждать завершения перехода, так как перехода нет
    if (streamSettings?.transitionType === "none") {
      // Для none перезапускаем таймер сразу после смены комнаты
      if (isInitializedRef.current && rooms.length > 0 && streamSettings) {
        const timeout = setTimeout(() => {
          startAutoSwitch()
        }, 100)
        return () => clearTimeout(timeout)
      }
    } else {
      // Для fade ждем завершения перехода
      if (!isTransitioning && isInitializedRef.current && rooms.length > 0 && streamSettings) {
        const timeout = setTimeout(() => {
          startAutoSwitch()
        }, 100)
        return () => clearTimeout(timeout)
      }
    }
  }, [isTransitioning, startAutoSwitch, rooms.length, streamSettings, currentRoomIndex])

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms")
      if (response.ok) {
        const data = await response.json()
        // Фильтруем только активные аватары
        const roomsWithActiveAvatars = data.map((room: Room) => ({
          ...room,
          avatars: room.avatars.filter((avatar: any) => avatar.isActive !== false),
        }))
        const sortedRooms = roomsWithActiveAvatars.sort(
          (a: Room, b: Room) => a.orderNumber - b.orderNumber
        )
        setRooms(sortedRooms)
        if (sortedRooms.length > 0) {
          setCurrentRoomIndex(0)
        }
      }
    } catch (error) {
      console.error("Error fetching rooms:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStreamSettings = async () => {
    try {
      const response = await fetch("/api/stream-settings")
      if (response.ok) {
        const data = await response.json()
        setStreamSettings(data)
      }
    } catch (error) {
      console.error("Error fetching stream settings:", error)
      // Используем дефолтные настройки
      setStreamSettings({
        id: "",
        slideDuration: 15,
        transitionType: "none",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-5 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-2xl font-bold mb-2">Загрузка...</div>
        </div>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="min-h-screen bg-background-5 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-2xl font-bold mb-2">Комнаты не созданы</div>
          <p className="text-gray-400">
            Администратор еще не создал ни одной комнаты
          </p>
        </div>
      </div>
    )
  }

  const currentRoom = rooms[currentRoomIndex]

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ margin: 0, padding: 0 }}
    >
      {/* Текущая комната */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: streamSettings?.transitionType === "fade" && isTransitioning ? 0 : 1,
          transition: streamSettings?.transitionType === "fade" ? "opacity 500ms ease-in-out" : "none",
        }}
      >
        <PublicRoomView
          room={currentRoom}
          onNavigate={undefined}
          hasPrev={false}
          hasNext={false}
        />
      </div>
    </div>
  )
}
