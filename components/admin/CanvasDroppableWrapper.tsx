"use client"

import { useDroppable } from "@dnd-kit/core"
import { RefObject, useState, useEffect } from "react"

interface Room {
  id: string
  title: string
  orderNumber: number
  backgroundUrl: string
}

export default function CanvasDroppableWrapper({
  canvasRef,
  room,
  children,
}: {
  canvasRef: RefObject<HTMLDivElement | null>
  room: Room
  children?: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas",
  })

  const [imageSize, setImageSize] = useState({ width: 1920, height: 1080 })

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.src = room.backgroundUrl
  }, [room.backgroundUrl])

  return (
    <div
      ref={(node) => {
        if (node) {
          canvasRef.current = node
        }
        setNodeRef(node)
      }}
      className="relative mx-auto canvas-background"
      style={{
        width: `${imageSize.width}px`,
        height: `${imageSize.height}px`,
        minWidth: `${imageSize.width}px`,
        minHeight: `${imageSize.height}px`,
        backgroundImage: `url(${room.backgroundUrl})`,
        backgroundSize: "contain",
        backgroundPosition: "top left",
        backgroundRepeat: "no-repeat",
        backgroundColor: isOver ? "rgba(134, 79, 254, 0.1)" : "transparent",
      }}
    >
      {children}
    </div>
  )
}
