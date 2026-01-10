# Подключение к базе данных на продакшн-сервере

## Способ 1: Использовать DATABASE_URL из .env

Самый простой способ - использовать параметры из `.env` файла:

```bash
cd /root/twitch-subscribers
cat .env | grep DATABASE_URL
```

Затем используйте параметры из этой строки. Формат обычно:
```
postgresql://username:password@host:port/database
```

## Способ 2: Подключение через psql с паролем

### Вариант A: Запросить пароль интерактивно
```bash
psql -U postgres -d twitch_subscribers -W
```
Флаг `-W` заставит psql запросить пароль.

### Вариант B: Использовать переменную окружения
```bash
export PGPASSWORD='ваш-пароль'
psql -U postgres -d twitch_subscribers
```

### Вариант C: Передать пароль напрямую (небезопасно, но работает)
```bash
PGPASSWORD='ваш-пароль' psql -U postgres -d twitch_subscribers
```

## Способ 3: Использовать правильного пользователя

Если в DATABASE_URL указан другой пользователь (не `postgres`), используйте его:

```bash
# Проверьте имя пользователя из DATABASE_URL
cd /root/twitch-subscribers
grep DATABASE_URL .env

# Например, если там указан пользователь 'twitch_user':
psql -U twitch_user -d twitch_subscribers -W
```

## Способ 4: Подключение через socket (если PostgreSQL на том же сервере)

```bash
# Попробуйте подключиться как пользователь postgres через sudo
sudo -u postgres psql -d twitch_subscribers

# Или если вы root:
sudo -u postgres psql twitch_subscribers
```

## Способ 5: Использовать Prisma Studio через SSH туннель

Если Prisma Studio не работает напрямую, используйте SSH туннель:

### На вашем локальном компьютере:
```bash
ssh -L 5555:localhost:5555 root@ваш-сервер-ip
```

### На сервере (в другом терминале):
```bash
cd /root/twitch-subscribers
npm run db:studio
```

### Затем откройте в браузере:
```
http://localhost:5555
```

## Способ 6: Использовать скрипт для подключения

Создайте файл `/root/twitch-subscribers/scripts/connect-db.sh`:

```bash
#!/bin/bash
cd /root/twitch-subscribers

# Загружаем переменные окружения
source .env 2>/dev/null || export $(cat .env | xargs)

# Извлекаем параметры из DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
    # Парсим DATABASE_URL
    # Формат: postgresql://user:password@host:port/database
    DB_URL=$(echo $DATABASE_URL | sed 's|postgresql://||')
    DB_USER=$(echo $DB_URL | cut -d: -f1)
    DB_PASS=$(echo $DB_URL | cut -d: -f2 | cut -d@ -f1)
    DB_HOST=$(echo $DB_URL | cut -d@ -f2 | cut -d: -f1)
    DB_PORT=$(echo $DB_URL | cut -d: -f3 | cut -d/ -f1)
    DB_NAME=$(echo $DB_URL | cut -d/ -f2 | cut -d? -f1)
    
    echo "Подключение к базе данных..."
    echo "Пользователь: $DB_USER"
    echo "База данных: $DB_NAME"
    echo "Хост: $DB_HOST"
    
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -d "$DB_NAME"
else
    echo "DATABASE_URL не найден в .env файле"
    echo "Попробуйте подключиться вручную:"
    echo "psql -U postgres -d twitch_subscribers -W"
fi
```

Сделайте скрипт исполняемым:
```bash
chmod +x /root/twitch-subscribers/scripts/connect-db.sh
```

Используйте:
```bash
/root/twitch-subscribers/scripts/connect-db.sh
```

## Способ 7: Исправить статус админа через SQL напрямую

Если у вас есть доступ к серверу, но не можете подключиться через psql, используйте Prisma через Node.js:

Создайте файл `/root/twitch-subscribers/scripts/fix-admin-direct.js`:

```javascript
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

// Используем DATABASE_URL из .env
require('dotenv').config()

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
  log: ['error'],
})

async function main() {
  try {
    // Найти Ezheloko
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
      return
    }

    console.log(`✅ Найден: ${ezheloko.twitchLogin} (ID: ${ezheloko.id})`)
    console.log(`   Текущий статус главного админа: ${ezheloko.isMainAdmin}`)

    // Убрать статус у всех остальных
    await prisma.user.updateMany({
      where: {
        isMainAdmin: true,
        id: { not: ezheloko.id },
      },
      data: { isMainAdmin: false },
    })

    // Установить статус для Ezheloko
    await prisma.user.update({
      where: { id: ezheloko.id },
      data: { isMainAdmin: true },
    })

    console.log('✅ Статус главного админа установлен для Ezheloko')
  } catch (error) {
    console.error('❌ Ошибка:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
```

Запустите:
```bash
cd /root/twitch-subscribers
node scripts/fix-admin-direct.js
```

## Проверка подключения

Проверьте, что подключение работает:

```bash
# Проверка через Prisma
cd /root/twitch-subscribers
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"
```

## Решение проблем с аутентификацией

Если все еще не работает, проверьте:

1. **Проверьте настройки PostgreSQL** (`pg_hba.conf`):
```bash
sudo cat /etc/postgresql/*/main/pg_hba.conf | grep -v "^#"
```

2. **Проверьте, запущен ли PostgreSQL**:
```bash
sudo systemctl status postgresql
```

3. **Проверьте логи PostgreSQL**:
```bash
sudo tail -f /var/log/postgresql/postgresql-*-main.log
```

4. **Попробуйте подключиться как root через sudo**:
```bash
sudo -u postgres psql twitch_subscribers
```
