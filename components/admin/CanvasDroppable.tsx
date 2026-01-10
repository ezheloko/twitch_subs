"use client"

import { useDroppable } from "@dnd-kit/core"
import { useEffect, useRef } from "react"

export default function CanvasDroppable({
  children,
}: {
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas",
  })
  
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) {
      setNodeRef(containerRef.current)
    }
  }, [setNodeRef])

  return (
    <div 
      ref={containerRef}
      className="w-full h-full min-h-full"
      style={{
        backgroundColor: isOver ? "rgba(134, 79, 254, 0.1)" : "transparent",
        minHeight: "100%",
      }}
    >
      {children}
    </div>
  )
}
