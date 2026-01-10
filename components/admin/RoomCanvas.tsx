"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core"
import DraggableFurniture from "./DraggableFurniture"
import FurniturePanel from "./FurniturePanel"
import CanvasDroppableWrapper from "./CanvasDroppableWrapper"

interface Room {
  id: string
  title: string
  orderNumber: number
  backgroundUrl: string
}

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

export default function RoomCanvas({
  room,
  onBack,
  onRoomUpdate,
}: {
  room: Room
  onBack: () => void
  onRoomUpdate: () => void
}) {
  const [furniture, setFurniture] = useState<Furniture[]>([])
  const [furnitureBases, setFurnitureBases] = useState<Array<{ id: string; imageUrl: string }>>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedFurnitureId, setSelectedFurnitureId] = useState<string | null>(null)
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
      const response = await fetch(`/api/rooms/${room.id}`)
      if (response.ok) {
        const data = await response.json()
        setFurniture(data.furniture || [])
        
        // Обновляем базу предметов интерьера - объединяем с существующими
        const newBases = (data.furniture || []).map((f: Furniture) => ({
          id: `furniture-base-${f.id}`,
          imageUrl: f.imageUrl,
        }))
        
        // Объединяем с существующими bases, чтобы не потерять загруженные, но еще не добавленные предметы
        setFurnitureBases((prev) => {
          const existingUrls = new Set(newBases.map((b: { id: string; imageUrl: string }) => b.imageUrl))
          const uniquePrev = prev.filter((b: { id: string; imageUrl: string }) => !existingUrls.has(b.imageUrl))
          return [...newBases, ...uniquePrev]
        })
      }
    } catch (error) {
      console.error("Error fetching room data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFurniture = useCallback(async (id: string, updates: Partial<Furniture>) => {
    // Фильтруем undefined значения перед отправкой
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    ) as Partial<Furniture>

    // Проверяем, что есть данные для обновления
    if (Object.keys(cleanUpdates).length === 0) {
      console.warn("No updates to apply for furniture:", id, "Original updates:", updates)
      return
    }

    try {
      const response = await fetch(`/api/furniture/${id}`, {
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
        console.error("Failed to update furniture:", response.status, errorData, "Updates:", updates)
        throw new Error(`Failed to update furniture: ${errorData.error || response.statusText}`)
      }

      // Получаем обновленные данные с сервера
      const updatedFurniture = await response.json()
      
      // Обновляем локальное состояние из ответа сервера (исключаем room из ответа)
      const { room: _, ...furnitureData } = updatedFurniture
      setFurniture((prev) =>
        prev.map((f) => (f.id === id ? { 
          ...f, 
          x: furnitureData.x ?? f.x,
          y: furnitureData.y ?? f.y,
          width: furnitureData.width ?? f.width,
          height: furnitureData.height ?? f.height,
          layerIndex: furnitureData.layerIndex ?? f.layerIndex,
          isLocked: furnitureData.isLocked ?? f.isLocked,
        } : f))
      )
    } catch (error) {
      console.error("Error updating furniture:", error)
      // В случае ошибки перезагружаем данные
      await fetchRoomData()
    }
  }, [room.id])

  // Обработка управления стрелками клавиатуры для выбранного предмета
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Проверяем, что фокус не на input или textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      // Обработка для предметов интерьера
      if (selectedFurnitureId) {
        const selectedFurniture = furniture.find((f) => f.id === selectedFurnitureId)
        if (!selectedFurniture) return

        let newX = selectedFurniture.x
        let newY = selectedFurniture.y
        let moved = false

        switch (e.key) {
          case "ArrowUp":
            e.preventDefault()
            newY = Math.max(0, selectedFurniture.y - 1)
            moved = true
            break
          case "ArrowDown":
            e.preventDefault()
            const canvasHeight = canvasRef.current?.offsetHeight || 1080
            newY = Math.min(canvasHeight - (selectedFurniture.height || 200), selectedFurniture.y + 1)
            moved = true
            break
          case "ArrowLeft":
            e.preventDefault()
            newX = Math.max(0, selectedFurniture.x - 1)
            moved = true
            break
          case "ArrowRight":
            e.preventDefault()
            const canvasWidth = canvasRef.current?.offsetWidth || 1920
            newX = Math.min(canvasWidth - (selectedFurniture.width || 200), selectedFurniture.x + 1)
            moved = true
            break
        }

        if (moved) {
          // Оптимистичное обновление
          setFurniture((prev) =>
            prev.map((f) =>
              f.id === selectedFurnitureId
                ? { ...f, x: newX, y: newY }
                : f
            )
          )
          // Обновляем на сервере, сохраняя isLocked
          if (newX !== selectedFurniture.x || newY !== selectedFurniture.y) {
            updateFurniture(selectedFurnitureId, {
              x: newX,
              y: newY,
              isLocked: selectedFurniture.isLocked ?? false,
            })
          }
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedFurnitureId, furniture, updateFurniture])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      setActiveId(null)
      return
    }

    // Если перетаскиваем существующий элемент
    const activeElement = furniture.find((item) => item.id === active.id)
    if (!activeElement || !canvasRef.current) {
      setActiveId(null)
      return
    }

    let x = activeElement.x
    let y = activeElement.y

    // Получаем координаты из события - используем delta для расчета новой позиции
    if (event.delta) {
      x = activeElement.x + event.delta.x
      y = activeElement.y + event.delta.y
    }

    // Ограничиваем границами canvas (динамический размер на основе фона)
    const canvasWidth = canvasRef.current?.offsetWidth || 1920
    const canvasHeight = canvasRef.current?.offsetHeight || 1080
    const elementWidth = activeElement.width || 200
    const elementHeight = activeElement.height || 200
    x = Math.max(0, Math.min(x, canvasWidth - elementWidth))
    y = Math.max(0, Math.min(y, canvasHeight - elementHeight))

    // Сохраняем isLocked при обновлении позиции
    const currentFurniture = furniture.find((f) => f.id === activeElement.id)
    setFurniture((prev) =>
      prev.map((f) => (f.id === activeElement.id ? { ...f, x, y } : f))
    )
    // Затем синхронизируем с сервером, сохраняя isLocked
    updateFurniture(activeElement.id, { 
      x, 
      y,
      isLocked: currentFurniture?.isLocked ?? false
    })

    setActiveId(null)
  }

  const handleLayerChange = async (id: string, newLayer: number) => {
    // Оптимистичное обновление состояния
    setFurniture((prev) =>
      prev.map((f) => (f.id === id ? { ...f, layerIndex: newLayer } : f))
    )
    await updateFurniture(id, { layerIndex: newLayer })
    // После обновления слоя, пересортируем элементы для корректного отображения
    fetchRoomData()
  }

  if (isLoading) {
    return <div className="text-center py-8">Загрузка комнаты...</div>
  }

  // Сортируем элементы по layerIndex для правильного отображения
  const allElements = furniture.map((f) => ({ ...f, type: "furniture" as const }))
    .sort((a, b) => a.layerIndex - b.layerIndex)

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
            <h2 className="text-xl font-bold">Редактирование: {room.title}</h2>
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
              // Сбрасываем выбор только если клик был по самому canvas, а не по элементу
              if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.canvas-background')) {
                setSelectedFurnitureId(null)
              }
            }}
          >
            <CanvasDroppableWrapper canvasRef={canvasRef} room={room}>
              {/* Мебель */}
              {furniture.map((item) => (
                <DraggableFurniture
                  key={item.id}
                  furniture={item}
                  disabled={selectedFurnitureId !== null && selectedFurnitureId !== item.id}
                  onLayerChange={(newLayer) => handleLayerChange(item.id, newLayer)}
                  onUpdate={(updates) => {
                    // Оптимистичное обновление
                    setFurniture((prev) =>
                      prev.map((f) => (f.id === item.id ? { ...f, ...updates } : f))
                    )
                    updateFurniture(item.id, updates)
                  }}
                  onDelete={async () => {
                    try {
                      const response = await fetch(`/api/furniture/${item.id}`, {
                        method: "DELETE",
                      })
                      if (response.ok) {
                        await fetchRoomData()
                        setSelectedFurnitureId(null)
                      }
                    } catch (error) {
                      console.error("Error deleting furniture:", error)
                    }
                  }}
                  selectedId={selectedFurnitureId}
                  onSelect={(id) => {
                    // Если уже выбран другой элемент, не позволяем выбрать этот
                    if (selectedFurnitureId && selectedFurnitureId !== id && id !== null) {
                      return
                    }
                    setSelectedFurnitureId(id)
                  }}
                />
              ))}

              <DragOverlay>
                {activeId ? (
                  (() => {
                    // Для существующих элементов
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
            <FurniturePanel
              roomId={room.id}
              onFurnitureAdded={fetchRoomData}
              existingFurniture={furniture}
              furnitureBases={furnitureBases}
              onFurnitureBaseAdded={(base) => {
                setFurnitureBases((prev) => {
                  // Проверяем, нет ли уже такого предмета
                  if (prev.some((b) => b.imageUrl === base.imageUrl)) {
                    return prev
                  }
                  return [...prev, base]
                })
              }}
              onFurnitureDelete={async (id) => {
                try {
                  const response = await fetch(`/api/furniture/${id}`, {
                    method: "DELETE",
                  })
                  if (response.ok) {
                    await fetchRoomData()
                    setSelectedFurnitureId(null)
                  }
                } catch (error) {
                  console.error("Error deleting furniture:", error)
                  alert("Ошибка при удалении предмета интерьера")
                }
              }}
              onFurnitureLayerChange={async (id, newLayer) => {
                await handleLayerChange(id, newLayer)
              }}
            />
          </div>
        </DndContext>
      </div>
    </div>
  )
}
