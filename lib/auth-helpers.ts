import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { prisma } from "./prisma"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  // Сначала пытаемся найти по twitchLogin (основной идентификатор для Twitch аккаунтов)
  const twitchLogin = (session.user as any)?.twitchLogin
  if (twitchLogin) {
    const user = await prisma.user.findUnique({
      where: { twitchLogin: twitchLogin.toLowerCase().trim() },
    })
    if (user) return user
  }

  // Если не найден по twitchLogin, ищем по email
  if (session.user.email) {
    return await prisma.user.findUnique({
      where: { email: session.user.email },
    })
  }

  return null
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("Unauthorized")
  }
  return user
}

export async function requireAdmin() {
  const user = await requireAuth()
  
  // Проверяем, является ли пользователь главным админом или имеет одобренную заявку на администрирование
  if (!user.isMainAdmin) {
    // Проверяем, есть ли одобренная заявка на администрирование
    try {
      const adminRequest = await prisma.adminRequest.findUnique({
        where: { userId: user.id },
      })
      
      if (!adminRequest || adminRequest.status !== "approved") {
        throw new Error("Access denied. Admin privileges required.")
      }
    } catch (error: any) {
      // Если таблица AdminRequest не существует, выбрасываем понятную ошибку
      if (error.code === "P2021" || error.message?.includes("does not exist")) {
        console.error("AdminRequest table does not exist. Run: npm run db:push")
        throw new Error("Database migration required. AdminRequest table not found.")
      }
      throw error
    }
  }
  
  return user
}
