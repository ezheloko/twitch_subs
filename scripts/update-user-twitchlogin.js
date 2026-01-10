const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('Использование: node update-user-twitchlogin.js <email_или_id> <новый_twitch_login>')
    console.log('Пример: node update-user-twitchlogin.js user@example.com username')
    process.exit(1)
  }

  const identifier = args[0]
  const newTwitchLogin = args[1].toLowerCase().trim()

  try {
    // Пытаемся найти пользователя по email или id
    let user = await prisma.user.findUnique({
      where: { email: identifier },
    })

    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: identifier },
      })
    }

    if (!user) {
      console.log(`❌ Пользователь не найден: ${identifier}`)
      return
    }

    console.log(`\n👤 Найден пользователь:`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Текущий twitchLogin: ${user.twitchLogin || '(не указан)'}`)
    console.log(`   Новый twitchLogin: ${newTwitchLogin}`)

    // Обновляем twitchLogin
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { twitchLogin: newTwitchLogin },
    })

    console.log(`\n✅ twitchLogin успешно обновлен!`)
    console.log(`   Пользователь должен переавторизоваться (выйти и войти заново)`)
    console.log(`\n📝 Обновленные данные:`)
    console.log(`   Email: ${updated.email}`)
    console.log(`   twitchLogin: ${updated.twitchLogin}`)
    console.log(`   isMainAdmin: ${updated.isMainAdmin}`)

  } catch (error) {
    if (error.code === 'P2002') {
      console.error(`❌ Ошибка: twitchLogin "${newTwitchLogin}" уже используется другим пользователем`)
    } else {
      console.error('❌ Ошибка при обновлении:', error)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
