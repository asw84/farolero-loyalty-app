# Получение токена AmoCRM локально

## Проблема
При локальной разработке нужно получить рабочие токены AmoCRM для интеграции, но стандартный процесс через redirect не подходит для localhost.

## Решение

### Шаг 1: Подготовка локальной среды
1. Откройте проект на локальном компьютере
2. Удалите старый файл `backend/tokens.json` (если есть)
3. В файле `backend/.env` убедитесь, что:
   ```
   AMOCRM_REDIRECT_URI=http://localhost:3001/api/amocrm/callback
   TOKENS_PATH=./app/tokens
   ```
4. Создайте папку для токенов:
   ```bash
   mkdir -p app/tokens
   ```

### Шаг 2: Настройка AmoCRM
1. Откройте AmoCRM в браузере
2. Перейдите в Настройки → Интеграции → Созданные вами
3. Откройте вашу интеграцию
4. На вкладке "Ключи и доступы" в поле "Ссылка для перенаправления" временно впишите:
   ```
   http://localhost:3001/api/amocrm/callback
   ```
5. Сохраните изменения
6. **Сгенерируйте НОВЫЙ код авторизации** (⚠️ Действует только 10 минут!)
7. Скопируйте код

### Шаг 3: Обновление конфигурации
В файле `backend/amocrm/amocrm.json` вставьте новый код:
```json
{
  "base_url": "https://your-domain.amocrm.ru",
  "client_id": "your-client-id",
  "client_secret": "your-client-secret",
  "auth_code": "ВСТАВЬТЕ_НОВЫЙ_КОД_СЮДА",
  "redirect_uri": "http://localhost:3001/api/amocrm/callback"
}
```

### Шаг 4: Временное изменение контроллера
В файле `backend/controllers/amocrm.controller.js` измените функцию `init`:
```javascript
const init = async (req, res) => {
    try {
        await amocrmClient.getInitialToken();
        res.send('Токены AmoCRM успешно получены. Эндпоинт можно больше не использовать.');
    } catch (error) {
        console.error('❌ [AMOCRM_INIT_CONTROLLER] Ошибка при вызове getInitialToken:', error);
        res.status(500).send('Ошибка при получении токенов. Проверь консоль бэкенда.');
    }
};
```

### Шаг 5: Получение токенов
1. Запустите backend локально:
   ```bash
   cd backend
   npm start
   ```
2. Откройте в браузере:
   ```
   http://localhost:3001/api/amocrm/init
   ```
3. ✅ Успех: в папке `app/tokens/` появится файл `tokens.json`

### Шаг 6: Восстановление
После получения токенов верните функцию `init` к исходному виду:
```javascript
const init = async (req, res) => {
    try {
        const authUrl = amocrmClient.getAuthUrl();
        res.redirect(authUrl);
    } catch (error) {
        console.error('Ошибка при инициализации авторизации AmoCRM:', error);
        res.status(500).send('Ошибка при инициализации авторизации');
    }
};
```

## Важные моменты
- ⏰ **Код авторизации действует только 10 минут!**
- 🔄 **Токены автоматически обновляются** с помощью refresh_token
- 📁 **Путь TOKENS_PATH** должен соответствовать среде (Docker vs localhost)
- 🔄 **После получения токенов** восстановите исходный код контроллера

## Возможные ошибки
- `Authorization code has expired` - Нужен новый код авторизации
- `TOKENS_PATH not found` - Проверьте путь в .env и создайте папку
- JSON syntax error - Проверьте запятые в amocrm.json

## Результат
После выполнения всех шагов у вас будет:
- Рабочий файл `app/tokens/tokens.json` с access_token и refresh_token
- Автоматическое обновление токенов при истечении
- Полнофункциональная интеграция AmoCRM
