# Как проверить данные в базе данных

## Способ 1: Prisma Studio (самый простой)

1. На сервере перейдите в директорию проекта:
   ```bash
   cd /root/twitch-subscribers
   ```

2. Запустите Prisma Studio:
   ```bash
   npm run db:studio
   ```

3. Откроется веб-интерфейс (обычно на http://localhost:5555)

4. Выберите модель `User`

5. Найдите нужного пользователя по email или twitchLogin

6. Проверьте следующие поля:
   - `twitchLogin` - должен совпадать с Twitch логином (в нижнем регистре)
   - `isMainAdmin` - true для главного админа, false для обычных админов
   - `email` - email пользователя

7. Если нужно изменить данные:
   - Нажмите на запись
   - Измените нужные поля
   - Нажмите "Save"

8. После изменений пользователю нужно **переавторизоваться** (выйти и войти заново)

---

## Способ 2: Прямые SQL запросы через psql

1. Подключитесь к базе данных:
   ```bash
   psql -U postgres -d twitch_subscribers
   ```
   (или используйте ваши учетные данные из DATABASE_URL)

2. Посмотреть всех пользователей:
   ```sql
   SELECT id, email, name, "twitchLogin", "isMainAdmin", "createdAt" 
   FROM "User" 
   ORDER BY "createdAt" DESC;
   ```

3. Найти пользователя по Twitch логину:
   ```sql
   SELECT * FROM "User" WHERE "twitchLogin" = 'ваш_twitch_логин';
   ```

4. Найти пользователя по email:
   ```sql
   SELECT * FROM "User" WHERE email = 'ваш_email@example.com';
   ```

5. Проверить, есть ли у пользователя twitchLogin:
   ```sql
   SELECT id, email, name, "twitchLogin", "isMainAdmin" 
   FROM "User" 
   WHERE "twitchLogin" IS NOT NULL;
   ```

6. Обновить twitchLogin для пользователя (если нужно):
   ```sql
   UPDATE "User" 
   SET "twitchLogin" = 'правильный_логин' 
   WHERE email = 'email@example.com';
   ```

7. Выйти из psql:
   ```sql
   \q
   ```

---

## Способ 3: Через Node.js скрипт

Создайте файл `check-users.js`:

```javascript
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
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

  console.log('Все пользователи:')
  console.log(JSON.stringify(users, null, 2))

  // Найти пользователя по twitchLogin
  const userByLogin = await prisma.user.findUnique({
    where: { twitchLogin: 'ваш_twitch_логин' },
  })
  
  if (userByLogin) {
    console.log('\nПользователь найден по twitchLogin:')
    console.log(JSON.stringify(userByLogin, null, 2))
  } else {
    console.log('\nПользователь с таким twitchLogin не найден')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

Запустите:
```bash
node check-users.js
```

---

## Что проверить для админа:

1. **twitchLogin** должен быть заполнен и совпадать с реальным Twitch логином (в нижнем регистре)
2. **isMainAdmin** - true для главного админа, false для обычных админов
3. **email** - должен быть заполнен

## Если данные неправильные:

1. Обновите `twitchLogin` в базе (должен быть в нижнем регистре)
2. Убедитесь, что `twitchLogin` совпадает с реальным Twitch логином
3. Попросите пользователя **выйти и войти заново** через Twitch

---

## Быстрая проверка через SQL:

```sql
-- Показать всех админов
SELECT id, email, name, "twitchLogin", "isMainAdmin" 
FROM "User" 
WHERE "isMainAdmin" = true OR "twitchLogin" IS NOT NULL;
```
