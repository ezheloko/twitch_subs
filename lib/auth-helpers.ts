import { getServerSession } from "next-auth"
import { authOptions } from "./auth"
import { prisma } from "./prisma"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null

  return await prisma.user.findUnique({
    where: { email: session.user.email },
  })
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
  
  // Проверяем, является ли пользователь главным админом или имеет twitchLogin (добавлен админом)
  if (!user.isMainAdmin && !user.twitchLogin) {
    throw new Error("Access denied. Admin privileges required.")
  }
  
  return user
}
