import { prisma } from "./prisma"
import { oneMonthAgo } from "./date-utils"

// Эти публичные GET-роуты дергаются зрителями стрима без авторизации и без
// ограничения частоты, поэтому сам updateMany троттлим в памяти процесса,
// чтобы не долбить базу на каждый опрос.
const THROTTLE_MS = 5 * 60 * 1000 // 5 минут

let lastRunAt = 0

export async function deactivateExpiredAvatars() {
  const now = Date.now()
  if (now - lastRunAt < THROTTLE_MS) return
  lastRunAt = now

  await prisma.avatar.updateMany({
    where: {
      isActive: true,
      subscriptionDate: {
        lt: oneMonthAgo(),
      },
    },
    data: {
      isActive: false,
    },
  })
}
