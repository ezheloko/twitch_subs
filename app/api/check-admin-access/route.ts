import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-helpers"
import { prisma } from "@/lib/prisma"

// GET - проверить, имеет ли текущий пользователь доступ к админ-панели
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ hasAccess: false })
    }

    // Главный админ всегда имеет доступ
    if (user.isMainAdmin) {
      return NextResponse.json({ hasAccess: true, isMainAdmin: true })
    }

    // Проверяем, есть ли одобренная заявка на администрирование
    const adminRequest = await prisma.adminRequest.findUnique({
      where: { userId: user.id },
    })

    const hasAccess = adminRequest?.status === "approved"

    return NextResponse.json({ 
      hasAccess, 
      isMainAdmin: false,
      requestStatus: adminRequest?.status || null 
    })
  } catch (error: any) {
    console.error("Error checking admin access:", error)
    return NextResponse.json({ hasAccess: false })
  }
}
