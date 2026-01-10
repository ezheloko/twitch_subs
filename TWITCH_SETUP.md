# Пошаговая инструкция по настройке Twitch OAuth

## Шаг 1: Регистрация приложения в Twitch Developer Console

1. **Откройте Twitch Developer Console:**
   - Перейдите по адресу: https://dev.twitch.tv/console/apps
   - Войдите в свой аккаунт Twitch (если не вошли)

2. **Создайте новое приложение:**
   - Нажмите кнопку **"Register Your Application"** (или "Зарегистрировать приложение")
   - Заполните форму:

   **Name (Название):**
   ```
   Twitch Subscribers Admin
   ```
   (или любое другое название на ваше усмотрение)

   **OAuth Redirect URLs:**
   ```
   http://localhost:3000/api/auth/callback/twitch
   ```
   
   **Важно:** 
   - Для локальной разработки используйте `http://localhost:3000`
   - Для production замените на ваш домен, например: `https://yourdomain.com/api/auth/callback/twitch`
   - Можно добавить несколько URL через запятую

   **Category (Категория):**
   ```
   Website Integration
   ```

3. **Создайте приложение:**
   - Нажмите кнопку **"Create"** (или "Создать")
   - После создания вы увидите страницу с информацией о приложении

## Шаг 2: Получение Client ID и Client Secret

1. **Найдите Client ID:**
   - На странице приложения вы увидите **"Client ID"**
   - Это длинная строка, например: `abc123def456ghi789jkl012mno345pq`
   - Скопируйте её

2. **Создайте Client Secret:**
   - Прокрутите страницу вниз
   - Найдите раздел **"Client Secret"**
   - Нажмите кнопку **"New Secret"** (или "Новый секрет")
   - Подтвердите создание
   - **ВАЖНО:** Client Secret показывается только один раз! Скопируйте его сразу
   - Если потеряли, создайте новый секрет

## Шаг 3: Настройка .env файла

1. **Откройте файл `.env` в корне проекта:**
   ```
   E:\projects\plyukhochat\twitch-subscribers\.env
   ```

2. **Добавьте или обновите следующие строки:**
   ```env
   TWITCH_CLIENT_ID=ваш_client_id_здесь
   TWITCH_CLIENT_SECRET=ваш_client_secret_здесь
   ```

   **Пример:**
   ```env
   TWITCH_CLIENT_ID=abc123def456ghi789jkl012mno345pq
   TWITCH_CLIENT_SECRET=xyz789uvw456rst123opq012mno345ab
   ```

3. **Убедитесь, что также настроены другие переменные:**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/twitch_subscribers?schema=public"
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-change-this-in-production
   ```

## Шаг 4: Проверка настроек

1. **Убедитесь, что файл `.env` содержит все необходимые переменные:**
   ```env
   # База данных
   DATABASE_URL="postgresql://user:password@localhost:5432/twitch_subscribers?schema=public"
   
   # NextAuth
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-change-this-in-production
   
   # Twitch OAuth
   TWITCH_CLIENT_ID=ваш_client_id
   TWITCH_CLIENT_SECRET=ваш_client_secret
   ```

2. **Перезапустите сервер разработки:**
   ```bash
   # Остановите текущий процесс (Ctrl+C)
   npm run dev
   ```

## Шаг 5: Тестирование авторизации

1. **Откройте браузер и перейдите:**
   ```
   http://localhost:3000/admin
   ```

2. **Должно произойти перенаправление на Twitch:**
   - Вы увидите страницу авторизации Twitch
   - Нажмите **"Authorize"** (или "Авторизовать")
   - После успешной авторизации вы вернетесь на `/admin`

3. **Первый пользователь автоматически станет главным администратором**

## Настройка для Production

Когда будете деплоить проект на сервер:

1. **Обновите OAuth Redirect URL в Twitch Console:**
   - Вернитесь на https://dev.twitch.tv/console/apps
   - Выберите ваше приложение
   - Добавьте новый Redirect URL:
   ```
   https://yourdomain.com/api/auth/callback/twitch
   ```
   - Или замените существующий

2. **Обновите `.env` на сервере:**
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   TWITCH_CLIENT_ID=ваш_client_id
   TWITCH_CLIENT_SECRET=ваш_client_secret
   ```

## Частые проблемы

### Проблема: "Invalid redirect URI"
**Решение:** Убедитесь, что URL в Twitch Console точно совпадает с `NEXTAUTH_URL` + `/api/auth/callback/twitch`

### Проблема: "Client ID or secret is invalid"
**Решение:** 
- Проверьте, что скопировали Client ID и Client Secret правильно
- Убедитесь, что нет лишних пробелов в `.env` файле
- Перезапустите сервер после изменения `.env`

### Проблема: "Redirect URI mismatch"
**Решение:** 
- Проверьте, что в Twitch Console добавлен правильный Redirect URL
- URL должен быть точно: `http://localhost:3000/api/auth/callback/twitch` (для разработки)

## Полезные ссылки

- **Twitch Developer Console:** https://dev.twitch.tv/console/apps
- **Twitch API Documentation:** https://dev.twitch.tv/docs/authentication
- **NextAuth.js Twitch Provider:** https://next-auth.js.org/providers/twitch
