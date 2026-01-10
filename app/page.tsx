"use client"

import { useState, useEffect } from "react"
import PublicRoomView from "@/components/PublicRoomView"
import RoomsTilesView from "@/components/RoomsTilesView"

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

export default function HomePage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0)
  const [viewMode, setViewMode] = useState<"room" | "tiles">("room")
  const [isLoading, setIsLoading] = useState(true)
  const [showNames, setShowNames] = useState(false)

  useEffect(() => {
    fetchRooms()
  }, [])

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
        setRooms(roomsWithActiveAvatars)
        if (roomsWithActiveAvatars.length > 0) {
          setCurrentRoomIndex(0)
        }
      }
    } catch (error) {
      console.error("Error fetching rooms:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNavigate = (direction: "prev" | "next") => {
    if (direction === "prev" && currentRoomIndex > 0) {
      setCurrentRoomIndex(currentRoomIndex - 1)
    } else if (direction === "next" && currentRoomIndex < rooms.length - 1) {
      setCurrentRoomIndex(currentRoomIndex + 1)
    } else if (direction === "next" && currentRoomIndex === rooms.length - 1) {
      // Циклический переход: после последней возвращаемся к первой
      setCurrentRoomIndex(0)
    } else if (direction === "prev" && currentRoomIndex === 0) {
      // Циклический переход: перед первой переходим к последней
      setCurrentRoomIndex(rooms.length - 1)
    }
  }

  const handleRoomSelect = (roomId: string) => {
    const index = rooms.findIndex((r) => r.id === roomId)
    if (index !== -1) {
      setCurrentRoomIndex(index)
      setViewMode("room")
    }
  }

  // Обработка клавиатурной навигации
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== "room") return

      if (e.key === "ArrowLeft") {
        e.preventDefault()
        handleNavigate("prev")
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        handleNavigate("next")
      } else if (e.key === "Escape") {
        setViewMode("tiles")
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentRoomIndex, rooms.length, viewMode])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Загрузка...</div>
        </div>
      </div>
    )
  }

  if (rooms.length === 0) {
    return (
      <div className="min-h-screen bg-background-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">Комнаты не созданы</div>
          <p className="text-gray-600">
            Администратор еще не создал ни одной комнаты
          </p>
        </div>
      </div>
    )
  }

  if (viewMode === "tiles") {
    return (
      <RoomsTilesView
        rooms={rooms}
        onRoomSelect={handleRoomSelect}
        onBack={() => setViewMode("room")}
      />
    )
  }

  const currentRoom = rooms[currentRoomIndex]
  const hasPrev = currentRoomIndex > 0 || rooms.length > 1
  const hasNext = currentRoomIndex < rooms.length - 1 || rooms.length > 1

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ margin: 0, padding: 0 }}>
      {/* Кнопка переключения отображения имен */}
      <button
        onClick={() => setShowNames(!showNames)}
        className="absolute top-0 z-50 bg-black/70 backdrop-blur-sm hover:bg-white transition-colors border-0 group"
        style={{ 
          position: "absolute", 
          top: 0, 
          right: "44px", 
          zIndex: 1000, 
          borderRadius: "0 0 0 8px", 
          margin: 0, 
          padding: "12px",
          cursor: "pointer"
        }}
        title={showNames ? "Скрыть имена" : "Показать имена"}
      >
        <div className="relative">
          {/* Иконка текста/имени */}
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={`text-white group-hover:text-black transition-colors ${showNames ? "opacity-100" : "opacity-70"}`}
          >
            <path d="M4 20h16" />
            <path d="M6 16l6-12 6 12" />
            <path d="M8 14h8" />
          </svg>
          
          {/* Всплывающая подсказка */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-black/90 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            {showNames ? "Скрыть имена" : "Показать имена"}
          </div>
        </div>
      </button>

      {/* Кнопка переключения в режим плитки */}
      <button
        onClick={() => setViewMode("tiles")}
        className="absolute top-0 right-0 z-50 bg-black/70 backdrop-blur-sm hover:bg-white transition-colors border-0 group"
        style={{ 
          position: "absolute", 
          top: 0, 
          right: 0, 
          zIndex: 1000, 
          borderRadius: "0 0 0 8px", 
          margin: 0, 
          padding: "12px",
          cursor: "pointer"
        }}
        title="Все комнаты"
      >
        <div className="relative">
          {/* Иконка ромбов */}
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 20 25" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.2" 
            className="text-white group-hover:text-black transition-colors"
          >
            {/* Верхний ромб */}
            <path d="M10 1.5 L11.2 4 L10 6.5 L8.8 4 Z" />
            {/* Второй ряд - два ромба */}
            <path d="M6 6 L7.2 8.5 L6 11 L4.8 8.5 Z" />
            <path d="M14 6 L15.2 8.5 L14 11 L12.8 8.5 Z" />
            {/* Третий ряд - три ромба */}
            <path d="M2 10.5 L3.2 13 L2 15.5 L0.8 13 Z" />
            <path d="M10 10.5 L11.2 13 L10 15.5 L8.8 13 Z" />
            <path d="M18 10.5 L19.2 13 L18 15.5 L16.8 13 Z" />
            {/* Четвертый ряд - два ромба */}
            <path d="M6 15 L7.2 17.5 L6 20 L4.8 17.5 Z" />
            <path d="M14 15 L15.2 17.5 L14 20 L12.8 17.5 Z" />
            {/* Нижний ромб */}
            <path d="M10 18.5 L11.2 21 L10 23.5 L8.8 21 Z" />
          </svg>
          
          {/* Всплывающая подсказка */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-3 py-1.5 bg-black/90 text-white text-sm rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            Все комнаты
          </div>
        </div>
      </button>

      {/* Индикатор текущей комнаты */}
      <div
        className="absolute top-0 left-0 z-50 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-br-lg text-sm"
        style={{ position: "absolute", top: 0, left: 0, zIndex: 1000, margin: 0 }}
      >
        {currentRoomIndex + 1} / {rooms.length}
      </div>

      <PublicRoomView
        room={currentRoom}
        onNavigate={handleNavigate}
        hasPrev={hasPrev}
        hasNext={hasNext}
        showNames={showNames}
      />
    </div>
  )
}
