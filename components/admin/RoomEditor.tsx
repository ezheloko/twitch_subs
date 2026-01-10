"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import RoomCanvas from "./RoomCanvas"
import SubscribersCanvas from "./SubscribersCanvas"
import RoomCard from "./RoomCard"

interface Room {
  id: string
  title: string
  orderNumber: number
  backgroundUrl: string
  createdAt: string
  updatedAt: string
}

export default function RoomEditor() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [selectedRoomForSubscribers, setSelectedRoomForSubscribers] = useState<Room | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRoomTitle, setNewRoomTitle] = useState("")
  const [newRoomBackground, setNewRoomBackground] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms")
      if (response.ok) {
        const data = await response.json()
        setRooms(data.sort((a: Room, b: Room) => a.orderNumber - b.orderNumber))
      }
    } catch (error) {
      console.error("Error fetching rooms:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateRoom = async () => {
    if (!newRoomTitle || !newRoomBackground) {
      alert("Заполните все поля")
      return
    }

    setUploading(true)
    try {
      // Загружаем фон
      const formData = new FormData()
      formData.append("file", newRoomBackground)
      formData.append("type", "background")

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Ошибка загрузки фона")
      }

      const { url } = await uploadResponse.json()

      // Создаем комнату
      const createResponse = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newRoomTitle,
          backgroundUrl: url,
        }),
      })

      if (createResponse.ok) {
        await fetchRooms()
        setShowCreateForm(false)
        setNewRoomTitle("")
        setNewRoomBackground(null)
      }
    } catch (error) {
      console.error("Error creating room:", error)
      alert("Ошибка при создании комнаты")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteRoom = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить эту комнату?")) return

    try {
      const response = await fetch(`/api/rooms/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchRooms()
        if (selectedRoom?.id === id) {
          setSelectedRoom(null)
        }
      }
    } catch (error) {
      console.error("Error deleting room:", error)
      alert("Ошибка при удалении комнаты")
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = rooms.findIndex((room) => room.id === active.id)
      const newIndex = rooms.findIndex((room) => room.id === over.id)

      const newRooms = arrayMove(rooms, oldIndex, newIndex)
      setRooms(newRooms)

      // Подготавливаем данные для массового обновления
      const roomOrders = newRooms.map((room, index) => ({
        id: room.id,
        orderNumber: index + 1,
      }))

      try {
        const response = await fetch("/api/rooms/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomOrders }),
        })

        if (!response.ok) {
          throw new Error("Failed to reorder rooms")
        }
      } catch (error) {
        console.error("Error updating room order:", error)
        // Восстанавливаем исходный порядок при ошибке
        await fetchRooms()
        alert("Ошибка при обновлении порядка комнат")
      }
    }
  }

  if (selectedRoomForSubscribers) {
    return (
      <SubscribersCanvas
        room={selectedRoomForSubscribers}
        onBack={() => setSelectedRoomForSubscribers(null)}
      />
    )
  }

  if (selectedRoom) {
    return (
      <RoomCanvas
        room={selectedRoom}
        onBack={() => setSelectedRoom(null)}
        onRoomUpdate={fetchRooms}
      />
    )
  }

  if (isLoading) {
    return <div className="text-center py-8">Загрузка комнат...</div>
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-secondary">Управление комнатами</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="btn btn-primary btn-base"
        >
          <span>{showCreateForm ? "Отмена" : "+ Создать комнату"}</span>
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-background-1 border border-stroke-1 rounded-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Создать новую комнату</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Название комнаты</label>
              <input
                type="text"
                value={newRoomTitle}
                onChange={(e) => setNewRoomTitle(e.target.value)}
                placeholder="Введите название"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Фон (1920x1080)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewRoomBackground(e.target.files?.[0] || null)}
              />
            </div>
            <button
              onClick={handleCreateRoom}
              disabled={uploading}
              className="btn btn-primary btn-base disabled:opacity-50"
            >
              <span>{uploading ? "Создание..." : "Создать"}</span>
            </button>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={rooms.map((r) => r.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onSelect={() => setSelectedRoom(room)}
                onSubscribers={() => setSelectedRoomForSubscribers(room)}
                onDelete={() => handleDeleteRoom(room.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {rooms.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Комнаты не созданы. Создайте первую комнату!
        </div>
      )}
    </div>
  )
}
