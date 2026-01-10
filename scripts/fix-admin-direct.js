// Исправление статуса главного админа напрямую через Prisma
// Использует DATABASE_URL из .env файла

const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

// Загружаем переменные окружения из .env
require('dotenv').config()

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL не найден в .env файле')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: ['error'],
})

async function main() {
  console.log('🔧 Исправление статуса главного администратора...\n')

  try {
    // Найти Ezheloko (без учета регистра)
    const ezheloko = await prisma.user.findFirst({
      where: {
        twitchLogin: {
          equals: 'ezheloko',
          mode: 'insensitive',
        },
      },
    })

    if (!ezheloko) {
      console.log('❌ Пользователь Ezheloko не найден')
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          twitchLogin: true,
          isMainAdmin: true,
        },
      })
      console.log('\nДоступные пользователи:')
      allUsers.forEach(u => {
        console.log(`  - ${u.twitchLogin || u.email || 'Без логина'} (isMainAdmin: ${u.isMainAdmin})`)
      })
      return
    }

    console.log(`✅ Найден пользователь Ezheloko:`)
    console.log(`   ID: ${ezheloko.id}`)
    console.log(`   Twitch Login: ${ezheloko.twitchLogin}`)
    console.log(`   Текущий статус: ${ezheloko.isMainAdmin ? '✅ ДА' : '❌ НЕТ'}`)

    // Убрать статус у всех остальных
    const others = await prisma.user.findMany({
      where: {
        isMainAdmin: true,
        id: { not: ezheloko.id },
      },
    })

    if (others.length > 0) {
      console.log(`\n🔄 Убираем статус у ${others.length} других пользователей...`)
      for (const admin of others) {
        await prisma.user.update({
          where: { id: admin.id },
          data: { isMainAdmin: false },
        })
        console.log(`   ✅ Убран статус у: ${admin.twitchLogin || admin.email}`)
      }
    }

    // Установить статус для Ezheloko
    if (!ezheloko.isMainAdmin) {
      await prisma.user.update({
        where: { id: ezheloko.id },
        data: { isMainAdmin: true },
      })
      console.log('\n✅ Статус главного админа установлен для Ezheloko')
    } else {
      console.log('\n✅ Ezheloko уже является главным админом')
    }

    console.log('\n✅ Готово! Перелогиньтесь, чтобы изменения вступили в силу.')

  } catch (error) {
    console.error('❌ Ошибка:', error.message)
    if (error.code === 'P2021') {
      console.error('   Выполните: npm run db:push')
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
