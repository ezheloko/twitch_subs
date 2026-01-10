// Используем тот же способ создания PrismaClient, что и в проекте
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
})

async function main() {
  console.log('🔍 Проверка статуса администраторов...\n')

  try {
    // Проверяем всех пользователей
    const users = await prisma.user.findMany({
      include: {
        adminRequest: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    console.log(`Всего пользователей: ${users.length}\n`)

    if (users.length === 0) {
      console.log('⚠️  В базе данных нет пользователей!')
      return
    }

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || user.twitchLogin || 'Без email'}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Twitch Login: ${user.twitchLogin || 'не указан'}`)
      console.log(`   Главный админ: ${user.isMainAdmin ? '✅ ДА' : '❌ НЕТ'}`)
      
      if (user.adminRequest) {
        console.log(`   Заявка на администрирование: ${user.adminRequest.status}`)
        console.log(`   Дата создания заявки: ${user.adminRequest.createdAt}`)
      } else {
        console.log(`   Заявка на администрирование: ❌ НЕТ`)
      }
      
      console.log('')
    })

    // Проверяем главных админов
    const mainAdmins = users.filter(u => u.isMainAdmin)
    console.log(`\n📊 Главных админов: ${mainAdmins.length}`)
    
    if (mainAdmins.length === 0) {
      console.log('⚠️  ВНИМАНИЕ: Нет главных админов!')
      console.log('   Первый пользователь должен быть главным админом.')
    }

    // Проверяем админов с одобренными заявками
    const approvedAdmins = users.filter(u => 
      u.isMainAdmin || (u.adminRequest && u.adminRequest.status === 'approved')
    )
    console.log(`📊 Всего админов (главные + одобренные): ${approvedAdmins.length}`)

    // Проверяем заявки
    const requests = await prisma.adminRequest.findMany({
      include: {
        user: {
          select: {
            email: true,
            twitchLogin: true,
            isMainAdmin: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    console.log(`\n📋 Всего заявок: ${requests.length}`)
    if (requests.length > 0) {
      requests.forEach((req, index) => {
        console.log(`\n${index + 1}. Заявка от: ${req.user.email || req.user.twitchLogin}`)
        console.log(`   Статус: ${req.status}`)
        console.log(`   Дата: ${req.createdAt}`)
        if (req.reviewedAt) {
          console.log(`   Рассмотрена: ${req.reviewedAt}`)
        }
      })
    }

  } catch (error) {
    console.error('❌ Ошибка:', error)
    
    if (error.code === 'P2021') {
      console.error('\n⚠️  Таблица AdminRequest не существует!')
      console.error('   Выполните: npm run db:push')
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
