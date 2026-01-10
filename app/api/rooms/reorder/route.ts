import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const body = await request.json()

    const { roomOrders } = body // Массив объектов { id: string, orderNumber: number }

    if (!Array.isArray(roomOrders)) {
      return NextResponse.json(
        { error: "roomOrders must be an array" },
        { status: 400 }
      )
    }

    // Используем транзакцию для атомарного обновления
    await prisma.$transaction(async (tx) => {
      // Находим максимальный orderNumber и используем значения выше него как временные
      const maxOrder = await tx.room.findFirst({
        orderBy: { orderNumber: "desc" },
        select: { orderNumber: true },
      })
      const tempBase = (maxOrder?.orderNumber || 0) + 10000

      // Сначала устанавливаем всем комнатам временные уникальные значения
      // чтобы избежать конфликтов уникальности
      for (let i = 0; i < roomOrders.length; i++) {
        await tx.room.update({
          where: { id: roomOrders[i].id },
          data: { orderNumber: tempBase + i },
        })
      }

      // Затем устанавливаем правильные значения
      for (const roomOrder of roomOrders) {
        await tx.room.update({
          where: { id: roomOrder.id },
          data: { orderNumber: roomOrder.orderNumber },
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error reordering rooms:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Failed to reorder rooms" },
      { status: 500 }
    )
  }
}
