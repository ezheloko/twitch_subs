# Исправление статуса главного администратора

## Проблема
Ezhebot стал главным администратором вместо Ezheloko.

## Решение через Prisma Studio (рекомендуется)

1. Откройте Prisma Studio:
```bash
npm run db:studio
```

2. Откройте модель `User`

3. Найдите пользователя **Ezheloko** (по email или twitchLogin)

4. Убедитесь, что у Ezheloko установлено `isMainAdmin: true`

5. Найдите пользователя **Ezhebot** и убедитесь, что у него установлено `isMainAdmin: false`

6. Сохраните изменения

## Решение через SQL (если Prisma Studio недоступен)

Выполните SQL команды в вашей базе данных:

```sql
-- Убрать статус главного админа у Ezhebot
UPDATE "User" 
SET "isMainAdmin" = false 
WHERE "twitchLogin" = 'ezhebot' OR LOWER("twitchLogin") = 'ezhebot';

-- Установить статус главного админа для Ezheloko
UPDATE "User" 
SET "isMainAdmin" = true 
WHERE "twitchLogin" = 'ezheloko' OR LOWER("twitchLogin") = 'ezheloko';

-- Проверить результат
SELECT id, email, "twitchLogin", "isMainAdmin" 
FROM "User" 
WHERE "twitchLogin" IN ('ezhebot', 'ezheloko') OR LOWER("twitchLogin") IN ('ezhebot', 'ezheloko');
```

## После исправления

1. **Перелогиньтесь** в приложении (выйдите и войдите снова)
2. Проверьте, что Ezheloko виден в списке администраторов
3. Проверьте, что Ezheloko имеет статус "Главный администратор"

## Предотвращение проблемы в будущем

Логика в `lib/auth.ts` была исправлена - теперь статус `isMainAdmin` **никогда** не меняется при логине существующего пользователя. Он устанавливается только:
- При создании первого пользователя (если база данных пустая)
- Вручную через базу данных или админ-панель
