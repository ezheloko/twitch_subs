"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core"
import DraggableAvatar from "./DraggableAvatar"
import AvatarPanel from "./AvatarPanel"
import CanvasDroppableWrapper from "./CanvasDroppableWrapper"

interface Furniture {
  id: string
  imageUrl: string
  x: number
  y: number
  width: number
  height: number
  layerIndex: number
  isLocked?: boolean
}

interface Room {
  id: string
  title: string
  orderNumber: number
  backgroundUrl: string
}

interface Avatar {
  id: string
  username: string
  imageUrl: string
  x: number
  y: number
  width: number
  height: number
  layerIndex: number
  isLocked: boolean
  isActive: boolean
  subscriptionDate?: string | Date
  reactivationCount?: number
  createdAt?: string | Date
}

export default function SubscribersCanvas({
  room,
  onBack,
}: {
  room: Room
  onBack: () => void
}) {
  const [avatars, setAvatars] = useState<Avatar[]>([])
  const [allAvatars, setAllAvatars] = useState<Avatar[]>([])
  const [furniture, setFurniture] = useState<Furniture[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const canvasRef = useRef<HTMLDivElement>(null)
  
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  )

  useEffect(() => {
    fetchRoomData()
  }, [room.id])

  const fetchRoomData = async () => {
    try {
      // Получаем активные аватары и предметы интерьера для комнаты
      const roomResponse = await fetch(`/api/rooms/${room.id}`)
      if (roomResponse.ok) {
        const roomData = await roomResponse.json()
        setAvatars(roomData.avatars || [])
        setFurniture(roomData.furniture || []) // Предметы интерьера для визуализации
      }
      
      // Получаем все аватары (включая неактивные) для списка
      const avatarsResponse = await fetch(`/api/avatars?roomId=${room.id}`)
      if (avatarsResponse.ok) {
        const allAvatarsData = await avatarsResponse.json()
        setAllAvatars(allAvatarsData || [])
      }
    } catch (error) {
      console.error("Error fetching room data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateAvatar = async (id: string, updates: Partial<Avatar>) => {
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    ) as Partial<Avatar>

    if (Object.keys(cleanUpdates).length === 0) {
      console.warn("No updates to apply for avatar:", id)
      return
    }

    try {
      const response = await fetch(`/api/avatars/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanUpdates),
      })

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        console.error("Failed to update avatar:", response.status, errorData)
        throw new Error(`Failed to update avatar: ${errorData.error || response.statusText}`)
      }

      const updatedAvatar = await response.json()
      const { room: _, avatarBase: __, ...avatarData } = updatedAvatar
      setAvatars((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...avatarData } : a))
      )
      setAllAvatars((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...avatarData } : a))
      )
    } catch (error: any) {
      console.error("Error updating avatar:", error)
      await fetchRoomData()
    }
  }

  // Обработка управления стрелками клавиатуры для выбранного аватара
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (selectedAvatarId) {
        const selectedAvatar = avatars.find((a) => a.id === selectedAvatarId)
        if (!selectedAvatar) return

        let newX = selectedAvatar.x
        let newY = selectedAvatar.y
        let moved = false

        switch (e.key) {
          case "ArrowUp":
            e.preventDefault()
            newY = Math.max(0, selectedAvatar.y - 1)
            moved = true
            break
          case "ArrowDown":
            e.preventDefault()
            const canvasHeight = canvasRef.current?.offsetHeight || 1080
            newY = Math.min(canvasHeight - (selectedAvatar.height || 150), selectedAvatar.y + 1)
            moved = true
            break
          case "ArrowLeft":
            e.preventDefault()
            newX = Math.max(0, selectedAvatar.x - 1)
            moved = true
            break
          case "ArrowRight":
            e.preventDefault()
            const canvasWidth = canvasRef.current?.offsetWidth || 1920
            newX = Math.min(canvasWidth - (selectedAvatar.width || 150), selectedAvatar.x + 1)
            moved = true
            break
        }

        if (moved) {
          setAvatars((prev) =>
            prev.map((a) =>
              a.id === selectedAvatarId
                ? { ...a, x: newX, y: newY }
                : a
            )
          )
          if (newX !== selectedAvatar.x || newY !== selectedAvatar.y) {
            updateAvatar(selectedAvatarId, {
              x: newX,
              y: newY,
              isLocked: selectedAvatar.isLocked ?? false,
            })
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedAvatarId, avatars])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setActiveId(null)
      return
    }

    const activeElement = avatars.find((item) => item.id === active.id)
    if (!activeElement || !canvasRef.current) {
      setActiveId(null)
      return
    }

    let x = activeElement.x
    let y = activeElement.y

    if (event.delta) {
      x = activeElement.x + event.delta.x
      y = activeElement.y + event.delta.y
    }

    const canvasWidth = canvasRef.current?.offsetWidth || 1920
    const canvasHeight = canvasRef.current?.offsetHeight || 1080
    x = Math.max(0, Math.min(x, canvasWidth - (activeElement.width || 200)))
    y = Math.max(0, Math.min(y, canvasHeight - (activeElement.height || 200)))

    if (x !== activeElement.x || y !== activeElement.y) {
      setAvatars((prev) =>
        prev.map((a) => (a.id === activeElement.id ? { ...a, x, y } : a))
      )
      updateAvatar(activeElement.id, { x, y, isLocked: activeElement.isLocked ?? false })
    }

    setActiveId(null)
  }

  const handleLayerChange = async (id: string, newLayer: number) => {
    setAvatars((prev) =>
      prev.map((a) => (a.id === id ? { ...a, layerIndex: newLayer } : a))
    )
    await updateAvatar(id, { layerIndex: newLayer })
    fetchRoomData()
  }

  if (isLoading) {
    return <div className="text-center py-8">Загрузка комнаты...</div>
  }

  // Сортируем все элементы (аватары и предметы интерьера) по layerIndex для правильного отображения
  const allElements = [
    ...avatars.map((a) => ({ ...a, type: "avatar" as const })),
    ...furniture.map((f) => ({ ...f, type: "furniture" as const })),
  ].sort((a, b) => a.layerIndex - b.layerIndex)

  return (
    <div className="h-screen flex flex-col bg-background-2">
      {/* Header */}
      <div className="bg-background-1 border-b border-stroke-1 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={onBack}
              className="btn btn-sm bg-gray-600 border-gray-700 text-white hover:bg-gray-700"
            >
              <span>← Назад</span>
            </button>
            <h2 className="text-xl font-bold">Подписчики: {room.title}</h2>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          collisionDetection={closestCenter}
        >
          {/* Canvas */}
          <div 
            className="flex-1 relative overflow-auto bg-gray-100 flex items-center justify-center"
            onClick={(e) => {
              if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.canvas-background')) {
                setSelectedAvatarId(null)
              }
            }}
          >
            <CanvasDroppableWrapper canvasRef={canvasRef} room={room}>
              {/* Все элементы (предметы интерьера и аватары) рендерятся вместе, отсортированные по layerIndex */}
              {allElements.map((element) => {
                if (element.type === "furniture") {
                  return (
                    <div
                      key={element.id}
                      style={{
                        position: "absolute",
                        left: `${element.x}px`,
                        top: `${element.y}px`,
                        width: `${element.width}px`,
                        height: `${element.height}px`,
                        zIndex: element.layerIndex + 100, // Общая система слоев с аватарами
                        pointerEvents: "none", // Нельзя взаимодействовать с предметами интерьера
                      }}
                    >
                      <img
                        src={element.imageUrl}
                        alt="Furniture"
                        style={{
                          width: `${element.width}px`,
                          height: `${element.height}px`,
                          objectFit: "none",
                          display: "block",
                        }}
                      />
                    </div>
                  )
                } else {
                  // Это аватар
                  const avatar = element as Avatar
                  return (
                    <DraggableAvatar
                      key={avatar.id}
                      avatar={avatar}
                      disabled={selectedAvatarId !== null && selectedAvatarId !== avatar.id}
                      onLayerChange={(newLayer) => handleLayerChange(avatar.id, newLayer)}
                      onUpdate={(updates) => updateAvatar(avatar.id, updates)}
                      onDelete={async () => {
                        if (confirm("Удалить этого подписчика?")) {
                          try {
                            const response = await fetch(`/api/avatars/${avatar.id}`, { method: "DELETE" })
                            if (response.ok) {
                              await fetchRoomData()
                              setSelectedAvatarId(null)
                            } else {
                              alert("Ошибка при удалении подписчика")
                            }
                          } catch (error) {
                            console.error("Error deleting avatar:", error)
                            alert("Ошибка при удалении подписчика")
                          }
                        }
                      }}
                      selectedId={selectedAvatarId}
                      onSelect={(id) => {
                        if (selectedAvatarId && selectedAvatarId !== id && id !== null) {
                          return
                        }
                        setSelectedAvatarId(id)
                      }}
                    />
                  )
                }
              })}

              <DragOverlay>
                {activeId ? (
                  (() => {
                    const element = allElements.find((e) => e.id === activeId)
                    if (element) {
                      return (
                        <div 
                          className="opacity-80 pointer-events-none"
                          style={{
                            width: `${element.width || 200}px`,
                            height: `${element.height || 200}px`,
                          }}
                        >
                          <img
                            src={element.imageUrl}
                            alt="Dragging"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )
                    }
                    return null
                  })()
                ) : null}
              </DragOverlay>
            </CanvasDroppableWrapper>
          </div>

          {/* Control Panel */}
          <div className="bg-background-1 border-t border-stroke-1 overflow-y-auto flex-shrink-0 max-h-64">
            <AvatarPanel
              roomId={room.id}
              onAvatarAdded={fetchRoomData}
              existingAvatars={allAvatars}
              onAvatarLayerChange={async (id, newLayer) => {
                await handleLayerChange(id, newLayer)
                // Обновляем allAvatars для отображения в панели
                setAllAvatars((prev) =>
                  prev.map((a) => (a.id === id ? { ...a, layerIndex: newLayer } : a))
                )
              }}
            />
          </div>
        </DndContext>
      </div>
    </div>
  )
}
