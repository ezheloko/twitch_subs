import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await requireAdmin()

    // Только главный админ может видеть список пользователей
    if (!user.isMainAdmin) {
      return NextResponse.json(
        { error: "Only main admin can view users" },
        { status: 403 }
      )
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        image: true,
        isMainAdmin: true,
        twitchLogin: true,
        createdAt: true,
      },
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error("Error fetching users:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAdmin()

    // Только главный админ может добавлять других админов
    if (!user.isMainAdmin) {
      return NextResponse.json(
        { error: "Only main admin can add users" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { twitchLogin } = body

    if (!twitchLogin) {
      return NextResponse.json(
        { error: "twitchLogin is required" },
        { status: 400 }
      )
    }

    // Нормализуем twitchLogin в нижний регистр
    const normalizedTwitchLogin = twitchLogin.toLowerCase().trim()

    // Ищем пользователя по twitchLogin или создаем нового
    const existingUser = await prisma.user.findUnique({
      where: { twitchLogin: normalizedTwitchLogin },
    })

    if (existingUser) {
      // Если пользователь уже существует, просто возвращаем его
      return NextResponse.json(existingUser)
    }

    // Создаем нового пользователя с twitchLogin
    const newUser = await prisma.user.create({
      data: {
        email: `${normalizedTwitchLogin}@twitch.local`,
        twitchLogin: normalizedTwitchLogin,
        name: normalizedTwitchLogin,
        isMainAdmin: false,
      },
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error: any) {
    console.error("Error adding user:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Failed to add user" },
      { status: 500 }
    )
  }
}
