# Комплексное руководство по деплою проекта Farolero

## Проблемы
1. При каждом деплое проекта все настройки (токены, ключи доступа, конфигурация, база данных) терялись, что приводило к необходимости полной перенастройки проекта.
2. Использовалась Node.js версии 18, которая менее стабильна, чем версия 20.
3. Возникало жесткое кеширование старых файлов фронтенда, из-за чего пользователи видели старую версию приложения.

## Решение

### 1. Использование комплексного безопасного скрипта деплоя

Вместо стандартного `deploy-full-rebuild.sh` используйте новый скрипт `deploy-project-safe.sh`, который автоматически сохраняет и восстанавливает ВСЕ необходимые настройки проекта:

```bash
chmod +x deploy-project-safe.sh
./deploy-project-safe.sh
```

### 2. Обновление версии Node.js и решение проблемы кеширования

Скрипт автоматически:
- Обновляет Node.js до версии 20 (более стабильная)
- Генерирует уникальную версию сборки для предотвращения кеширования
- Добавляет HTTP-заголовки для предотвращения кеширования в nginx
- Принудительно пересобирает контейнеры с очисткой кеша

### 3. Что сохраняется при деплое

Скрипт автоматически сохраняет и восстанавливает следующие файлы и директории:

#### Файлы конфигурации и Docker:
- `backend/.env` - все переменные окружения бэкенда
- `frontend/.env` - переменные окружения фронтенда
- `backend/Dockerfile` - обновлен для использования Node.js 20
- `frontend/Dockerfile` - обновлен для предотвращения кеширования
- `docker-compose.yml` - обновлен для поддержки новой версии Node.js и предотвращения кеширования

#### Токены и ключи доступа:
- `backend/tokens.json` - основные токены доступа
- `backend/app/tokens/` - директория с токенами AmoCRM
- `backend/amocrm/amocrm.json` - настройки и токены AmoCRM
- `backend/qtickets/qtickets.json` - настройки Qtickets
- `backend/instagram/instagram.json` - настройки Instagram

#### Данные:
- `backend/data/loyalty.db` - база данных SQLite
- `backend/persistent_data/` - постоянные данные приложения

### 4. Настройка Docker Compose для постоянного хранения

В файле `docker-compose.yml` уже настроены volumes для постоянного хранения данных:

```yaml
volumes:
  - ./persistent_data:/app/persistent_data  # Общий volume для всех данных
  - tokens_volume:/app/tokens  # Отдельный volume для токенов
```

Это гарантирует, что данные не будут потеряны при перезапуске контейнеров.

### 5. Проверка работы после деплоя

Скрипт автоматически проверяет работу всех ключевых компонентов:
- Health endpoint: `/health`
- VK Callback API: `/webhooks/vk`
- VK OAuth: `/auth/vk/login`
- AmoCRM: `/api/amocrm/health`
- Instagram: `/api/instagram/health`

### 6. Ручная проверка настроек после деплоя

После деплоя вы можете проверить работу всех компонентов:

```bash
# Проверка логов всех сервисов
docker-compose logs -f backend

# Проверка логов конкретных сервисов
docker-compose logs -f backend | grep -i vk
docker-compose logs -f backend | grep -i amocrm
docker-compose logs -f backend | grep -i instagram
docker-compose logs -f backend | grep -i qtickets

# Проверка доступности эндпоинтов
curl https://api.5425685-au70735.twc1.net/health
curl -X POST https://api.5425685-au70735.twc1.net/webhooks/vk -H "Content-Type: application/json" -d '{"type": "confirmation"}'
curl https://api.5425685-au70735.twc1.net/auth/vk/login?tg_user_id=TEST
curl https://api.5425685-au70735.twc1.net/api/amocrm/health
curl https://api.5425685-au70735.twc1.net/api/instagram/health
```

### 7. Важные переменные окружения

Убедитесь, что в `backend/.env` установлены все необходимые переменные:

```bash
# VK Configuration
VK_CLIENT_ID=54020829
VK_CLIENT_SECRET=ваш_защищенный_ключ
VK_SERVICE_KEY=ваш_сервисный_ключ
VK_REDIRECT_URI=https://api.5425685-au70735.twc1.net/api/oauth/vk/callback
VK_GROUP_ID=ваш_id_группы
VK_GROUP_TOKEN=ваш_токен_группы
VK_CONFIRMATION_TOKEN=ваш_токен_подтверждения
VK_SECRET_KEY=ваш_секретный_ключ
VK_ACCESS_TOKEN=ваш_токен_доступа

# AmoCRM Configuration
AMOCRM_DOMAIN=https://your-domain.amocrm.ru
AMOCRM_CLIENT_ID=your_amocrm_client_id
AMOCRM_CLIENT_SECRET=your_amocrm_client_secret
AMOCRM_REDIRECT_URI=https://api.5425685-au70735.twc1.net/api/amocrm/callback

# Instagram Configuration
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
INSTAGRAM_REDIRECT_URI=https://api.5425685-au70735.twc1.net/api/instagram/callback

# Qtickets Configuration
QTICKETS_WEBHOOK_SECRET=your_qtickets_webhook_secret

# App Configuration
APP_BASE_URL=https://api.5425685-au70735.twc1.net
NODE_ENV=production
PORT=3001

# JWT Configuration
JWT_SECRET=ваш_jwt_секрет

# Database Configuration
DATABASE_PATH=./data/loyalty.db
STORAGE_PATH=/app/persistent_data
TOKENS_PATH=/app/tokens
```

### 8. Настройка внешних сервисов

После деплоя убедитесь, что в настройках внешних сервисов указаны правильные URL:

#### VK Callback API:
**URL для Callback API:** `https://api.5425685-au70735.twc1.net/webhooks/vk`

#### VK OAuth:
**Redirect URI:** `https://api.5425685-au70735.twc1.net/api/oauth/vk/callback`

#### AmoCRM:
**Redirect URI:** `https://api.5425685-au70735.twc1.net/api/amocrm/callback`

#### Instagram:
**Redirect URI:** `https://api.5425685-au70735.twc1.net/api/instagram/callback`

### 9. Автоматическое обновление токенов

Для автоматического обновления токенов можно использовать cron:

```bash
# Добавить в crontab
0 */6 * * * cd /var/www/farolero-loyalty-app && docker-compose exec backend node scripts/refresh-amocrm-tokens.js
0 */6 * * * cd /var/www/farolero-loyalty-app && docker-compose exec backend node scripts/refresh-instagram-tokens.js
```

### 10. Резервное копирование

Для дополнительной безопасности настройте регулярное резервное копирование:

```bash
#!/bin/bash
# backup-all-settings.sh
BACKUP_DIR="/backup/farolero-full"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Копируем все важные файлы
cp /var/www/farolero-loyalty-app/backend/.env $BACKUP_DIR/.env.$DATE
cp /var/www/farolero-loyalty-app/backend/tokens.json $BACKUP_DIR/tokens.json.$DATE
cp /var/www/farolero-loyalty-app/backend/amocrm/amocrm.json $BACKUP_DIR/amocrm.json.$DATE
cp /var/www/farolero-loyalty-app/backend/data/loyalty.db $BACKUP_DIR/loyalty.db.$DATE
cp -r /var/www/farolero-loyalty-app/backend/app/tokens $BACKUP_DIR/tokens_$DATE/
cp -r /var/www/farolero-loyalty-app/backend/persistent_data $BACKUP_DIR/persistent_data_$DATE/

# Хранить резервные копии за последние 7 дней
find $BACKUP_DIR -name "*.env.*" -mtime +7 -delete
find $BACKUP_DIR -name "tokens.json.*" -mtime +7 -delete
find $BACKUP_DIR -name "amocrm.json.*" -mtime +7 -delete
find $BACKUP_DIR -name "loyalty.db.*" -mtime +7 -delete
find $BACKUP_DIR -name "tokens_*" -mtime +7 -delete
find $BACKUP_DIR -name "persistent_data_*" -mtime +7 -delete
```

### 11. Восстановление из резервной копии

Если что-то пошло не так, вы можете восстановить данные из резервной копии:

```bash
#!/bin/bash
# restore-from-backup.sh
BACKUP_DIR="/backup/farolero-full"
LATEST_BACKUP=$(ls -t $BACKUP_DIR | head -n 1)

echo "Восстановление из резервной копии: $LATEST_BACKUP"

# Останавливаем контейнеры
cd /var/www/farolero-loyalty-app
docker-compose down

# Восстанавливаем файлы
cp $BACKUP_DIR/.env.$LATEST_BACKUP backend/.env
cp $BACKUP_DIR/tokens.json.$LATEST_BACKUP backend/tokens.json
cp $BACKUP_DIR/amocrm.json.$LATEST_BACKUP backend/amocrm/amocrm.json
cp $BACKUP_DIR/loyalty.db.$LATEST_BACKUP backend/data/loyalty.db
cp -r $BACKUP_DIR/tokens_$LATEST_BACKUP backend/app/tokens
cp -r $BACKUP_DIR/persistent_data_$LATEST_BACKUP backend/persistent_data

# Запускаем контейнеры
docker-compose up -d
```

### 11. Мониторинг

Настройте мониторинг для отслеживания состояния всех сервисов:

```bash
#!/bin/bash
# monitor-services.sh
echo "Проверка состояния сервисов Farolero..."

# Проверка health endpoint
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.5425685-au70735.twc1.net/health)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ Health endpoint: OK"
else
    echo "❌ Health endpoint: ERROR ($HEALTH_STATUS)"
fi

# Проверка VK API
VK_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.5425685-au70735.twc1.net/webhooks/vk)
if [[ "$VK_STATUS" =~ ^(200|403|400)$ ]]; then
    echo "✅ VK API: OK"
else
    echo "❌ VK API: ERROR ($VK_STATUS)"
fi

# Проверка AmoCRM
AMOCRM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.5425685-au70735.twc1.net/api/amocrm/health)
if [[ "$AMOCRM_STATUS" =~ ^(200|401|400)$ ]]; then
    echo "✅ AmoCRM: OK"
else
    echo "❌ AmoCRM: ERROR ($AMOCRM_STATUS)"
fi

# Проверка Instagram
INSTAGRAM_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://api.5425685-au70735.twc1.net/api/instagram/health)
if [[ "$INSTAGRAM_STATUS" =~ ^(200|401|400)$ ]]; then
    echo "✅ Instagram: OK"
else
    echo "❌ Instagram: ERROR ($INSTAGRAM_STATUS)"
fi
```

## Заключение

Используя `deploy-project-safe.sh` и правильную настройку Docker volumes, вы гарантируете, что ВСЕ настройки проекта будут сохранены при каждом деплое, и все компоненты (VK, AmoCRM, Instagram, Qtickets) будут работать корректно после перезапуска сервера.