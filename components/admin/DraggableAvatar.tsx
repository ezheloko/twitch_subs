"use client"

import { useState, useEffect } from "react"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

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
  twitchUrl?: string
}

export default function DraggableAvatar({
  avatar,
  disabled,
  onLayerChange,
  onUpdate,
  onDelete,
  selectedId,
  onSelect,
}: {
  avatar: Avatar
  disabled?: boolean
  onLayerChange: (newLayer: number) => void
  onUpdate: (updates: Partial<Avatar>) => void
  onDelete: () => void
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const [isResizing, setIsResizing] = useState(false)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })
  const [initialSize, setInitialSize] = useState({ width: avatar.width, height: avatar.height })
  
  const isSelected = selectedId === avatar.id
  const isLocked = avatar.isLocked || false

  // Сохраняем изначальный размер при первом рендере
  useEffect(() => {
    // Если изначальный размер еще не установлен (дефолтный 150x150), используем текущий размер аватара
    if (initialSize.width === 150 && initialSize.height === 150 && (avatar.width !== 150 || avatar.height !== 150)) {
      setInitialSize({ width: avatar.width, height: avatar.height })
    }
  }, [])

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: avatar.id,
    disabled: disabled || isLocked || (selectedId !== null && selectedId !== avatar.id) || isResizing,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    position: "absolute" as const,
    left: `${avatar.x}px`,
    top: `${avatar.y}px`,
    width: `${avatar.width}px`,
    height: `${avatar.height}px`,
    zIndex: avatar.layerIndex + 100 + (isSelected ? 1000 : 0), // Bring selected item to front
    opacity: isDragging ? 0 : 1, // Hide original when dragging, show only DragOverlay
    cursor: disabled || isLocked ? "not-allowed" : "grab",
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Если уже выбран другой элемент, не позволяем выбрать этот
    if (selectedId && selectedId !== avatar.id && avatar.id !== null) {
      return
    }
    if (isSelected) {
      onSelect(null) // Deselect if already selected
    } else {
      onSelect(avatar.id) // Select this item
    }
  }

  const handleLayerUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLayerChange(avatar.layerIndex + 1)
  }

  const handleLayerDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLayerChange(Math.max(0, avatar.layerIndex - 1))
  }

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUpdate({ isLocked: !isLocked })
  }

  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: avatar.width,
      height: avatar.height,
    })
    // Сохраняем изначальный размер, если еще не сохранен
    if (initialSize.width === 150 && initialSize.height === 150) {
      setInitialSize({ width: avatar.width, height: avatar.height })
    }
  }

  const handleResize = (e: MouseEvent) => {
    if (!isResizing) return

    const deltaX = e.clientX - resizeStart.x
    const deltaY = e.clientY - resizeStart.y
    const aspectRatio = initialSize.width / initialSize.height

    let newWidth = resizeStart.width + deltaX
    let newHeight = resizeStart.height + deltaY

    // Сохраняем соотношение сторон
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      newHeight = newWidth / aspectRatio
    } else {
      newWidth = newHeight * aspectRatio
    }

    // Ограничиваем изменение размера до ±50% от изначального
    const minWidth = initialSize.width * 0.5
    const maxWidth = initialSize.width * 1.5
    const minHeight = initialSize.height * 0.5
    const maxHeight = initialSize.height * 1.5

    newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
    newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))

    onUpdate({ width: newWidth, height: newHeight })
  }

  const handleResizeEnd = () => {
    setIsResizing(false)
  }

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResize)
      document.addEventListener("mouseup", handleResizeEnd)
      return () => {
        document.removeEventListener("mousemove", handleResize)
        document.removeEventListener("mouseup", handleResizeEnd)
      }
    }
  }, [isResizing, resizeStart, initialSize])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group ${isSelected ? "ring-2 ring-primary-500" : ""} ${avatar.isLocked ? "ring-2 ring-yellow-500" : ""} ${
        !avatar.isActive ? "opacity-50" : ""
      }`}
      onClick={handleClick}
      {...(disabled || isLocked || isSelected ? {} : { ...listeners, ...attributes })} // Only apply drag listeners if not disabled, not locked, and not selected
    >
      <img
        src={avatar.imageUrl}
        alt={avatar.username}
        className="w-full h-full object-contain rounded-lg"
      />

      {/* Overlay с именем */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-1 text-xs text-center rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
        {avatar.username}
      </div>

      {/* Delete button */}
      {!disabled && (
        <button
          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50"
          onClick={(e) => {
            e.stopPropagation()
            if (confirm(`Удалить подписчика "${avatar.username}"?`)) {
              onDelete()
            }
          }}
        >
          ✕
        </button>
      )}

      {/* Control panel - показывается при клике */}
      {isSelected && (
        <div
          className="absolute inset-0 flex items-center justify-center z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-4 items-center">
            {/* Layer controls */}
            <div className="flex flex-col gap-2 items-center">
              <button
                onClick={handleLayerUp}
                className="bg-primary-600 hover:bg-primary-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold shadow-lg"
                title="Увеличить слой"
              >
                ↑
              </button>
              <div className="bg-black bg-opacity-80 text-white px-3 py-1 rounded text-sm">
                {avatar.layerIndex}
              </div>
              <button
                onClick={handleLayerDown}
                className="bg-primary-600 hover:bg-primary-700 text-white rounded-full w-10 h-10 flex items-center justify-center text-lg font-bold shadow-lg"
                title="Уменьшить слой"
              >
                ↓
              </button>
            </div>

            {/* Lock button */}
            <button
              onClick={handleToggleLock}
              className={`rounded-full w-10 h-10 flex items-center justify-center text-lg shadow-lg ${
                isLocked
                  ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                  : "bg-gray-600 hover:bg-gray-700 text-white"
              }`}
              title={isLocked ? "Разблокировать" : "Заблокировать"}
            >
              {isLocked ? "🔒" : "🔓"}
            </button>
          </div>
        </div>
      )}

      {/* Resize handle */}
      {!disabled && !isLocked && !isSelected && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-primary-600 cursor-se-resize opacity-0 group-hover:opacity-100"
          onMouseDown={handleResizeStart}
        />
      )}
    </div>
  )
}
