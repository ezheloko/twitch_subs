# Инструкция по установке проекта Twitch Subscribers

## Требования

- Node.js 18+ 
- PostgreSQL 12+
- npm или yarn

## Шаг 1: Установка зависимостей

```bash
npm install
```

## Шаг 2: Настройка базы данных

1. Создайте базу данных PostgreSQL:

```sql
CREATE DATABASE twitch_subscribers;
```

2. Настройте переменные окружения в файле `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/twitch_subscribers?schema=public"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret
```

**Важно:** 
- Замените `user` и `password` на ваши учетные данные PostgreSQL
- Замените `your-secret-key-change-this-in-production` на случайную строку (можно сгенерировать командой: `openssl rand -base64 32`)
- Получите `TWITCH_CLIENT_ID` и `TWITCH_CLIENT_SECRET` на [Twitch Developer Console](https://dev.twitch.tv/console/apps)

## Шаг 3: Настройка Twitch OAuth

1. Перейдите на [Twitch Developer Console](https://dev.twitch.tv/console/apps)
2. Нажмите "Register Your Application"
3. Заполните форму:
   - **Name**: Название вашего приложения
   - **OAuth Redirect URLs**: `http://localhost:3000/api/auth/callback/twitch` (для разработки)
   - **Category**: Website Integration
4. После создания приложения скопируйте **Client ID** и **Client Secret** в файл `.env`

## Шаг 4: Инициализация базы данных

```bash
# Генерация Prisma Client
npm run db:generate

# Применение схемы к базе данных
npm run db:push
```

## Шаг 5: Запуск проекта

### Режим разработки

```bash
npm run dev
```

Проект будет доступен по адресу: http://localhost:3000

### Режим production

```bash
npm run build
npm start
```

## Шаг 6: Первый вход

1. Откройте http://localhost:3000/admin
2. Войдите через Twitch
3. Первый пользователь автоматически станет главным администратором (`isMainAdmin: true`)

## Дополнительные команды

- `npm run db:studio` - Открыть Prisma Studio для просмотра и редактирования данных
- `npm run db:migrate` - Создать миграцию базы данных

## Структура проекта

```
twitch-subscribers/
├── app/
│   ├── admin/          # Административная панель
│   ├── api/            # API endpoints
│   ├── stream/         # Страница для веб-стрима
│   └── page.tsx        # Публичная страница
├── lib/                # Утилиты и конфигурация
├── prisma/             # Схема базы данных
└── public/             # Статические файлы
    └── uploads/        # Загруженные изображения
```

## Настройка для production

**Подробная инструкция по развертыванию на различных серверах и хостингах доступна в [DEPLOYMENT.md](./DEPLOYMENT.md)**

Краткий список шагов:
1. Обновите `NEXTAUTH_URL` на URL вашего домена
2. Обновите `TWITCH_CLIENT_ID` и `TWITCH_CLIENT_SECRET` с production приложения Twitch
3. Обновите OAuth Redirect URL в Twitch Developer Console на production URL
4. Убедитесь, что база данных доступна из production сервера
5. Настройте переменные окружения на вашем хостинге

## Поддержка

При возникновении проблем проверьте:
- Правильность настроек в `.env`
- Доступность базы данных PostgreSQL
- Корректность OAuth настроек в Twitch Developer Console
- Логи в консоли браузера и терминала
