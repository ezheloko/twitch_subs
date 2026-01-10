import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, getCurrentUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// GET - получить все заявки (только для главного админа) или свою заявку
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Если главный админ - показываем все заявки
    if (user.isMainAdmin) {
      try {
        const requests = await prisma.adminRequest.findMany({
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                image: true,
                twitchLogin: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        })
        return NextResponse.json(requests)
      } catch (error: any) {
        // Если таблица AdminRequest не существует, возвращаем пустой массив
        if (error.code === "P2021" || error.message?.includes("does not exist")) {
          console.warn("AdminRequest table does not exist. Returning empty array.")
          return NextResponse.json([])
        }
        throw error
      }
    }

    // Обычный пользователь видит только свою заявку (без требования админских прав)
    try {
      const request = await prisma.adminRequest.findUnique({
        where: { userId: user.id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              twitchLogin: true,
            },
          },
        },
      })

      return NextResponse.json(request ? [request] : [])
    } catch (error: any) {
      // Если таблица AdminRequest не существует, возвращаем пустой массив
      if (error.code === "P2021" || error.message?.includes("does not exist")) {
        console.warn("AdminRequest table does not exist. Returning empty array.")
        return NextResponse.json([])
      }
      throw error
    }
  } catch (error: any) {
    console.error("Error fetching admin requests:", error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    })
    return NextResponse.json(
      { error: "Failed to fetch admin requests", details: error.message },
      { status: 500 }
    )
  }
}

// POST - создать заявку на администрирование
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Проверяем, не является ли пользователь уже админом
    if (user.isMainAdmin) {
      return NextResponse.json(
        { error: "You are already a main admin" },
        { status: 400 }
      )
    }

    // Проверяем, есть ли уже одобренная заявка
    const existingApproved = await prisma.adminRequest.findUnique({
      where: { userId: user.id },
    })

    if (existingApproved?.status === "approved") {
      return NextResponse.json(
        { error: "You are already an admin" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { message } = body

    // Создаем или обновляем заявку
    const adminRequest = await prisma.adminRequest.upsert({
      where: { userId: user.id },
      update: {
        status: "pending",
        message: message || null,
        reviewedBy: null,
        reviewedAt: null,
      },
      create: {
        userId: user.id,
        status: "pending",
        message: message || null,
      },
    })

    return NextResponse.json(adminRequest, { status: 201 })
  } catch (error: any) {
    console.error("Error creating admin request:", error)
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Request already exists" },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create admin request" },
      { status: 500 }
    )
  }
}
