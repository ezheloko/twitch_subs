import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { avatarUpdateSchema, validationError } from "@/lib/validation"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const avatar = await prisma.avatar.findUnique({
      where: { id },
      include: {
        room: true,
        avatarBase: true,
      },
    })

    if (!avatar) {
      return NextResponse.json(
        { error: "Avatar not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(avatar)
  } catch (error) {
    console.error("Error fetching avatar:", error)
    return NextResponse.json(
      { error: "Failed to fetch avatar" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params
    const body = await request.json()

    const parsed = avatarUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return validationError(parsed.error)
    }
    const {
      username,
      twitchUrl,
      userpicUrl,
      x,
      y,
      width,
      height,
      layerIndex,
      isLocked,
      isActive,
      roomId,
      subscriptionDate,
      createdAt,
      avatarBaseId,
      imageUrl,
      reactivationCount,
    } = parsed.data

    // Если меняется roomId или username, проверяем, что в итоговой комнате
    // не появится дубль ника (сравнение без учета регистра)
    if (roomId !== undefined || username !== undefined) {
      const currentAvatar = await prisma.avatar.findUnique({
        where: { id },
      })

      if (!currentAvatar) {
        return NextResponse.json(
          { error: "Avatar not found" },
          { status: 404 }
        )
      }

      const targetRoomId = roomId !== undefined ? roomId : currentAvatar.roomId
      const targetUsername = username !== undefined ? username : currentAvatar.username

      const duplicate = await prisma.avatar.findFirst({
        where: {
          roomId: targetRoomId,
          username: { equals: targetUsername, mode: "insensitive" },
          id: { not: id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          {
            error: `Подписчик "${targetUsername}" уже есть в этой комнате`,
          },
          { status: 409 }
        )
      }
    }

    const updateData: any = {}
    if (username !== undefined) updateData.username = username
    if (twitchUrl !== undefined) updateData.twitchUrl = twitchUrl
    if (userpicUrl !== undefined) updateData.userpicUrl = userpicUrl
    if (x !== undefined) updateData.x = x
    if (y !== undefined) updateData.y = y
    if (width !== undefined) updateData.width = width
    if (height !== undefined) updateData.height = height
    if (layerIndex !== undefined) updateData.layerIndex = layerIndex
    if (isLocked !== undefined) updateData.isLocked = isLocked
    if (isActive !== undefined) updateData.isActive = isActive
    if (roomId !== undefined) updateData.roomId = roomId
    if (subscriptionDate !== undefined) updateData.subscriptionDate = new Date(subscriptionDate)
    if (createdAt !== undefined) updateData.createdAt = new Date(createdAt)
    if (avatarBaseId !== undefined) updateData.avatarBaseId = avatarBaseId
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (reactivationCount !== undefined) updateData.reactivationCount = reactivationCount

    // Проверяем, что есть данные для обновления
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No data to update" },
        { status: 400 }
      )
    }

    try {
      const avatar = await prisma.avatar.update({
        where: { id },
        data: updateData,
        include: {
          room: true,
          avatarBase: true,
        },
      })

      return NextResponse.json(avatar)
    } catch (error: any) {
      console.error("Error updating avatar:", error)
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Подписчик с таким ником уже есть в этой комнате" },
          { status: 409 }
        )
      }
      return NextResponse.json(
        { error: error.message || "Failed to update avatar", details: error.toString() },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error updating avatar:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update avatar" },
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

    await prisma.avatar.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting avatar:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Failed to delete avatar" },
      { status: 500 }
    )
  }
}
