import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, getCurrentUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// PUT - обновить статус заявки (только для главного админа)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin()
    
    // Только главный админ может рассматривать заявки
    if (!user.isMainAdmin) {
      return NextResponse.json(
        { error: "Only main admin can review requests" },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'approved' or 'rejected'" },
        { status: 400 }
      )
    }

    const adminRequest = await prisma.adminRequest.findUnique({
      where: { id },
      include: { user: true },
    })

    if (!adminRequest) {
      return NextResponse.json(
        { error: "Admin request not found" },
        { status: 404 }
      )
    }

    // Обновляем заявку
    const updated = await prisma.adminRequest.update({
      where: { id },
      data: {
        status,
        reviewedBy: user.id,
        reviewedAt: new Date(),
      },
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

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error("Error updating admin request:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to update admin request" },
      { status: 500 }
    )
  }
}

// DELETE - удалить заявку (только для главного админа или владельца заявки)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const adminRequest = await prisma.adminRequest.findUnique({
      where: { id },
    })

    if (!adminRequest) {
      return NextResponse.json(
        { error: "Admin request not found" },
        { status: 404 }
      )
    }

    // Главный админ может удалить любую заявку, пользователь - только свою
    if (!currentUser.isMainAdmin && adminRequest.userId !== currentUser.id) {
      return NextResponse.json(
        { error: "You can only delete your own request" },
        { status: 403 }
      )
    }

    await prisma.adminRequest.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting admin request:", error)
    if (error.message === "Unauthorized" || error.message.includes("Access denied")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(
      { error: "Failed to delete admin request" },
      { status: 500 }
    )
  }
}
