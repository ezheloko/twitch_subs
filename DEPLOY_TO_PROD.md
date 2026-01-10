# Деплой изменений на продакшн

## Шаги для деплоя

### 1. Подключитесь к серверу

```bash
ssh root@ваш-сервер-ip
# или
ssh root@twitchsubs.myddns.me
```

### 2. Перейдите в директорию проекта

```bash
cd /root/twitch-subscribers
```

### 3. Получите последние изменения из Git (если используете Git)

```bash
git pull origin main
# или
git pull origin master
```

**Если не используете Git**, скопируйте измененные файлы вручную:
- `lib/auth.ts`
- `lib/auth-helpers.ts`
- `app/api/admin-requests/route.ts`
- `app/api/admin/users/route.ts`
- `app/api/check-admin-access/route.ts`
- `components/admin/AdminSettings.tsx`
- `app/admin/page.tsx`

### 4. Установите зависимости (если были добавлены новые)

```bash
npm install
```

### 5. Примените миграции базы данных

```bash
npm run db:push
```

Это создаст таблицу `AdminRequest`, если её еще нет.

### 6. Перегенерируйте Prisma Client

```bash
npm run db:generate
```

### 7. Пересоберите проект

```bash
npm run build
```

### 8. Перезапустите приложение через PM2

```bash
pm2 restart all
# или
pm2 restart twitch-subscribers
```

### 9. Проверьте статус PM2

```bash
pm2 status
pm2 logs --lines 50
```

## Важно: Исправление статуса главного админа на проде

После деплоя нужно убедиться, что правильный пользователь является главным админом:

### Вариант 1: Через Prisma Studio (рекомендуется)

1. На сервере выполните:
```bash
cd /root/twitch-subscribers
npm run db:studio
```

2. Откройте в браузере `http://ваш-сервер-ip:5555` (или через SSH туннель)

3. Найдите пользователя **Ezheloko** и установите `isMainAdmin: true`

4. Найдите пользователя **Ezhebot** и установите `isMainAdmin: false`

### Вариант 2: Через SQL

Подключитесь к базе данных:

```bash
psql -U postgres -d twitch_subscribers
```

Выполните SQL команды:

```sql
-- Убрать статус у Ezhebot
UPDATE "User" SET "isMainAdmin" = false WHERE LOWER("twitchLogin") = 'ezhebot';

-- Установить статус для Ezheloko
UPDATE "User" SET "isMainAdmin" = true WHERE LOWER("twitchLogin") = 'ezheloko';

-- Проверить результат
SELECT id, email, "twitchLogin", "isMainAdmin" 
FROM "User" 
WHERE LOWER("twitchLogin") IN ('ezhebot', 'ezheloko');
```

### Вариант 3: Через скрипт (если настроен доступ к БД)

```bash
cd /root/twitch-subscribers
node scripts/fix-main-admin.js
```

## Проверка после деплоя

1. **Откройте админ-панель** в браузере
2. **Перелогиньтесь** (выйдите и войдите снова)
3. **Проверьте:**
   - Ezheloko виден в списке администраторов
   - Ezheloko имеет статус "Главный администратор"
   - Ezhebot либо не виден, либо не является главным админом
   - Заявки на администрирование загружаются без ошибок
   - Список администраторов загружается без ошибок

## Если что-то пошло не так

### Проверьте логи приложения:
```bash
pm2 logs --lines 100
```

### Проверьте логи Nginx:
```bash
tail -f /var/log/nginx/error.log
```

### Проверьте, что приложение запущено:
```bash
pm2 status
curl http://localhost:3000/api/check-admin-access
```

### Если нужно откатить изменения:
```bash
cd /root/twitch-subscribers
git checkout HEAD~1  # если используете Git
npm run build
pm2 restart all
```

## Быстрая команда для деплоя (если используете Git)

```bash
cd /root/twitch-subscribers && \
git pull && \
npm install && \
npm run db:push && \
npm run db:generate && \
npm run build && \
pm2 restart all && \
pm2 logs --lines 20
```
