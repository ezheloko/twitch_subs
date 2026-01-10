# Исправление ошибки аутентификации PostgreSQL

## Ошибка
```
Error: P1000: Authentication failed against database server
```

Это означает, что учетные данные PostgreSQL в `DATABASE_URL` неверны.

## Решение

### Шаг 1: Проверьте учетные данные PostgreSQL

**Вариант A: Если вы знаете пароль PostgreSQL**

1. Откройте файл `.env`
2. Найдите строку `DATABASE_URL`
3. Исправьте её на правильный формат:

```env
DATABASE_URL="postgresql://postgres:ВАШ_ПАРОЛЬ@localhost:5432/twitch_subscribers?schema=public"
```

Замените:
- `postgres` - имя пользователя (обычно `postgres` или ваше имя пользователя)
- `ВАШ_ПАРОЛЬ` - ваш пароль PostgreSQL
- `5432` - порт PostgreSQL (обычно 5432)
- `twitch_subscribers` - имя базы данных

**Вариант B: Если вы не помните пароль**

#### Windows (если PostgreSQL установлен локально):

1. Найдите файл `pg_hba.conf` (обычно в `C:\Program Files\PostgreSQL\[версия]\data\`)
2. Временно измените метод аутентификации на `trust` для localhost:
   ```
   # TYPE  DATABASE        USER            ADDRESS                 METHOD
   host    all             all             127.0.0.1/32            trust
   ```
3. Перезапустите PostgreSQL
4. Подключитесь без пароля и измените пароль:
   ```bash
   psql -U postgres
   ALTER USER postgres PASSWORD 'новый_пароль';
   \q
   ```
5. Верните `pg_hba.conf` к исходному состоянию (обычно `md5` или `scram-sha-256`)
6. Перезапустите PostgreSQL

#### Альтернативный способ (сброс пароля через Windows):

1. Откройте "Службы" (Services)
2. Найдите "postgresql-x64-[версия]"
3. Остановите службу
4. Запустите PostgreSQL в режиме single-user:
   ```bash
   "C:\Program Files\PostgreSQL\[версия]\bin\postgres.exe" --single -D "C:\Program Files\PostgreSQL\[версия]\data" postgres
   ```
5. В открывшейся консоли выполните:
   ```sql
   ALTER USER postgres PASSWORD 'новый_пароль';
   ```
6. Закройте консоль (Ctrl+D)
7. Запустите службу PostgreSQL снова

### Шаг 2: Проверьте, что PostgreSQL запущен

**Windows:**
1. Откройте "Службы" (Services)
2. Найдите службу PostgreSQL
3. Убедитесь, что она запущена

**Или через командную строку:**
```bash
sc query postgresql-x64-[версия]
```

### Шаг 3: Проверьте подключение

Попробуйте подключиться через psql:
```bash
psql -U postgres -h localhost -p 5432
```

Если подключение успешно, значит учетные данные правильные.

### Шаг 4: Создайте базу данных (если еще не создана)

```sql
CREATE DATABASE twitch_subscribers;
```

### Шаг 5: Обновите .env файл

Убедитесь, что в `.env` только ОДНА строка с `DATABASE_URL`:

```env
DATABASE_URL="postgresql://postgres:ваш_пароль@localhost:5432/twitch_subscribers?schema=public"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret
```

### Шаг 6: Примените схему к базе данных

```bash
npm run db:push
```

### Шаг 7: Перезапустите сервер

```bash
npm run dev
```

## Альтернатива: Использование SQLite для разработки

Если у вас проблемы с PostgreSQL, можно временно использовать SQLite:

1. Измените `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```

2. В `.env`:
   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. Выполните:
   ```bash
   npm run db:push
   ```

**Примечание:** SQLite не рекомендуется для production, но подходит для разработки.
