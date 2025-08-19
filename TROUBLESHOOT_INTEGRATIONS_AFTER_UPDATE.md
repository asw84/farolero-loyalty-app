# Диагностика и исправление проблем с интеграциями после обновления

## Обзор

После обновления сервера до ветки `final` могут возникнуть проблемы с интеграциями VK ID и AmoCRM. Этот документ поможет вам диагностировать и решить эти проблемы.

## Симптомы

- Ошибка конфигурации клиента VK ID
- Ошибка сети при попытке получить контакт из AmoCRM
- Изменился дизайн интерфейса

## Шаги по диагностике и исправлению

### Шаг 1: Проверка наличия и содержимого файлов конфигурации

Подключитесь к серверу и проверьте наличие важных файлов конфигурации:

```bash
# Подключитесь к серверу
ssh your_user@your_server_ip

# Перейдите в директорию проекта
cd /var/www/farolero-loyalty-app

# Проверьте наличие файлов конфигурации
ls -la backend/.env
ls -la frontend/.env
ls -la backend/tokens.json
ls -la backend/amocrm/amocrm.json
ls -la backend/app/tokens/
```

Если какие-то файлы отсутствуют, проверьте директорию бэкапа:

```bash
ls -la /tmp/farolero-backup/
```

### Шаг 2: Проверка логов бэкенда

Проверьте логи бэкенда для выявления ошибок:

```bash
# Просмотр последних логов бэкенда
docker-compose logs --tail=100 backend

# Фильтрация логов по ошибкам VK
docker-compose logs backend | grep -i vk

# Фильтрация логов по ошибкам AmoCRM
docker-compose logs backend | grep -i amocrm

# Фильтрация логов по ошибкам
docker-compose logs backend | grep -i error
```

### Шаг 3: Проверка и восстановление конфигурации VK ID

#### Проверка конфигурации VK ID в .env файле

```bash
# Просмотр содержимого .env файла бэкенда
cat backend/.env
```

Убедитесь, что в файле присутствуют следующие переменные:

```
VK_CLIENT_ID=ваш_client_id
VK_CLIENT_SECRET=ваш_client_secret
VK_REDIRECT_URI=https://api.5425685-au70735.twc1.net/api/oauth/vk/callback
VK_SERVICE_KEY=ваш_service_key
VK_GROUP_ID=ваш_id_группы
VK_GROUP_TOKEN=ваш_токен_группы
VK_CONFIRMATION_TOKEN=ваш_токен_подтверждения
VK_SECRET_KEY=ваш_секретный_ключ
VK_ACCESS_TOKEN=ваш_токен_доступа
```

#### Проверка конфигурации VK ID в tokens.json

```bash
# Просмотр содержимого tokens.json
cat backend/tokens.json
```

Убедитесь, что файл содержит корректные данные для VK.

#### Восстановление конфигурации VK ID

Если файлы отсутствуют или содержат неверные данные, восстановите их из бэкапа:

```bash
# Восстановление .env файла
cp /tmp/farolero-backup/backend/.env backend/

# Восстановление tokens.json
cp /tmp/farolero-backup/tokens.json backend/

# Перезапустите бэкенд
docker-compose restart backend
```

### Шаг 4: Проверка и восстановление конфигурации AmoCRM

#### Проверка конфигурации AmoCRM

```bash
# Просмотр содержимого amocrm.json
cat backend/amocrm/amocrm.json
```

Убедитесь, что файл содержит корректные данные для подключения к AmoCRM:

```json
{
  "client_id": "ваш_client_id",
  "client_secret": "ваш_client_secret",
  "redirect_uri": "https://api.5425685-au70735.twc1.net/api/amocrm/callback",
  "subdomain": "ваш_subdomain",
  "access_token": "ваш_access_token",
  "refresh_token": "ваш_refresh_token",
  "token_type": "Bearer",
  "expires_in": 86400,
  "expires_at": "время_истечения_токена"
}
```

#### Проверка токенов AmoCRM

```bash
# Проверка токенов в app/tokens
ls -la backend/app/tokens/
cat backend/app/tokens/amocrm_tokens.json
```

#### Восстановление конфигурации AmoCRM

Если файлы отсутствуют или содержат неверные данные, восстановите их из бэкапа:

```bash
# Восстановление amocrm.json
cp /tmp/farolero-backup/amocrm.json backend/amocrm/amocrm.json

# Восстановление токенов AmoCRM
cp -r /tmp/farolero-backup/tokens backend/app/

# Перезапустите бэкенд
docker-compose restart backend
```

### Шаг 5: Обновление токенов AmoCRM

Если токены AmoCRM истекли, обновите их:

```bash
# Запуск скрипта обновления токенов
docker-compose exec backend node scripts/refresh-amocrm-tokens.js
```

### Шаг 6: Проверка работы API эндпоинтов

После восстановления конфигурации проверьте работу API эндпоинтов:

```bash
# Проверка health endpoint
curl -s https://api.5425685-au70735.twc1.net/health

# Проверка VK Callback API
curl -s https://api.5425685-au70735.twc1.net/webhooks/vk

# Проверка VK OAuth
curl -s https://api.5425685-au70735.twc1.net/auth/vk/login

# Проверка AmoCRM
curl -s https://api.5425685-au70735.twc1.net/api/amocrm/health
```

### Шаг 7: Перезапуск контейнеров

Если после всех шагов проблемы остаются, выполните полный перезапуск контейнеров:

```bash
# Остановка контейнеров
docker-compose down

# Запуск контейнеров
docker-compose up -d

# Проверка статуса
docker-compose ps
```

## Если проблемы не решены

### Проверка переменных окружения в контейнере

```bash
# Проверка переменных окружения в контейнере бэкенда
docker-compose exec backend env | grep -i vk
docker-compose exec backend env | grep -i amocrm
```

### Проверка подключения к AmoCRM вручную

```bash
# Запуск тестового скрипта для AmoCRM
docker-compose exec backend node test-amocrm.js
```

### Проверка подключения к VK вручную

```bash
# Запуск тестового скрипта для VK
docker-compose exec backend node test-vk-integration.js
```

## Восстановление из резервной копии

Если ничего не помогает, вы можете восстановить файлы конфигурации из резервной копии:

```bash
# Создание директории для бэкапа текущих файлов
mkdir -p /tmp/current-config
cp backend/.env /tmp/current-config/
cp backend/tokens.json /tmp/current-config/
cp -r backend/amocrm /tmp/current-config/
cp -r backend/app/tokens /tmp/current-config/

# Восстановление из предыдущего бэкапа
cp /tmp/farolero-backup/backend/.env backend/
cp /tmp/farolero-backup/tokens.json backend/
cp -r /tmp/farolero-backup/amocrm.json backend/amocrm/amocrm.json
cp -r /tmp/farolero-backup/tokens backend/app/

# Перезапуск контейнеров
docker-compose restart backend
```

## Обращение в поддержку

Если после всех шагов проблемы остаются, обратитесь в поддержку, предоставив:

1. Вывод команды `docker-compose logs --tail=200 backend`
2. Содержимое файлов конфигурации (без секретных ключей)
3. Результаты проверки API эндпоинтов

## Заключение

Следуя этим инструкциям, вы сможете диагностировать и решить большинство проблем с интеграциями после обновления сервера. Основные причины проблем обычно связаны с отсутствием или повреждением файлов конфигурации.