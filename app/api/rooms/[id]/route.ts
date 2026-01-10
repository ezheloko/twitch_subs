import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Автоматическая деактивация аватаров, у которых прошло более 1 месяца с subscriptionDate
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    await prisma.avatar.updateMany({
      where: {
        roomId: id,
        isActive: true,
        subscriptionDate: {
          lt: oneMonthAgo,
        },
      },
      data: {
        isActive: false,
      },
    })
    
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        avatars: {
          where: { isActive: true },
          orderBy: { createdAt: "asc" },
        },
        furniture: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    if (!room) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error("Error fetching room:", error)
    return NextResponse.json(
      { error: "Failed to fetch room" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const { title, backgroundUrl, orderNumber } = body

    // Если меняется orderNumber, нужно поменять местами с другой комнатой
    if (orderNumber !== undefined) {
      const currentRoom = await prisma.room.findUnique({
        where: { id },
      })

      if (!currentRoom) {
        return NextResponse.json(
          { error: "Room not found" },
          { status: 404 }
        )
      }

      const targetRoom = await prisma.room.findFirst({
        where: { orderNumber },
      })

      if (targetRoom) {
        // Меняем местами порядковые номера
        await prisma.room.update({
          where: { id },
          data: { orderNumber: targetRoom.orderNumber },
        })

        await prisma.room.update({
          where: { id: targetRoom.id },
          data: { orderNumber: currentRoom.orderNumber },
        })
      } else {
        await prisma.room.update({
          where: { id },
          data: { orderNumber },
        })
      }
    }

    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (backgroundUrl !== undefined) updateData.backgroundUrl = backgroundUrl

    if (Object.keys(updateData).length > 0) {
      await prisma.room.update({
        where: { id },
        data: updateData,
      })
    }

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        avatars: {
          orderBy: { createdAt: "asc" },
        },
        furniture: {
          orderBy: { createdAt: "asc" },
        },
      },
    })

    return NextResponse.json(room)
  } catch (error: any) {
    console.error("Error updating room:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update room" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    await prisma.room.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting room:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Failed to delete room" },
      { status: 500 }
    )
  }
}
