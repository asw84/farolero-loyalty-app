# Настройка GitHub Actions для автоматического деплоя

## Обзор

В проекте настроены два workflow для автоматического деплоя:

1. **`deploy.yml`** - Стандартный деплой через npm/systemctl
2. **`deploy-docker.yml`** - Деплой через Docker Compose (ручной запуск)

## Настройка секретов в GitHub

Перейдите в Settings → Secrets and variables → Actions вашего репозитория и добавьте следующие секреты:

### Обязательные секреты

- **`SERVER_HOST`** - IP адрес или домен сервера (например: `5425685-au70735.twc1.net`)
- **`SERVER_USER`** - Пользователь для SSH подключения (например: `root`)
- **`SERVER_SSH_KEY`** - Приватный SSH ключ для подключения к серверу

### Опциональные секреты

- **`SERVER_PORT`** - Порт SSH (по умолчанию 22)

## Генерация SSH ключа

Если у вас нет SSH ключа для деплоя, создайте его:

```bash
# На локальной машине
ssh-keygen -t rsa -b 4096 -C "github-actions@farolero"
# Сохраните как ~/.ssh/farolero_deploy

# Скопируйте публичный ключ на сервер
ssh-copy-id -i ~/.ssh/farolero_deploy.pub user@server

# Скопируйте приватный ключ в GitHub Secrets
cat ~/.ssh/farolero_deploy
```

## Структура деплоя на сервере

Убедитесь, что на сервере есть:

```
/var/www/farolero-loyalty-app/
├── backend/
├── frontend/
├── docker-compose.yml
└── .git/
```

## Автоматический деплой

### Стандартный workflow (deploy.yml)

Запускается автоматически при:
- Push в ветку `main`
- Pull Request в ветку `main` (только тесты, без деплоя)

Шаги:
1. Checkout кода
2. Установка Node.js 18
3. Установка зависимостей backend/frontend
4. Сборка frontend
5. Запуск тестов backend
6. Деплой на сервер (только для push в main)

### Docker workflow (deploy-docker.yml)

Запускается:
- Вручную через GitHub Actions UI
- При push в `main` (исключая изменения в docs/)

Использует Docker Compose для пересборки и перезапуска контейнеров.

## Настройка на сервере

### Для стандартного деплоя

Убедитесь, что на сервере настроены systemd сервисы:

```bash
# /etc/systemd/system/farolero-backend.service
[Unit]
Description=Farolero Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/farolero-loyalty-app/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

### Для Docker деплоя

Убедитесь, что установлены Docker и Docker Compose:

```bash
sudo apt update
sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER
```

## Переменные окружения

Создайте `.env` файлы на сервере:

### backend/.env
```
NODE_ENV=production
STORAGE_MODE=hybrid

# AmoCRM
AMOCRM_CLIENT_ID=your_client_id
AMOCRM_CLIENT_SECRET=your_client_secret
AMOCRM_REDIRECT_URI=https://api.5425685-au70735.twc1.net/api/amocrm/callback
AMOCRM_BASE_URL=https://new5a097b0640fce.amocrm.ru

# VK
VK_APP_ID=54020829
VK_APP_SECRET=your_vk_app_secret
VK_REDIRECT_URI=https://api.5425685-au70735.twc1.net/api/oauth/vk/callback
VK_CONFIRMATION_TOKEN=5a92b0bc
VK_SECRET_KEY=gK7pW9sRzE2xY4qA0jF8vU3mB1nC5h

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token

# Qtickets
QTICKETS_API_URL=your_qtickets_api
QTICKETS_CLIENT_ID=your_qtickets_client_id
QTICKETS_CLIENT_SECRET=your_qtickets_client_secret
```

### frontend/.env
```
VITE_API_URL=https://api.5425685-au70735.twc1.net
```

## Мониторинг деплоя

После настройки вы можете отслеживать деплои в разделе Actions вашего GitHub репозитория. При каждом push в main будет автоматически запускаться деплой.

## Откат (Rollback)

Если что-то пошло не так, можно быстро откатиться:

```bash
# На сервере
cd /var/www/farolero-loyalty-app
git log --oneline -5  # Посмотреть последние коммиты
git reset --hard COMMIT_HASH  # Откатиться к нужному коммиту
# Затем перезапустить сервисы или Docker
```
