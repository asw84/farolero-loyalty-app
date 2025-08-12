# Настройка AmoCRM для Docker контейнера

## Проблема
При запуске бэкенда в Docker контейнере возникает ошибка:
```
Error: amocrm.json not found!
```

Это происходит потому, что файл `amocrm.json` содержит секретные данные и не хранится в репозитории.

## Решение

### 1. Создайте файл конфигурации
Скопируйте пример файла конфигурации:
```bash
cp backend/amocrm/amocrm.json.example backend/amocrm/amocrm.json
```

### 2. Заполните файл конфигурации
Откройте файл `backend/amocrm/amocrm.json` и заполните его своими данными:

```json
{
  "base_url": "https://your_domain.amocrm.ru",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "auth_code": "your_auth_code",
  "redirect_uri": "https://your_redirect_uri.com"
}
```

### 3. Получение данных для AmoCRM

#### Client ID и Client Secret
1. Зайдите в свой аккаунт AmoCRM
2. Перейдите в Настройки → Интеграции → API
3. Создайте новое приложение или используйте существующее
4. Скопируйте Client ID и Client Secret

#### Auth Code
1. Используйте URL для получения кода авторизации:
   ```
   https://your_domain.amocrm.ru/oauth2/authorize?client_id=YOUR_CLIENT_ID&mode=popup&response_type=code
   ```
2. Разрешите доступ приложению
3. Скопируйте код из URL после перенаправления

#### Redirect URI
Укажите тот же redirect_uri, который указан в настройках вашего приложения AmoCRM.

### 4. Перезапустите Docker контейнеры
После создания файла конфигурации перезапустите контейнеры:
```bash
docker-compose down
docker-compose up -d
```

## Проверка работы
Проверьте логи контейнера:
```bash
docker-compose logs -f backend
```

Если все настроено правильно, вы не должны видеть ошибку `amocrm.json not found!`.

## Дополнительная информация
- Файл `amocrm.json` игнорируется Git для безопасности
- Файл монтируется в контейнер через Docker volume
- Пример конфигурации находится в `backend/amocrm/amocrm.json.example`