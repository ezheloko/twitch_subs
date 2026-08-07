import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { roomCreateSchema, validationError } from "@/lib/validation"

export async function GET() {
  try {
    const rooms = await prisma.room.findMany({
      orderBy: { orderNumber: "asc" },
      include: {
        avatars: {
          where: { isActive: true },
        },
        furniture: true,
      },
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error("Error fetching rooms:", error)
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const body = await request.json()

    const parsed = roomCreateSchema.safeParse(body)
    if (!parsed.success) {
      return validationError(parsed.error)
    }
    const { title, backgroundUrl } = parsed.data

    // Находим максимальный orderNumber
    const maxOrder = await prisma.room.findFirst({
      orderBy: { orderNumber: "desc" },
      select: { orderNumber: true },
    })

    const newOrderNumber = (maxOrder?.orderNumber || 0) + 1

    const room = await prisma.room.create({
      data: {
        title,
        backgroundUrl,
        orderNumber: newOrderNumber,
        userId: user.id,
      },
      include: {
        avatars: true,
        furniture: true,
      },
    })

    return NextResponse.json(room, { status: 201 })
  } catch (error: any) {
    console.error("Error creating room:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    )
  }
}
