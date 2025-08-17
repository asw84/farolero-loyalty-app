# 🚀 Руководство по деплою на сервер

## 🎯 Подготовка к деплою

### 📋 Что у вас должно быть:
- ✅ GitHub репозиторий с проектом
- ✅ VPS сервер (Ubuntu/CentOS/Debian)
- ✅ Доменное имя (опционально)
- ✅ SSH доступ к серверу

---

## 🔧 Метод 1: Docker деплой (рекомендуется)

### **Шаг 1: Подготовка сервера**

```bash
# Подключение к серверу
ssh root@your-server-ip

# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Проверка установки
docker --version
docker-compose --version
```

### **Шаг 2: Клонирование проекта**

```bash
# Клонирование с GitHub
git clone https://github.com/your-username/farolero-loyalty-app.git
cd farolero-loyalty-app

# Создание директорий для данных
mkdir -p persistent_data
chmod 755 persistent_data
```

### **Шаг 3: Настройка окружения**

```bash
# Копирование примера конфигурации
cp backend/.env.example backend/.env

# Редактирование конфигурации
nano backend/.env
```

**Заполните обязательные поля:**
```env
# Замените на ваш домен
APP_BASE_URL=https://your-domain.com

# Ваши API ключи
AMOCRM_DOMAIN=your-domain.amocrm.ru
AMOCRM_CLIENT_ID=your_client_id
AMOCRM_CLIENT_SECRET=your_client_secret

VK_CLIENT_ID=your_vk_client_id
VK_CLIENT_SECRET=your_vk_client_secret

# Сгенерируйте случайную строку
JWT_SECRET=your_super_secret_jwt_key_here
```

### **Шаг 4: Запуск приложения**

```bash
# Сборка и запуск контейнеров
docker-compose up -d --build

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### **Шаг 5: Настройка Nginx (опционально)**

```bash
# Установка Nginx
sudo apt install nginx -y

# Создание конфигурации
sudo nano /etc/nginx/sites-available/farolero
```

**Конфигурация Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL сертификаты (получите через Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Auth endpoints
    location /auth/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/farolero /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔧 Метод 2: PM2 деплой

### **Шаг 1: Установка Node.js**

```bash
# Установка Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установка PM2
sudo npm install -g pm2
```

### **Шаг 2: Настройка проекта**

```bash
git clone https://github.com/your-username/farolero-loyalty-app.git
cd farolero-loyalty-app

# Backend setup
cd backend
cp .env.example .env
nano .env  # Настройте переменные
npm install
node test-db-simple.js  # Инициализация БД

# Frontend setup
cd ../frontend
npm install
npm run build
```

### **Шаг 3: Запуск с PM2**

```bash
# Запуск backend
cd backend
pm2 start server.js --name "farolero-backend"

# Статический сервер для frontend
cd ../frontend
pm2 serve dist 8080 --name "farolero-frontend"

# Сохранение конфигурации PM2
pm2 save
pm2 startup
```

---

## 📊 Проверка деплоя

### **1. Проверка health endpoints:**
```bash
# Health check
curl http://your-domain.com/health

# или
curl http://localhost:3001/health
```

### **2. Проверка интеграций:**
```bash
# На сервере
cd farolero-loyalty-app/backend
node check-all-integrations.js
```

### **3. Проверка Docker контейнеров:**
```bash
docker-compose ps
docker-compose logs backend
docker-compose logs frontend
```

---

## 🔄 Обновление проекта

### **Docker деплой:**
```bash
cd farolero-loyalty-app

# Получение обновлений
git pull origin main

# Пересборка и перезапуск
docker-compose down
docker-compose up -d --build
```

### **PM2 деплой:**
```bash
cd farolero-loyalty-app
git pull origin main

# Backend обновление
cd backend
npm install
pm2 restart farolero-backend

# Frontend обновление
cd ../frontend
npm install
npm run build
pm2 restart farolero-frontend
```

---

## 🛡️ SSL сертификаты (Let's Encrypt)

```bash
# Установка Certbot
sudo apt install certbot python3-certbot-nginx -y

# Получение сертификата
sudo certbot --nginx -d your-domain.com

# Автообновление
sudo crontab -e
# Добавьте строку:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 Мониторинг

### **Логи Docker:**
```bash
# Просмотр логов
docker-compose logs -f backend
docker-compose logs -f frontend

# Логи за последние 100 строк
docker-compose logs --tail=100 backend
```

### **Логи PM2:**
```bash
pm2 logs farolero-backend
pm2 logs farolero-frontend
pm2 status
```

### **Системные ресурсы:**
```bash
# Использование ресурсов
htop
df -h
free -h

# Docker статистика
docker stats
```

---

## 🔧 Troubleshooting

### **Проблема: порты заняты**
```bash
# Проверка портов
sudo netstat -tulpn | grep :3001
sudo netstat -tulpn | grep :8080

# Освобождение портов
sudo fuser -k 3001/tcp
sudo fuser -k 8080/tcp
```

### **Проблема: недостаточно прав**
```bash
# Добавление в Docker группу
sudo usermod -aG docker $USER
# Перезайдите в систему
```

### **Проблема: база данных не создается**
```bash
cd backend
node test-db-simple.js
ls -la *.db
```

### **Проблема: AmoCRM не подключается**
```bash
cd backend
node test-vk-integration.js
# Используйте /auth/setup для настройки
```

---

## 🔄 Backup и восстановление

### **Создание backup:**
```bash
# Backup базы данных
cp backend/farolero_loyalty.db backup/farolero_loyalty_$(date +%Y%m%d).db

# Backup конфигурации
cp backend/.env backup/.env_$(date +%Y%m%d)

# Backup persistent data
tar -czf backup/persistent_data_$(date +%Y%m%d).tar.gz persistent_data/
```

### **Восстановление:**
```bash
# Остановка сервисов
docker-compose down

# Восстановление данных
cp backup/farolero_loyalty_YYYYMMDD.db backend/farolero_loyalty.db
cp backup/.env_YYYYMMDD backend/.env

# Запуск
docker-compose up -d
```

---

## 🎯 Production готовность

### **Чек-лист перед запуском:**
- ✅ SSL сертификат настроен
- ✅ Firewall настроен (порты 80, 443, 22)
- ✅ Backup система настроена
- ✅ Мониторинг логов настроен
- ✅ Health checks работают
- ✅ Все API ключи настроены
- ✅ Домен настроен правильно

### **Рекомендуемые настройки безопасности:**
```bash
# Firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Обновление системы
sudo apt update && sudo apt upgrade -y

# Автоматические обновления безопасности
sudo apt install unattended-upgrades -y
```

---

**🎉 Поздравляем! Ваш Farolero Loyalty App успешно развернут!**

Проверьте работу на: `https://your-domain.com/health`
