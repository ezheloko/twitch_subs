# Инструкция по развертыванию проекта

Пошаговая инструкция по запуску проекта на различных серверах и хостингах.

## Требования

- Node.js 18+ 
- PostgreSQL 12+
- npm или yarn
- Twitch OAuth приложение (Client ID и Client Secret)
- Git (для загрузки на GitHub)

---

## 0. Загрузка проекта на GitHub

Перед развертыванием рекомендуется загрузить проект на GitHub для удобного управления и автоматического деплоя.

### Шаг 1: Создание репозитория на GitHub

1. Перейдите на https://github.com
2. Войдите в свой аккаунт
3. Нажмите кнопку **"+"** в правом верхнем углу → **"New repository"**
4. Заполните форму:
   - **Repository name**: `twitch-subscribers` (или другое название)
   - **Description**: Описание проекта (опционально)
   - **Visibility**: Выберите **Private** (рекомендуется) или **Public**
   - **НЕ** отмечайте "Initialize this repository with a README" (если проект уже существует локально)
5. Нажмите **"Create repository"**

### Шаг 2: Инициализация Git в проекте

Откройте терминал в папке проекта и выполните:

```bash
# Проверьте, инициализирован ли уже Git
git status

# Если Git не инициализирован, выполните:
git init

# Добавьте все файлы (кроме тех, что в .gitignore)
git add .

# Создайте первый коммит
git commit -m "Initial commit: Twitch Subscribers project"
```

### Шаг 3: Подключение к удаленному репозиторию

```bash
# Добавьте удаленный репозиторий (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/twitch-subscribers.git

# Или если используете SSH:
# git remote add origin git@github.com:YOUR_USERNAME/twitch-subscribers.git

# Проверьте подключение
git remote -v
```

### Шаг 4: Загрузка кода на GitHub

```bash
# Переименуйте ветку в main (если нужно)
git branch -M main

# Загрузите код на GitHub
git push -u origin main
```

Если GitHub запросит авторизацию:
- **HTTPS**: Введите ваш GitHub username и Personal Access Token (не пароль)
- **SSH**: Убедитесь, что SSH ключ добавлен в GitHub Settings → SSH and GPG keys

### Создание Personal Access Token (для HTTPS)

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token (classic)
3. Выберите scope: `repo` (полный доступ к репозиториям)
4. Скопируйте токен и используйте его как пароль при `git push`

### Шаг 5: Проверка

Откройте ваш репозиторий на GitHub - все файлы должны быть загружены.

**Важно:** Убедитесь, что файл `.env` **НЕ** загружен на GitHub (он должен быть в `.gitignore`). Если случайно загрузили:

```bash
# Удалите .env из Git (но оставьте локально)
git rm --cached .env
git commit -m "Remove .env from repository"
git push
```

### Дальнейшая работа с Git

```bash
# После изменений в проекте:
git add .
git commit -m "Описание изменений"
git push

# Для получения обновлений с GitHub:
git pull
```

---

## 1. Подготовка Twitch OAuth приложения

1. Перейдите на https://dev.twitch.tv/console/apps
2. Нажмите "Register Your Application"
3. Заполните форму:
   - **Name**: Название вашего приложения
   - **OAuth Redirect URLs**: 
     - Для разработки: `http://localhost:3000/api/auth/callback/twitch`
     - Для продакшена: `https://ваш-домен.com/api/auth/callback/twitch`
   - **Category**: Выберите подходящую категорию
4. Сохраните **Client ID** и **Client Secret**

---

## 2. Настройка базы данных PostgreSQL

### Локальная установка PostgreSQL

**Windows:**
1. Скачайте PostgreSQL с https://www.postgresql.org/download/windows/
2. Установите PostgreSQL
3. Запомните пароль для пользователя `postgres`
4. Создайте базу данных:
```sql
CREATE DATABASE twitch_subscribers;
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres psql
CREATE DATABASE twitch_subscribers;
\q
```

**macOS:**
```bash
brew install postgresql
brew services start postgresql
createdb twitch_subscribers
```

### Облачные базы данных

**Vercel Postgres / Supabase / Railway / Neon:**
1. Создайте аккаунт на выбранном сервисе
2. Создайте новую базу данных PostgreSQL
3. Скопируйте строку подключения (DATABASE_URL)

---

## 3. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
# База данных
DATABASE_URL="postgresql://пользователь:пароль@хост:5432/twitch_subscribers?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="сгенерируйте-случайную-строку-минимум-32-символа"

# Twitch OAuth
TWITCH_CLIENT_ID="ваш-client-id"
TWITCH_CLIENT_SECRET="ваш-client-secret"

# Node окружение
NODE_ENV="production"
```

### Генерация NEXTAUTH_SECRET

```bash
# Linux/macOS
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

---

## 4. Установка зависимостей

```bash
npm install
```

---

## 5. Инициализация базы данных

```bash
# Генерация Prisma Client
npm run db:generate

# Применение схемы к базе данных
npm run db:push
```

---

## 6. Сборка проекта

```bash
npm run build
```

---

## 7. Развертывание на различных платформах

### 7.1. Vercel (Рекомендуется)

1. Установите Vercel CLI:
```bash
npm i -g vercel
```

2. Войдите в аккаунт:
```bash
vercel login
```

3. Разверните проект:
```bash
vercel
```

4. Настройте переменные окружения в панели Vercel:
   - Перейдите в Settings → Environment Variables
   - Добавьте все переменные из `.env`

5. Подключите базу данных:
   - Используйте Vercel Postgres или внешнюю БД
   - Обновите `DATABASE_URL` в переменных окружения

6. Обновите `NEXTAUTH_URL` на ваш домен Vercel

### 7.2. Railway

1. Создайте аккаунт на https://railway.app
2. Нажмите "New Project" → "Deploy from GitHub repo"
3. Подключите ваш репозиторий
4. Добавьте PostgreSQL сервис:
   - New → Database → PostgreSQL
5. Настройте переменные окружения:
   - Settings → Variables
   - Добавьте все переменные из `.env`
   - `DATABASE_URL` будет автоматически добавлен
6. Railway автоматически соберет и развернет проект

### 7.3. Render

1. Создайте аккаунт на https://render.com
2. New → Web Service
3. Подключите ваш репозиторий
4. Настройки:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Добавьте PostgreSQL:
   - New → PostgreSQL
   - Скопируйте Internal Database URL
6. Environment Variables:
   - Добавьте все переменные из `.env`
   - `DATABASE_URL` используйте Internal Database URL
7. Deploy

### 7.4. DigitalOcean App Platform

1. Создайте аккаунт на https://cloud.digitalocean.com
2. Apps → Create App → GitHub
3. Выберите репозиторий
4. Настройки:
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
5. Добавьте PostgreSQL Database:
   - Resources → Create Database → PostgreSQL
6. Environment Variables:
   - Добавьте все переменные из `.env`
   - `DATABASE_URL` будет автоматически доступен как `DATABASE_URL`

### 7.5. VPS (Ubuntu/Debian)

1. Подключитесь к серверу по SSH

2. Установите Node.js:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. Установите PostgreSQL:
```bash
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb twitch_subscribers
```

4. Установите PM2 для управления процессом:
```bash
sudo npm install -g pm2
```

5. Клонируйте репозиторий:
```bash
git clone https://github.com/ваш-username/twitch-subscribers.git
cd twitch-subscribers
```

6. Создайте `.env` файл:
```bash
nano .env
# Вставьте содержимое .env
```

7. Установите зависимости и соберите:
```bash
npm install
npm run build
```

8. Запустите с PM2:
```bash
pm2 start npm --name "twitch-subscribers" -- start
pm2 save
pm2 startup
```

9. Настройте Nginx (опционально):
```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/twitch-subscribers
```

Конфигурация Nginx:
```nginx
server {
    listen 80;
    server_name ваш-домен.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/twitch-subscribers /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

10. Настройте SSL с Let's Encrypt:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ваш-домен.com
```

### 7.6. Docker

Создайте `Dockerfile`:
```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

Обновите `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
}

module.exports = nextConfig
```

Создайте `docker-compose.yml`:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - TWITCH_CLIENT_ID=${TWITCH_CLIENT_ID}
      - TWITCH_CLIENT_SECRET=${TWITCH_CLIENT_SECRET}
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=twitch_subscribers
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Запуск:
```bash
docker-compose up -d
```

---

## 8. Обновление Twitch OAuth Redirect URL

После развертывания обновите Redirect URL в настройках Twitch приложения:
- Добавьте: `https://ваш-домен.com/api/auth/callback/twitch`
- Удалите старый URL для разработки (если не нужен)

---

## 9. Проверка работы

1. Откройте `https://ваш-домен.com`
2. Перейдите в `/admin`
3. Войдите через Twitch
4. Первый пользователь автоматически станет главным администратором

---

## 10. Обслуживание

### Обновление проекта

**Vercel/Railway/Render:**
- Просто сделайте `git push` - автоматический деплой

**VPS:**
```bash
cd twitch-subscribers
git pull
npm install
npm run build
pm2 restart twitch-subscribers
```

### Резервное копирование базы данных

```bash
# Создание бэкапа
pg_dump -U postgres twitch_subscribers > backup.sql

# Восстановление
psql -U postgres twitch_subscribers < backup.sql
```

### Логи

**PM2:**
```bash
pm2 logs twitch-subscribers
```

**Docker:**
```bash
docker-compose logs -f app
```

---

## Решение проблем

### Ошибка подключения к базе данных

- Проверьте `DATABASE_URL`
- Убедитесь, что PostgreSQL запущен
- Проверьте firewall настройки

### Ошибка авторизации Twitch

- Проверьте `TWITCH_CLIENT_ID` и `TWITCH_CLIENT_SECRET`
- Убедитесь, что Redirect URL совпадает с `NEXTAUTH_URL`

### Ошибка сборки

- Убедитесь, что Node.js версии 18+
- Очистите кэш: `rm -rf .next node_modules && npm install`

---

## Полезные команды

```bash
# Разработка
npm run dev

# Сборка
npm run build

# Запуск продакшена
npm start

# Работа с БД
npm run db:generate  # Генерация Prisma Client
npm run db:push      # Применение схемы
npm run db:studio    # Открыть Prisma Studio
```

---

## Поддержка

При возникновении проблем проверьте:
1. Логи приложения
2. Переменные окружения
3. Настройки базы данных
4. Настройки Twitch OAuth
