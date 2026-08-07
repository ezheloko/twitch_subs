import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"
import { transferMainAdminSchema, validationError } from "@/lib/validation"

// POST - передать права главного админа другому админу
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAdmin()
    
    // Только главный админ может передавать права
    if (!currentUser.isMainAdmin) {
      return NextResponse.json(
        { error: "Only main admin can transfer main admin rights" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = transferMainAdminSchema.safeParse(body)
    if (!parsed.success) {
      return validationError(parsed.error)
    }
    const { userId } = parsed.data

    // Проверяем, что пользователь существует и является админом
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminRequest: true,
      },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Проверяем, что пользователь является админом (главным или с одобренной заявкой)
    if (!targetUser.isMainAdmin && (!targetUser.adminRequest || targetUser.adminRequest.status !== "approved")) {
      return NextResponse.json(
        { error: "Target user is not an admin" },
        { status: 400 }
      )
    }

    // Нельзя передать права самому себе
    if (targetUser.id === currentUser.id) {
      return NextResponse.json(
        { error: "Cannot transfer rights to yourself" },
        { status: 400 }
      )
    }

    // Используем транзакцию для атомарного обновления
    await prisma.$transaction([
      // Убираем права главного админа у текущего пользователя
      prisma.user.update({
        where: { id: currentUser.id },
        data: { isMainAdmin: false },
      }),
      // Передаем права главного админа новому пользователю
      prisma.user.update({
        where: { id: userId },
        data: { isMainAdmin: true },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error transferring main admin rights:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to transfer main admin rights" },
      { status: 500 }
    )
  }
}
