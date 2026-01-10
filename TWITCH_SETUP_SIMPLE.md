# 🎮 Настройка Twitch OAuth - Простая инструкция

## 📍 Шаг 1: Заходим на Twitch Developer Console

**Ссылка:** https://dev.twitch.tv/console/apps

1. Войдите в свой аккаунт Twitch
2. Нажмите кнопку **"Register Your Application"** (вверху справа)

---

## 📝 Шаг 2: Заполняем форму создания приложения

### Поле "Name":
```
Twitch Subscribers
```
(или любое другое название)

### Поле "OAuth Redirect URLs":
```
http://localhost:3000/api/auth/callback/twitch
```

**⚠️ ВАЖНО:** Скопируйте эту строку точно, включая `http://` и путь `/api/auth/callback/twitch`

### Поле "Category":
Выберите из списка:
```
Website Integration
```

### Нажмите кнопку:
```
Create
```

---

## 🔑 Шаг 3: Копируем Client ID и Client Secret

После создания приложения вы увидите страницу с данными:

### Client ID:
- Это длинная строка, например: `abc123def456ghi789jkl012mno345pq`
- **Скопируйте её полностью**

### Client Secret:
- Прокрутите страницу вниз
- Найдите раздел **"Client Secret"**
- Нажмите **"New Secret"**
- Подтвердите создание
- **⚠️ ВАЖНО:** Секрет показывается только один раз! Скопируйте его сразу

---

## 📄 Шаг 4: Обновляем файл .env

Откройте файл `.env` в папке проекта:
```
E:\projects\plyukhochat\twitch-subscribers\.env
```

Найдите эти строки:
```env
TWITCH_CLIENT_ID=your-twitch-client-id
TWITCH_CLIENT_SECRET=your-twitch-client-secret
```

Замените на ваши реальные значения:
```env
TWITCH_CLIENT_ID=abc123def456ghi789jkl012mno345pq
TWITCH_CLIENT_SECRET=xyz789uvw456rst123opq012mno345ab
```

**Пример правильного .env файла:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/twitch_subscribers?schema=public"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-this-in-production
TWITCH_CLIENT_ID=abc123def456ghi789jkl012mno345pq
TWITCH_CLIENT_SECRET=xyz789uvw456rst123opq012mno345ab
```

---

## ✅ Шаг 5: Проверяем работу

1. **Сохраните файл `.env`**

2. **Перезапустите сервер** (если он запущен):
   ```bash
   # Остановите сервер (Ctrl+C)
   npm run dev
   ```

3. **Откройте в браузере:**
   ```
   http://localhost:3000/admin
   ```

4. **Должно произойти:**
   - Автоматическое перенаправление на страницу авторизации Twitch
   - После нажатия "Authorize" вы вернетесь на `/admin`
   - Первый пользователь автоматически станет главным администратором

---

## ❌ Если что-то не работает

### Ошибка: "Invalid redirect URI"
**Что делать:**
1. Проверьте, что в Twitch Console в поле "OAuth Redirect URLs" указано точно:
   ```
   http://localhost:3000/api/auth/callback/twitch
   ```
2. Убедитесь, что в `.env` указано:
   ```
   NEXTAUTH_URL=http://localhost:3000
   ```

### Ошибка: "Client ID or secret is invalid"
**Что делать:**
1. Проверьте, что скопировали Client ID и Client Secret без лишних пробелов
2. Убедитесь, что в `.env` нет кавычек вокруг значений:
   ```env
   # ❌ НЕПРАВИЛЬНО:
   TWITCH_CLIENT_ID="abc123..."
   
   # ✅ ПРАВИЛЬНО:
   TWITCH_CLIENT_ID=abc123...
   ```
3. Перезапустите сервер после изменения `.env`

### Ошибка: "Redirect URI mismatch"
**Что делать:**
1. Вернитесь на https://dev.twitch.tv/console/apps
2. Выберите ваше приложение
3. Проверьте поле "OAuth Redirect URLs"
4. Убедитесь, что там указано: `http://localhost:3000/api/auth/callback/twitch`

---

## 📸 Визуальная подсказка

**Где найти Client ID и Secret:**
```
┌─────────────────────────────────────┐
│  Twitch Developer Console           │
│                                     │
│  [Ваше приложение]                  │
│                                     │
│  Client ID:                         │
│  ┌─────────────────────────────┐   │
│  │ abc123def456...             │ ← Скопируйте это
│  └─────────────────────────────┘   │
│                                     │
│  [Прокрутите вниз]                  │
│                                     │
│  Client Secret:                     │
│  ┌─────────────────────────────┐   │
│  │ [New Secret]               │ ← Нажмите здесь
│  └─────────────────────────────┘   │
│                                     │
│  После создания:                    │
│  ┌─────────────────────────────┐   │
│  │ xyz789uvw456...            │ ← Скопируйте это
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## 🚀 Готово!

После выполнения всех шагов авторизация через Twitch должна работать.

**Проверка:**
- Откройте http://localhost:3000/admin
- Должно произойти перенаправление на Twitch
- После авторизации вы вернетесь на страницу админки
