import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { avatarCreateSchema, validationError } from "@/lib/validation"
import { deactivateExpiredAvatars } from "@/lib/subscription-lifecycle"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roomId = searchParams.get("roomId")

    const where: any = {}
    if (roomId) {
      where.roomId = roomId
    }

    // Автоматическая деактивация аватаров, у которых прошло более 1 месяца с subscriptionDate
    await deactivateExpiredAvatars()


    const avatars = await prisma.avatar.findMany({
      where,
      include: {
        room: true,
        avatarBase: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(avatars)
  } catch (error) {
    console.error("Error fetching avatars:", error)
    return NextResponse.json(
      { error: "Failed to fetch avatars" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()
    const body = await request.json()

    const parsed = avatarCreateSchema.safeParse(body)
    if (!parsed.success) {
      return validationError(parsed.error)
    }
    const {
      roomId,
      avatarBaseId,
      imageUrl,
      username,
      twitchUrl,
      userpicUrl,
      x,
      y,
      width,
      height,
      layerIndex,
      createdAt,
      subscriptionDate,
    } = parsed.data

    // Проверяем, нет ли уже этого ника в этой же комнате (сравнение без учета регистра,
    // чтобы "Vasya" и "vasya" тоже считались дублем)
    const duplicateInThisRoom = await prisma.avatar.findFirst({
      where: {
        roomId,
        username: { equals: username, mode: "insensitive" },
      },
    })

    if (duplicateInThisRoom) {
      return NextResponse.json(
        {
          error: duplicateInThisRoom.isActive
            ? `Подписчик "${username}" уже добавлен в эту комнату`
            : `Подписчик "${username}" уже есть в этой комнате, но неактивен - используйте "Активировать" вместо повторного добавления`,
        },
        { status: 409 }
      )
    }

    // Проверяем, есть ли уже аватар с таким username в другой комнате
    const existingAvatar = await prisma.avatar.findFirst({
      where: {
        username: { equals: username, mode: "insensitive" },
        roomId: { not: roomId },
      },
      include: {
        room: true,
      },
    })

    if (existingAvatar) {
      return NextResponse.json(
        {
          error: "Avatar with this username already exists",
          existingAvatar: {
            id: existingAvatar.id,
            roomId: existingAvatar.roomId,
            roomTitle: existingAvatar.room.title,
          },
        },
        { status: 409 }
      )
    }

    let avatar
    try {
      avatar = await prisma.avatar.create({
        data: {
          roomId,
          avatarBaseId,
          imageUrl,
          username,
          twitchUrl: twitchUrl || `https://twitch.tv/${username}`,
          userpicUrl,
          x,
          y,
          width,
          height,
          layerIndex: layerIndex || 0,
          createdAt: createdAt ? new Date(createdAt) : new Date(),
          subscriptionDate: subscriptionDate ? new Date(subscriptionDate) : new Date(),
          userId: user.id,
        },
        include: {
          room: true,
          avatarBase: true,
        },
      })
    } catch (error: any) {
      // На случай гонки: два почти одновременных запроса могли оба пройти
      // проверку выше до того, как первый из них записался в базу.
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: `Подписчик "${username}" уже добавлен в эту комнату` },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json(avatar, { status: 201 })
  } catch (error: any) {
    console.error("Error creating avatar:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create avatar" },
      { status: 500 }
    )
  }
}
