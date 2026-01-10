# Исправление проблемы с базой данных

## Проблема
Ошибка при авторизации: `Invalid prisma.user.count() invocation` - база данных не инициализирована.

## Решение

### Шаг 1: Исправьте файл .env

Откройте файл `.env` и оставьте **ТОЛЬКО ОДНУ** строку с `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/twitch_subscribers?schema=public"
```

**Важно:**
- Замените `user` на ваше имя пользователя PostgreSQL (обычно `postgres`)
- Замените `password` на ваш пароль PostgreSQL
- Замените `twitch_subscribers` на имя вашей базы данных (или создайте новую)
- Убедитесь, что порт `5432` правильный (стандартный порт PostgreSQL)

**Удалите** строку с `prisma+postgres://` - это не нужно для локальной разработки.

### Шаг 2: Создайте базу данных (если еще не создана)

Откройте PostgreSQL и выполните:

```sql
CREATE DATABASE twitch_subscribers;
```

Или используйте psql:
```bash
psql -U postgres
CREATE DATABASE twitch_subscribers;
\q
```

### Шаг 3: Примените схему к базе данных

Выполните в терминале:

```bash
npm run db:push
```

Должно появиться:
```
✔ Your database is now in sync with your Prisma schema.
```

### Шаг 4: Перезапустите сервер

```bash
npm run dev
```

### Шаг 5: Попробуйте авторизацию снова

Откройте http://localhost:3000/admin и войдите через Twitch.

## Если все еще не работает

Проверьте:
1. PostgreSQL запущен и доступен
2. Правильность пароля в `DATABASE_URL`
3. База данных `twitch_subscribers` существует
4. Порт PostgreSQL правильный (обычно 5432)

Для проверки подключения:
```bash
npm run db:studio
```

Это откроет Prisma Studio, где вы сможете увидеть структуру базы данных.
