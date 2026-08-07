import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { furnitureUpdateSchema, validationError } from "@/lib/validation"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const parsed = furnitureUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return validationError(parsed.error)
    }
    const { x, y, width, height, layerIndex, isLocked } = parsed.data

    const updateData: any = {}
    if (x !== undefined && x !== null) updateData.x = x
    if (y !== undefined && y !== null) updateData.y = y
    if (width !== undefined && width !== null) updateData.width = width
    if (height !== undefined && height !== null) updateData.height = height
    if (layerIndex !== undefined && layerIndex !== null) updateData.layerIndex = layerIndex
    if (isLocked !== undefined && isLocked !== null) updateData.isLocked = isLocked

    // Проверяем, что есть данные для обновления
    if (Object.keys(updateData).length === 0) {
      console.error("No data to update for furniture:", id, "Body received:", body)
      return NextResponse.json(
        { error: "No data to update", received: body },
        { status: 400 }
      )
    }

    const furniture = await prisma.furniture.update({
      where: { id },
      data: updateData,
      include: {
        room: true,
      },
    })

    return NextResponse.json(furniture)
  } catch (error: any) {
    console.error("Error updating furniture:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    // Более детальная информация об ошибке
    const errorMessage = error.message || "Failed to update furniture"
    return NextResponse.json(
      { error: errorMessage, details: error.toString() },
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

    await prisma.furniture.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting furniture:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Failed to delete furniture" },
      { status: 500 }
    )
  }
}
