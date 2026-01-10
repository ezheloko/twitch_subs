"use client"

import { useDroppable } from "@dnd-kit/core"
import { RefObject } from "react"

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
  canvasRef: RefObject<HTMLDivElement>
  room: Room
  children?: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas",
  })

  return (
    <div
      ref={(node) => {
        canvasRef.current = node
        setNodeRef(node)
      }}
      className="relative mx-auto canvas-background"
      style={{
        width: "1920px",
        height: "1080px",
        minWidth: "1920px",
        minHeight: "1080px",
        backgroundImage: `url(${room.backgroundUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: isOver ? "rgba(134, 79, 254, 0.1)" : "transparent",
      }}
    >
      {children}
    </div>
  )
}
