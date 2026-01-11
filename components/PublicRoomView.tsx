"use client"

import { useState, useRef, useEffect } from "react"

interface Room {
  id: string
  title: string
  orderNumber: number
  backgroundUrl: string
  avatars: Avatar[]
  furniture: Furniture[]
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
  twitchUrl: string
  userpicUrl?: string | null
  subscriptionDate: string | Date
  createdAt: string | Date
  reactivationCount?: number
}

interface Furniture {
  id: string
  imageUrl: string
  x: number
  y: number
  width: number
  height: number
  layerIndex: number
}

interface PublicRoomViewProps {
  room: Room
  onNavigate?: (direction: "prev" | "next") => void
  hasPrev?: boolean
  hasNext?: boolean
  showNames?: boolean
}

export default function PublicRoomView({
  room,
  onNavigate,
  hasPrev = false,
  hasNext = false,
  showNames = false,
}: PublicRoomViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [backgroundSize, setBackgroundSize] = useState({ width: 1920, height: 1080 })
  const [isMobile, setIsMobile] = useState(false)
  const [scale, setScale] = useState(1)

  // Определяем мобильное устройство и масштаб
  useEffect(() => {
    const checkMobile = () => {
      const width = window.innerWidth
      const isMobileDevice = width < 1440 // Мобильные устройства < 1440px
      setIsMobile(isMobileDevice)
      
      if (isMobileDevice && backgroundSize.width > 0 && backgroundSize.height > 0) {
        // На мобильных: масштабируем только по ширине
        const scaleByWidth = width / backgroundSize.width
        setScale(scaleByWidth)
      } else {
        setScale(1)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [backgroundSize.width, backgroundSize.height])

  // Сортируем все элементы по layerIndex
  const allElements = [
    ...room.furniture.map((f) => ({ ...f, type: "furniture" as const })),
    ...room.avatars.map((a) => ({ ...a, type: "avatar" as const })),
  ].sort((a, b) => a.layerIndex - b.layerIndex)

  // Обработка начала перетаскивания (мышь)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Игнорируем клики по ссылкам, кнопкам и навигационным стрелкам
    const target = e.target as HTMLElement
    if (
      target.closest("a") ||
      target.closest("button") ||
      target.closest(".z-40") // Навигационные стрелки
    ) {
      return
    }
    e.preventDefault()
    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  // Обработка начала перетаскивания (touch)
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (
      target.closest("a") ||
      target.closest("button") ||
      target.closest(".z-40")
    ) {
      return
    }
    e.preventDefault()
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y,
    })
  }

  // Обработка движения мыши при перетаскивании
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    updatePosition(newX, newY)
  }

  // Обработка движения touch при перетаскивании
  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()

    const touch = e.touches[0]
    const newX = touch.clientX - dragStart.x
    const newY = touch.clientY - dragStart.y

    updatePosition(newX, newY)
  }

  // Общая функция обновления позиции
  const updatePosition = (newX: number, newY: number) => {
    // Ограничиваем прокрутку границами контента
    const container = containerRef.current
    const content = contentRef.current
    if (container && content) {
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      // На мобильных учитываем масштаб
      const scaledWidth = isMobile ? backgroundSize.width * scale : backgroundSize.width
      const scaledHeight = isMobile ? backgroundSize.height * scale : backgroundSize.height
      const contentWidth = isMobile ? scaledWidth : content.scrollWidth
      const contentHeight = isMobile ? scaledHeight : content.scrollHeight

      // Вычисляем границы
      const maxX = 0
      const minX = containerWidth >= contentWidth ? 0 : -(contentWidth - containerWidth)

      const maxY = 0
      const minY = containerHeight >= contentHeight ? 0 : -(contentHeight - containerHeight)

      setPosition({
        x: Math.max(minX, Math.min(maxX, newX)),
        y: Math.max(minY, Math.min(maxY, newY)),
      })
    }
  }

  // Обработка окончания перетаскивания
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      window.addEventListener("touchmove", handleTouchMove, { passive: false })
      window.addEventListener("touchend", handleTouchEnd)
      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
        window.removeEventListener("touchmove", handleTouchMove)
        window.removeEventListener("touchend", handleTouchEnd)
      }
    }
  }, [isDragging, dragStart, position, isMobile, scale])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen"
      style={{
        margin: 0,
        padding: 0,
        overflow: "hidden",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        touchAction: "none", // Отключаем стандартные жесты браузера для touch
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Фон комнаты - в натуральном размере */}
      <div
        ref={contentRef}
        className="relative"
        style={{
          transform: isMobile 
            ? `translate(${position.x}px, ${position.y}px) scale(${scale})`
            : `translate(${position.x}px, ${position.y}px)`,
          transformOrigin: "top left",
          transition: isDragging ? "none" : "transform 0.1s ease-out",
          display: "inline-block",
        }}
      >
        <img
          src={room.backgroundUrl}
          alt={room.title}
          style={{ 
            display: "block", 
            width: scale !== 1 ? `${backgroundSize.width}px` : "auto", 
            height: scale !== 1 ? `${backgroundSize.height}px` : "auto",
            maxWidth: "none",
            maxHeight: "none"
          }}
          draggable={false}
          onLoad={(e) => {
            // Обновляем размер контейнера и сохраняем размер фона для позиционирования элементов
            const img = e.currentTarget
            const width = img.naturalWidth
            const height = img.naturalHeight
            setBackgroundSize({ width, height })
            if (contentRef.current) {
              contentRef.current.style.width = `${width}px`
              contentRef.current.style.height = `${height}px`
            }
            
            // Пересчитываем масштаб после загрузки изображения
            const screenWidth = window.innerWidth
            const isMobileDevice = screenWidth < 1440
            if (isMobileDevice && width > 0 && height > 0) {
              // На мобильных: масштабируем только по ширине
              const scaleByWidth = screenWidth / width
              setScale(scaleByWidth)
            } else {
              setScale(1)
            }
          }}
        />

        {/* Предметы интерьера и аватары */}
        <div className="absolute inset-0">
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
                    pointerEvents: "none",
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
                    draggable={false}
                  />
                </div>
              )
            } else {
              // Это аватар
              const avatar = element as Avatar

              return (
                <div
                  key={avatar.id}
                  style={{
                    position: "absolute",
                    left: `${avatar.x}px`,
                    top: `${avatar.y}px`,
                    width: `${avatar.width}px`,
                    height: `${avatar.height}px`,
                    zIndex: avatar.layerIndex + 100, // Общая система слоев с предметами интерьера
                    pointerEvents: "auto",
                  }}
                  className="group"
                  onTouchStart={(e) => e.stopPropagation()}
                >
                  <img
                    src={avatar.imageUrl}
                    alt={avatar.username}
                    className="w-full h-full object-contain"
                    draggable={false}
                  />

                  {/* Имя пользователя с иконкой Twitch */}
                  <div 
                    className={`absolute top-0 left-0 right-0 bg-black/70 backdrop-blur-sm text-white p-2 rounded-t-lg transition-opacity ${
                      showNames ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                    style={{ zIndex: 1000 }}
                  >
                    <a
                      href={avatar.twitchUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-gray-300 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      {avatar.userpicUrl ? (
                        <img
                          src={avatar.userpicUrl}
                          alt={avatar.username}
                          className="w-6 h-6 rounded-full"
                          onError={(e) => {
                            // Если userpic не загружается, скрываем его и показываем иконку
                            e.currentTarget.style.display = "none"
                            const parent = e.currentTarget.parentElement
                            if (parent) {
                              const icon = parent.querySelector("svg")
                              if (icon) icon.style.display = "block"
                            }
                          }}
                          draggable={false}
                        />
                      ) : null}
                      {!avatar.userpicUrl && (
                        <svg
                          className="w-6 h-6"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M11.571 4.714h1.143v2.857h-1.143zm0 4.571h1.143v2.857h-1.143zm-4.571 0h1.143v2.857H7zm-4.571 0h1.143v2.857H2.429zm0-4.571h1.143v2.857H2.429zm4.571 0h1.143v2.857H7zm8.571 0h1.143v2.857h-1.143zm-4.571 0h1.143v2.857h-1.143zm-4.571 9.143h1.143v2.857H7zm-4.571 0h1.143v2.857H2.429zm4.571 0h1.143v2.857h-1.143zm8.571 0h1.143v2.857h-1.143zm-4.571 0h1.143v2.857h-1.143z" />
                        </svg>
                      )}
                      <span className="font-semibold">{avatar.username}</span>
                    </a>
                  </div>
                </div>
              )
            }
          })}
        </div>

        {/* Навигация стрелками (появляется при наведении на края) */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1/4 flex items-center justify-start pl-4 cursor-pointer opacity-0 hover:opacity-100 transition-opacity z-40"
          onClick={(e) => {
            e.stopPropagation()
            hasPrev && onNavigate?.("prev")
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            background: hasPrev
              ? "linear-gradient(to right, rgba(0,0,0,0.3), transparent)"
              : "none",
            pointerEvents: "auto",
          }}
        >
          {hasPrev && (
            <div className="bg-black/70 backdrop-blur-sm rounded-full p-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </div>
          )}
        </div>

        <div
          className="absolute right-0 top-0 bottom-0 w-1/4 flex items-center justify-end pr-4 cursor-pointer opacity-0 hover:opacity-100 transition-opacity z-40"
          onClick={(e) => {
            e.stopPropagation()
            hasNext && onNavigate?.("next")
          }}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            background: hasNext
              ? "linear-gradient(to left, rgba(0,0,0,0.3), transparent)"
              : "none",
            pointerEvents: "auto",
          }}
        >
          {hasNext && (
            <div className="bg-black/70 backdrop-blur-sm rounded-full p-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
