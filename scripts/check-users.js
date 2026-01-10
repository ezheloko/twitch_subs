const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Проверка пользователей в базе данных...\n')

  try {
    // Получить всех пользователей
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        twitchLogin: true,
        isMainAdmin: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (users.length === 0) {
      console.log('❌ Пользователи не найдены')
      return
    }

    console.log(`✅ Найдено пользователей: ${users.length}\n`)
    console.log('='.repeat(80))
    
    users.forEach((user, index) => {
      console.log(`\n👤 Пользователь #${index + 1}:`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Email: ${user.email || '(не указан)'}`)
      console.log(`   Имя: ${user.name || '(не указано)'}`)
      console.log(`   Twitch Login: ${user.twitchLogin || '❌ НЕ УКАЗАН'}`)
      console.log(`   Главный админ: ${user.isMainAdmin ? '✅ ДА' : '❌ НЕТ'}`)
      console.log(`   Статус админа: ${user.isMainAdmin || user.twitchLogin ? '✅ АДМИН' : '❌ НЕ АДМИН'}`)
      console.log(`   Создан: ${user.createdAt.toLocaleString('ru-RU')}`)
      console.log('-'.repeat(80))
    })

    // Проверить админов
    const admins = users.filter(u => u.isMainAdmin || u.twitchLogin)
    console.log(`\n📊 Статистика:`)
    console.log(`   Всего пользователей: ${users.length}`)
    console.log(`   Админов: ${admins.length}`)
    console.log(`   Главных админов: ${users.filter(u => u.isMainAdmin).length}`)
    console.log(`   Обычных админов: ${users.filter(u => !u.isMainAdmin && u.twitchLogin).length}`)

    // Проверить пользователей без twitchLogin
    const usersWithoutTwitchLogin = users.filter(u => !u.twitchLogin)
    if (usersWithoutTwitchLogin.length > 0) {
      console.log(`\n⚠️  Пользователи БЕЗ twitchLogin (не смогут войти как админы):`)
      usersWithoutTwitchLogin.forEach(u => {
        console.log(`   - ${u.email || u.name || u.id}`)
      })
    }

  } catch (error) {
    console.error('❌ Ошибка при проверке пользователей:', error)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
