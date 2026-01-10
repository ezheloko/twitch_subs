"use client"

import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { useState, useEffect } from "react"

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

export default function DraggableFurniture({
  furniture,
  disabled,
  onLayerChange,
  onUpdate,
  onDelete,
  selectedId,
  onSelect,
}: {
  furniture: Furniture
  disabled?: boolean
  onLayerChange: (newLayer: number) => void
  onUpdate: (updates: Partial<Furniture>) => void
  onDelete: () => void
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  const [isEditingLayer, setIsEditingLayer] = useState(false)
  const [layerInput, setLayerInput] = useState(furniture.layerIndex.toString())
  const isSelected = selectedId === furniture.id
  const isLocked = furniture.isLocked || false

  useEffect(() => {
    setLayerInput(furniture.layerIndex.toString())
  }, [furniture.layerIndex])

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: furniture.id,
    disabled: disabled || isLocked,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    position: "absolute" as const,
    left: `${furniture.x}px`,
    top: `${furniture.y}px`,
    width: `${furniture.width}px`,
    height: `${furniture.height}px`,
    zIndex: furniture.layerIndex + 100,
    opacity: isDragging ? 0 : 1,
    cursor: disabled || isLocked ? "not-allowed" : "move",
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Если уже выбран другой элемент, не позволяем выбрать этот
    if (selectedId && selectedId !== furniture.id) {
      return
    }
    if (isSelected) {
      onSelect(null)
    } else {
      onSelect(furniture.id)
    }
  }

  const handleLayerUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLayerChange(furniture.layerIndex + 1)
  }

  const handleLayerDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLayerChange(Math.max(0, furniture.layerIndex - 1))
  }

  const handleToggleLock = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUpdate({ isLocked: !isLocked })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group"
      onClick={handleClick}
      {...(disabled || isLocked ? {} : { ...listeners, ...attributes })}
    >
      <img
        src={furniture.imageUrl}
        alt="Furniture"
        className="w-full h-full object-contain"
      />

      {/* Delete button */}
      {!disabled && (
        <button
          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50"
          onClick={(e) => {
            e.stopPropagation()
            if (confirm("Удалить этот предмет интерьера?")) {
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
          className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-4 items-center pointer-events-auto">
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
                {furniture.layerIndex}
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
    </div>
  )
}
