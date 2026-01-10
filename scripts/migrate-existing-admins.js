const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Миграция существующих администраторов...\n')

  try {
    // Находим всех пользователей с twitchLogin (старые админы)
    const oldAdmins = await prisma.user.findMany({
      where: {
        twitchLogin: {
          not: null,
        },
        isMainAdmin: false, // Не главные админы
      },
    })

    console.log(`Найдено существующих админов (с twitchLogin): ${oldAdmins.length}\n`)

    if (oldAdmins.length === 0) {
      console.log('✅ Нет существующих админов для миграции')
      return
    }

    // Создаем одобренные заявки для существующих админов
    for (const admin of oldAdmins) {
      try {
        // Проверяем, есть ли уже заявка
        const existingRequest = await prisma.adminRequest.findUnique({
          where: { userId: admin.id },
        })

        if (existingRequest) {
          console.log(`⚠️  Заявка уже существует для: ${admin.email || admin.twitchLogin}`)
          continue
        }

        // Создаем одобренную заявку
        await prisma.adminRequest.create({
          data: {
            userId: admin.id,
            status: 'approved',
            message: 'Миграция из старой системы',
            reviewedBy: null, // Системная миграция
            reviewedAt: new Date(),
          },
        })

        console.log(`✅ Создана одобренная заявка для: ${admin.email || admin.twitchLogin}`)
      } catch (error) {
        console.error(`❌ Ошибка при создании заявки для ${admin.email || admin.twitchLogin}:`, error)
      }
    }

    console.log('\n✅ Миграция завершена!')
    console.log('\n📝 Теперь все существующие админы имеют одобренные заявки.')
    console.log('   Новые пользователи должны будут отправлять заявки через форму.')
  } catch (error) {
    console.error('❌ Ошибка при миграции:', error)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
