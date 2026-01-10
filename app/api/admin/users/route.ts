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
        adminRequest: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
    })

    return NextResponse.json(users)
  } catch (error: any) {
    console.error("Error fetching users:", error)
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    })
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized", details: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Failed to fetch users", details: error.message },
      { status: 500 }
    )
  }
}

// POST больше не используется - админы добавляются через систему заявок
