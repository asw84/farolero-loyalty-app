# Руководство по деплою с сохранением настроек VK

## Проблема
При каждом деплое проекта настройки VK (токены, ключи доступа, конфигурация) терялись, что приводило к необходимости ручной перенастройки VK Callback API и OAuth.

## Решение

### 1. Использование безопасного скрипта деплоя

Вместо стандартного `deploy-full-rebuild.sh` используйте новый скрипт `deploy-vk-safe.sh`, который автоматически сохраняет и восстанавливает все необходимые настройки VK:

```bash
chmod +x deploy-vk-safe.sh
./deploy-vk-safe.sh
```

### 2. Что сохраняется при деплое

Скрипт автоматически сохраняет и восстанавливает следующие файлы:

- `backend/.env` - все переменные окружения, включая настройки VK
- `frontend/.env` - переменные окружения для фронтенда
- `backend/tokens.json` - токены доступа
- `backend/amocrm/amocrm.json` - настройки AmoCRM
- `backend/app/tokens/` - директория с токенами

### 3. Настройка Docker Compose для постоянного хранения

В файле `docker-compose.yml` уже настроены volumes для постоянного хранения данных:

```yaml
volumes:
  - ./persistent_data:/app/persistent_data  # Общий volume для всех данных
  - tokens_volume:/app/tokens  # Отдельный volume для токенов
```

Это гарантирует, что данные не будут потеряны при перезапуске контейнеров.

### 4. Проверка работы после деплоя

Скрипт автоматически проверяет:
- Доступность эндпоинта VK Callback API: `/webhooks/vk`
- Доступность эндпоинта VK OAuth: `/auth/vk/login`

### 5. Ручная проверка настроек VK

После деплоя вы можете проверить работу VK:

```bash
# Проверка логов VK
docker-compose logs -f backend | grep -i vk

# Проверка доступности эндпоинтов
curl -X POST https://api.5425685-au70735.twc1.net/webhooks/vk -H "Content-Type: application/json" -d '{"type": "confirmation"}'
curl https://api.5425685-au70735.twc1.net/auth/vk/login?tg_user_id=TEST
```

### 6. Настройка VK Callback API

После деплоя убедитесь, что в настройках сообщества VK указан правильный URL:

**URL для Callback API:** `https://api.5425685-au70735.twc1.net/webhooks/vk`

### 7. Настройка VK OAuth

Убедитесь, что в настройках приложения VK указаны правильные redirect URI:

**Redirect URI:** `https://api.5425685-au70735.twc1.net/api/oauth/vk/callback`

### 8. Важные переменные окружения

Убедитесь, что в `backend/.env` установлены все необходимые переменные:

```bash
# VK OAuth Configuration
VK_CLIENT_ID=54020829
VK_CLIENT_SECRET=ваш_защищенный_ключ
VK_REDIRECT_URI=https://api.5425685-au70735.twc1.net/api/oauth/vk/callback

# VK ID Configuration
VK_SERVICE_KEY=ваш_сервисный_ключ

# VK Group Configuration
VK_GROUP_ID=ваш_id_группы
VK_GROUP_TOKEN=ваш_токен_группы

# VK Bot Configuration
VK_CONFIRMATION_TOKEN=ваш_токен_подтверждения
VK_SECRET_KEY=ваш_секретный_ключ
VK_ACCESS_TOKEN=ваш_токен_доступа

# App Configuration
APP_BASE_URL=https://api.5425685-au70735.twc1.net
NODE_ENV=production
PORT=3001

# JWT Configuration
JWT_SECRET=ваш_jwt_секрет
```

### 9. Автоматическое обновление токенов

Для автоматического обновления токенов VK можно использовать cron:

```bash
# Добавить в crontab
0 */6 * * * cd /var/www/farolero-loyalty-app && docker-compose exec backend node scripts/refresh-vk-tokens.js
```

### 10. Резервное копирование

Для дополнительной безопасности настройте регулярное резервное копирование:

```bash
#!/bin/bash
# backup-vk-settings.sh
BACKUP_DIR="/backup/vk-settings"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

cp /var/www/farolero-loyalty-app/backend/.env $BACKUP_DIR/.env.$DATE
cp /var/www/farolero-loyalty-app/backend/tokens.json $BACKUP_DIR/tokens.json.$DATE
cp -r /var/www/farolero-loyalty-app/backend/app/tokens $BACKUP_DIR/tokens_$DATE/

# Хранить резервные копии за последние 7 дней
find $BACKUP_DIR -name "*.env.*" -mtime +7 -delete
find $BACKUP_DIR -name "tokens.json.*" -mtime +7 -delete
find $BACKUP_DIR -name "tokens_*" -mtime +7 -delete
```

## Заключение

Используя `deploy-vk-safe.sh` и правильную настройку Docker volumes, вы гарантируете, что все настройки VK будут сохранены при каждом деплое, и VK Callback API будет работать корректно после перезапуска сервера.