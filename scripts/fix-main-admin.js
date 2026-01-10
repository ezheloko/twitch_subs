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
  console.log('🔧 Исправление статуса главного администратора...\n')

  try {
    // Получаем всех пользователей
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    })

    console.log(`Всего пользователей: ${users.length}\n`)

    if (users.length === 0) {
      console.log('⚠️  В базе данных нет пользователей!')
      return
    }

    // Показываем всех пользователей
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email || user.twitchLogin || 'Без email'}`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Twitch Login: ${user.twitchLogin || 'не указан'}`)
      console.log(`   Главный админ: ${user.isMainAdmin ? '✅ ДА' : '❌ НЕТ'}`)
      console.log(`   Дата создания: ${user.createdAt}`)
      console.log('')
    })

    // Находим пользователя Ezheloko
    const ezheloko = users.find(u => 
      u.twitchLogin?.toLowerCase() === 'ezheloko' || 
      u.email?.toLowerCase().includes('ezheloko')
    )

    if (!ezheloko) {
      console.log('❌ Пользователь Ezheloko не найден!')
      console.log('\nДоступные пользователи:')
      users.forEach(u => {
        console.log(`  - ${u.twitchLogin || u.email || 'Без логина'}`)
      })
      return
    }

    console.log(`\n✅ Найден пользователь Ezheloko:`)
    console.log(`   ID: ${ezheloko.id}`)
    console.log(`   Email: ${ezheloko.email}`)
    console.log(`   Twitch Login: ${ezheloko.twitchLogin}`)
    console.log(`   Текущий статус главного админа: ${ezheloko.isMainAdmin ? '✅ ДА' : '❌ НЕТ'}`)

    // Проверяем, есть ли другие главные админы
    const otherMainAdmins = users.filter(u => u.isMainAdmin && u.id !== ezheloko.id)
    
    if (otherMainAdmins.length > 0) {
      console.log(`\n⚠️  Найдено других главных админов: ${otherMainAdmins.length}`)
      otherMainAdmins.forEach(admin => {
        console.log(`   - ${admin.twitchLogin || admin.email} (ID: ${admin.id})`)
      })
    }

    // Убираем статус главного админа у всех остальных
    if (otherMainAdmins.length > 0) {
      console.log('\n🔄 Убираем статус главного админа у других пользователей...')
      for (const admin of otherMainAdmins) {
        await prisma.user.update({
          where: { id: admin.id },
          data: { isMainAdmin: false },
        })
        console.log(`   ✅ Убран статус у: ${admin.twitchLogin || admin.email}`)
      }
    }

    // Устанавливаем статус главного админа для Ezheloko
    if (!ezheloko.isMainAdmin) {
      console.log('\n🔄 Устанавливаем статус главного админа для Ezheloko...')
      await prisma.user.update({
        where: { id: ezheloko.id },
        data: { isMainAdmin: true },
      })
      console.log('   ✅ Статус установлен!')
    } else {
      console.log('\n✅ Ezheloko уже является главным админом')
    }

    // Проверяем результат
    const updatedEzheloko = await prisma.user.findUnique({
      where: { id: ezheloko.id },
    })

    console.log('\n📊 Итоговый статус:')
    console.log(`   Ezheloko - главный админ: ${updatedEzheloko?.isMainAdmin ? '✅ ДА' : '❌ НЕТ'}`)
    
    const finalMainAdmins = await prisma.user.findMany({
      where: { isMainAdmin: true },
    })
    console.log(`   Всего главных админов: ${finalMainAdmins.length}`)
    
    if (finalMainAdmins.length > 1) {
      console.log('   ⚠️  ВНИМАНИЕ: Все еще есть несколько главных админов!')
    } else {
      console.log('   ✅ Отлично! Только один главный админ.')
    }

    console.log('\n✅ Готово! Теперь нужно перелогиниться, чтобы изменения вступили в силу.')

  } catch (error) {
    console.error('❌ Ошибка:', error)
    
    if (error.code === 'P2021') {
      console.error('\n⚠️  Таблица User не существует!')
      console.error('   Выполните: npm run db:push')
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
