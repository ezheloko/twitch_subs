import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("roomId")

    const where: any = {}
    if (roomId) {
      where.roomId = roomId
    }

    const furniture = await prisma.furniture.findMany({
      where,
      include: {
        room: true,
      },
      orderBy: { layerIndex: "asc" },
    })

    return NextResponse.json(furniture)
  } catch (error) {
    console.error("Error fetching furniture:", error)
    return NextResponse.json(
      { error: "Failed to fetch furniture" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const body = await request.json()

    const { roomId, imageUrl, x, y, width, height, layerIndex } = body

    if (!roomId || !imageUrl) {
      return NextResponse.json(
        { error: "roomId and imageUrl are required" },
        { status: 400 }
      )
    }

    const furniture = await prisma.furniture.create({
      data: {
        roomId,
        imageUrl,
        x: x || 0,
        y: y || 0,
        width: width || 100,
        height: height || 100,
        layerIndex: layerIndex || 0,
        userId: user.id,
      },
      include: {
        room: true,
      },
    })

    return NextResponse.json(furniture, { status: 201 })
  } catch (error: any) {
    console.error("Error creating furniture:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create furniture" },
      { status: 500 }
    )
  }
}
