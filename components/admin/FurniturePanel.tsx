"use client"

import { useState, useEffect } from "react"

interface Furniture {
  id: string
  imageUrl: string
  x: number
  y: number
  width: number
  height: number
  layerIndex: number
  createdAt?: string
}

interface FurnitureBase {
  id: string
  imageUrl: string
}

export default function FurniturePanel({
  roomId,
  onFurnitureAdded,
  existingFurniture,
  furnitureBases = [],
  onFurnitureBaseAdded,
  onFurnitureDelete,
  onFurnitureLayerChange,
}: {
  roomId: string
  onFurnitureAdded: () => void
  existingFurniture: Furniture[]
  furnitureBases?: Array<{ id: string; imageUrl: string }>
  onFurnitureBaseAdded?: (base: FurnitureBase) => void
  onFurnitureDelete?: (id: string) => void
  onFurnitureLayerChange?: (id: string, newLayer: number) => void
}) {
  const [uploading, setUploading] = useState(false)
  const [localFurnitureBases, setLocalFurnitureBases] = useState<FurnitureBase[]>([])

  useEffect(() => {
    // Объединяем переданные bases с локальными
    const allBases = [
      ...(furnitureBases || []),
      ...localFurnitureBases.filter(
        (local) => !furnitureBases?.some((b) => b.imageUrl === local.imageUrl)
      ),
    ]
    if (allBases.length !== localFurnitureBases.length) {
      setLocalFurnitureBases(allBases)
    }
  }, [furnitureBases])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Загружаем изображение
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "furniture")

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Ошибка загрузки изображения")
      }

      const { url } = await uploadResponse.json()

      // Добавляем в базу предметов
      const newBase: FurnitureBase = {
        id: `furniture-base-${Date.now()}`,
        imageUrl: url,
      }
      setLocalFurnitureBases((prev) => [...prev, newBase])
      onFurnitureBaseAdded?.(newBase)
    } catch (error) {
      console.error("Error uploading furniture:", error)
      alert("Ошибка при загрузке предмета интерьера")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  // Предметы, которые еще не добавлены в комнату
  const availableFurniture = localFurnitureBases.filter(
    (base) => !existingFurniture.some((f) => f.imageUrl === base.imageUrl)
  )

  return (
    <div className="p-4 max-w-[1920px] mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">Предметы интерьера</h3>
        <div>
          <label className="block">
            <span className="btn btn-primary btn-sm cursor-pointer inline-block">
              {uploading ? "Загрузка..." : "Загрузить предмет"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <div>
        {availableFurniture.length === 0 && existingFurniture.length === 0 && (
          <p className="text-sm text-gray-500 mb-2">Нет загруженных предметов</p>
        )}
        <div className="grid grid-cols-6 gap-2">
          {availableFurniture.map((base) => (
            <FurnitureThumbnail
              key={base.id}
              furnitureBase={base}
              roomId={roomId}
              onAdded={onFurnitureAdded}
            />
          ))}
          {existingFurniture.map((item) => (
            <div key={item.id} className="p-2 bg-background-2 rounded border border-stroke-1">
              <div className="w-full h-20 bg-background-1 rounded mb-1 flex items-center justify-center overflow-hidden relative">
                <img
                  src={item.imageUrl}
                  alt="Furniture"
                  className="max-w-full max-h-full object-contain"
                />
                {onFurnitureDelete && (
                  <button
                    onClick={() => {
                      if (confirm("Удалить этот предмет интерьера?")) {
                        onFurnitureDelete(item.id)
                      }
                    }}
                    className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                    title="Удалить"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-center flex-1">Слой: {item.layerIndex}</p>
                {onFurnitureLayerChange && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => onFurnitureLayerChange(item.id, item.layerIndex - 1)}
                      className="btn btn-sm bg-gray-600 hover:bg-gray-700 text-white px-2"
                      title="Уменьшить слой"
                    >
                      ↓
                    </button>
                    <button
                      onClick={() => onFurnitureLayerChange(item.id, item.layerIndex + 1)}
                      className="btn btn-sm bg-gray-600 hover:bg-gray-700 text-white px-2"
                      title="Увеличить слой"
                    >
                      ↑
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function FurnitureThumbnail({
  furnitureBase,
  roomId,
  onAdded,
}: {
  furnitureBase: FurnitureBase
  roomId: string
  onAdded: () => void
}) {
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = async () => {
    if (isAdding) return
    
    setIsAdding(true)
    try {
      // Получаем реальные размеры изображения
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = furnitureBase.imageUrl
      })

      const naturalWidth = img.naturalWidth
      const naturalHeight = img.naturalHeight

      // Получаем размер canvas для центрирования
      // Используем дефолтные значения, если canvas еще не загружен
      const canvasWidth = 1920 // Будет обновлено динамически в CanvasDroppableWrapper
      const canvasHeight = 1080
      
      // Центрируем предмет на canvas
      const x = (canvasWidth / 2) - (naturalWidth / 2)
      const y = (canvasHeight / 2) - (naturalHeight / 2)

      const response = await fetch("/api/furniture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          imageUrl: furnitureBase.imageUrl,
          x: Math.max(0, x), // Убеждаемся, что координаты не отрицательные
          y: Math.max(0, y),
          width: naturalWidth,
          height: naturalHeight,
          layerIndex: 1,
        }),
      })

      if (response.ok) {
        await onAdded() // Ждем обновления данных
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Ошибка при добавлении предмета")
      }
    } catch (error) {
      console.error("Error adding furniture:", error)
      alert("Ошибка при добавлении предмета интерьера")
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="p-2 bg-background-2 rounded border border-stroke-1 hover:border-primary-500 transition-colors">
      <div className="w-full h-20 bg-background-1 rounded flex items-center justify-center overflow-hidden mb-2">
        <img
          src={furnitureBase.imageUrl}
          alt="Furniture"
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <button
        onClick={handleAdd}
        disabled={isAdding}
        className="btn btn-primary btn-sm w-full"
      >
        <span>{isAdding ? "Добавление..." : "+ Добавить на фон"}</span>
      </button>
    </div>
  )
}
