"use client"

import { useState } from "react"

interface Room {
  id: string
  title: string
  orderNumber: number
  backgroundUrl: string
}

interface RoomsTilesViewProps {
  rooms: Room[]
  onRoomSelect: (roomId: string) => void
  onBack: () => void
}

export default function RoomsTilesView({
  rooms,
  onRoomSelect,
  onBack,
}: RoomsTilesViewProps) {
  return (
    <div className="min-h-screen bg-background-1 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Заголовок и кнопка назад */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-secondary">Все комнаты</h1>
          <button
            onClick={onBack}
            className="btn btn-primary btn-base"
          >
            <span>← Назад к просмотру</span>
          </button>
        </div>

        {/* Сетка из 4 колонок */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              onClick={() => onRoomSelect(room.id)}
              className="bg-background-1 border border-stroke-1 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div
                className="h-48 bg-cover bg-center relative"
                style={{ backgroundImage: `url(${room.backgroundUrl})` }}
              >
                {/* Полупрозрачная подложка с названием */}
                <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-sm p-3">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {room.title}
                  </h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Комнаты не созданы
          </div>
        )}
      </div>
    </div>
  )
}
