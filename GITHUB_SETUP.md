# Инструкция по загрузке проекта на GitHub

Пошаговая инструкция по созданию репозитория и загрузке проекта на GitHub.

## Предварительные требования

- Аккаунт на GitHub (https://github.com)
- Git установлен на вашем компьютере
- Проект готов к загрузке

---

## Шаг 1: Создание репозитория на GitHub

1. Перейдите на https://github.com и войдите в свой аккаунт

2. Нажмите кнопку **"+"** в правом верхнем углу → выберите **"New repository"**

3. Заполните форму создания репозитория:
   - **Repository name**: `twitch-subscribers` (или другое название)
   - **Description**: Описание проекта (например: "Веб-приложение для визуализации подписчиков Twitch")
   - **Visibility**: 
     - **Private** - только вы и приглашенные пользователи могут видеть репозиторий (рекомендуется)
     - **Public** - все могут видеть репозиторий
   - **НЕ отмечайте** галочки:
     - ❌ "Add a README file" (если проект уже существует локально)
     - ❌ "Add .gitignore" (у нас уже есть .gitignore)
     - ❌ "Choose a license" (можно добавить позже)

4. Нажмите кнопку **"Create repository"**

---

## Шаг 2: Проверка .gitignore

Убедитесь, что файл `.gitignore` содержит важные исключения:

```gitignore
# env files (важно - не загружать секретные данные!)
.env*
.env.local
.env.production

# node_modules
/node_modules

# build файлы
/.next/
/out/
/build
```

**Критически важно:** Файл `.env` с секретными данными (пароли, API ключи) **НЕ должен** попасть в репозиторий!

---

## Шаг 3: Инициализация Git в проекте

Откройте терминал (PowerShell, CMD или Git Bash) в папке проекта:

```bash
# Перейдите в папку проекта
cd E:\projects\plyukhochat\twitch-subscribers

# Проверьте, инициализирован ли уже Git
git status
```

### Если Git не инициализирован:

```bash
# Инициализируйте Git репозиторий
git init

# Добавьте все файлы (кроме тех, что в .gitignore)
git add .

# Создайте первый коммит
git commit -m "Initial commit: Twitch Subscribers project"
```

### Если Git уже инициализирован:

```bash
# Проверьте статус
git status

# Добавьте все изменения
git add .

# Создайте коммит
git commit -m "Initial commit: Twitch Subscribers project"
```

---

## Шаг 4: Подключение к удаленному репозиторию

После создания репозитория на GitHub, скопируйте URL репозитория (он будет показан на странице).

### Вариант A: HTTPS (проще для начинающих)

```bash
# Добавьте удаленный репозиторий (замените YOUR_USERNAME на ваш GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/twitch-subscribers.git

# Пример:
# git remote add origin https://github.com/username/twitch-subscribers.git
```

### Вариант B: SSH (требует настройки SSH ключа)

```bash
# Добавьте удаленный репозиторий через SSH
git remote add origin git@github.com:YOUR_USERNAME/twitch-subscribers.git
```

### Проверка подключения:

```bash
# Проверьте список удаленных репозиториев
git remote -v

# Должно показать:
# origin  https://github.com/YOUR_USERNAME/twitch-subscribers.git (fetch)
# origin  https://github.com/YOUR_USERNAME/twitch-subscribers.git (push)
```

---

## Шаг 5: Настройка авторизации

### Для HTTPS (Personal Access Token)

GitHub больше не принимает пароли для HTTPS. Нужен Personal Access Token:

1. GitHub → ваш профиль (правый верхний угол) → **Settings**
2. В левом меню: **Developer settings**
3. **Personal access tokens** → **Tokens (classic)**
4. Нажмите **"Generate new token"** → **"Generate new token (classic)"**
5. Заполните форму:
   - **Note**: `Git push access` (описание для себя)
   - **Expiration**: Выберите срок действия (например, 90 дней)
   - **Select scopes**: Отметьте `repo` (полный доступ к репозиториям)
6. Нажмите **"Generate token"**
7. **Скопируйте токен** (он показывается только один раз!)
8. Сохраните токен в безопасном месте

При выполнении `git push` используйте:
- **Username**: ваш GitHub username
- **Password**: вставьте Personal Access Token

### Для SSH (настройка SSH ключа)

Если используете SSH, нужно добавить SSH ключ в GitHub:

1. Проверьте, есть ли у вас SSH ключ:
```bash
ls -al ~/.ssh
```

2. Если ключа нет, создайте его:
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
# Нажмите Enter для всех вопросов
```

3. Скопируйте публичный ключ:
```bash
# Windows (PowerShell)
cat ~/.ssh/id_ed25519.pub

# Linux/macOS
cat ~/.ssh/id_ed25519.pub
```

4. Добавьте ключ в GitHub:
   - GitHub → Settings → **SSH and GPG keys**
   - **New SSH key**
   - **Title**: `My Computer` (любое название)
   - **Key**: вставьте скопированный ключ
   - **Add SSH key**

---

## Шаг 6: Загрузка кода на GitHub

```bash
# Переименуйте ветку в main (если нужно)
git branch -M main

# Загрузите код на GitHub
git push -u origin main
```

Если появится запрос авторизации:
- **HTTPS**: Введите username и Personal Access Token
- **SSH**: Может потребоваться подтверждение (введите `yes`)

После успешной загрузки вы увидите сообщение:
```
Enumerating objects: X, done.
Counting objects: 100% (X/X), done.
...
To https://github.com/YOUR_USERNAME/twitch-subscribers.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

---

## Шаг 7: Проверка

1. Откройте ваш репозиторий на GitHub: `https://github.com/YOUR_USERNAME/twitch-subscribers`
2. Убедитесь, что все файлы загружены
3. **Проверьте, что файл `.env` НЕ загружен!** (он должен быть в `.gitignore`)

---

## Шаг 8: Удаление .env из репозитория (если случайно загрузили)

Если вы случайно загрузили `.env` файл:

```bash
# Удалите .env из Git (но оставьте локально)
git rm --cached .env

# Создайте коммит
git commit -m "Remove .env from repository"

# Загрузите изменения
git push
```

**Важно:** После этого:
1. Смените все пароли и ключи, которые были в `.env`
2. Создайте новый `.env` локально с новыми значениями

---

## Дальнейшая работа с Git

### После внесения изменений в проект:

```bash
# Проверить статус изменений
git status

# Добавить все изменения
git add .

# Или добавить конкретные файлы
git add путь/к/файлу

# Создать коммит с описанием
git commit -m "Описание того, что было изменено"

# Загрузить изменения на GitHub
git push
```

### Получение обновлений с GitHub:

```bash
# Скачать изменения с GitHub
git pull
```

### Просмотр истории коммитов:

```bash
# Показать последние коммиты
git log

# Показать последние коммиты (кратко)
git log --oneline
```

---

## Полезные команды Git

```bash
# Показать текущий статус
git status

# Показать изменения в файлах
git diff

# Показать историю коммитов
git log

# Показать информацию об удаленных репозиториях
git remote -v

# Изменить URL удаленного репозитория
git remote set-url origin НОВЫЙ_URL

# Отменить изменения в файле (до добавления в staging)
git checkout -- имя_файла

# Отменить последний коммит (но оставить изменения)
git reset --soft HEAD~1
```

---

## Решение проблем

### Ошибка: "remote origin already exists"

```bash
# Удалите существующий remote
git remote remove origin

# Добавьте заново
git remote add origin https://github.com/YOUR_USERNAME/twitch-subscribers.git
```

### Ошибка: "Permission denied (publickey)"

- Убедитесь, что SSH ключ добавлен в GitHub
- Или используйте HTTPS вместо SSH

### Ошибка: "Authentication failed"

- Для HTTPS: используйте Personal Access Token вместо пароля
- Проверьте правильность username

### Ошибка: "failed to push some refs"

```bash
# Сначала получите изменения с GitHub
git pull origin main --allow-unrelated-histories

# Затем загрузите свои изменения
git push -u origin main
```

---

## Создание .env.example

Рекомендуется создать файл `.env.example` с примером переменных окружения (без реальных значений):

```env
# База данных
DATABASE_URL="postgresql://user:password@localhost:5432/twitch_subscribers?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Twitch OAuth
TWITCH_CLIENT_ID="your-twitch-client-id"
TWITCH_CLIENT_SECRET="your-twitch-client-secret"

# Node окружение
NODE_ENV="development"
```

Этот файл можно безопасно загрузить на GitHub, чтобы другие разработчики знали, какие переменные нужны.

---

## Готово!

Теперь ваш проект на GitHub и готов к развертыванию. Следующие шаги описаны в [DEPLOYMENT.md](./DEPLOYMENT.md).
