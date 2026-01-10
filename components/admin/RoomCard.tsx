"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Room {
  id: string
  title: string
  orderNumber: number
  backgroundUrl: string
}

export default function RoomCard({
  room,
  onSelect,
  onSubscribers,
  onDelete,
}: {
  room: Room
  onSelect: () => void
  onSubscribers: () => void
  onDelete: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: room.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-background-1 border border-stroke-1 rounded-lg overflow-hidden hover:shadow-lg transition-shadow flex flex-col ${
        isDragging ? "cursor-grabbing" : "cursor-grab"
      }`}
    >
      <div
        className="h-48 bg-cover bg-center cursor-pointer flex-shrink-0 relative"
        style={{ backgroundImage: `url(${room.backgroundUrl})` }}
        onClick={onSelect}
      >
        {/* Полупрозрачная подложка с названием */}
        <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-3">
          <h3 className="font-semibold text-lg text-gray-900">{room.title}</h3>
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex gap-2 mt-auto flex-wrap">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSubscribers()
            }}
            className="btn btn-sm bg-blue-600 border-blue-700 text-white hover:bg-blue-700 flex-1 min-w-0"
          >
            <span>Подписчики</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            className="btn btn-primary btn-sm flex-1 min-w-0"
          >
            <span>Редактировать</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="btn btn-sm bg-red-600 border-red-700 text-white hover:bg-red-700"
          >
            <span>Удалить</span>
          </button>
        </div>
        {/* Ручка для перетаскивания */}
        <div
          {...listeners}
          {...attributes}
          className="mt-2 text-center text-xs text-gray-500 cursor-grab active:cursor-grabbing"
        >
          ⋮⋮ Перетащите для изменения порядка
        </div>
      </div>
    </div>
  )
}
