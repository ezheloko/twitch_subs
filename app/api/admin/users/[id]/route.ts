import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    const { id } = await params

    // Только главный админ может удалять пользователей
    if (!user.isMainAdmin) {
      return NextResponse.json(
        { error: "Only main admin can delete users" },
        { status: 403 }
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Нельзя удалить главного админа
    if (targetUser.isMainAdmin) {
      return NextResponse.json(
        { error: "Cannot delete main admin. Transfer rights first." },
        { status: 403 }
      )
    }

    // Удаляем заявку на администрирование (это лишит пользователя прав админа)
    await prisma.adminRequest.deleteMany({
      where: { userId: id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting user:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    )
  }
}
