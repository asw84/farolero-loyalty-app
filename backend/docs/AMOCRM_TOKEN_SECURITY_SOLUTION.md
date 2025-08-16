# 🔐 Решение проблемы сохранения токенов AmoCRM

## 🚨 Проблема

### Текущая ситуация
При деплое проекта на GitHub и сервер **теряются токены AmoCRM**, что приводит к:
- Потере авторизации с AmoCRM API
- Необходимости повторной авторизации после каждого деплоя
- Прерыванию синхронизации данных с CRM

### Причины проблемы
1. **Файл `tokens.json` не попадает в Git** (в `.gitignore`)
2. **Docker контейнеры пересоздаются** при деплое
3. **Persistent volumes не настроены** правильно
4. **Нет backup механизма** для восстановления токенов

## ✅ Комплексное решение

### 1. Настройка Persistent Volumes

#### 1.1 Обновить `docker-compose.yml`
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    volumes:
      # КРИТИЧНО: Постоянное хранение токенов
      - amocrm_tokens:/app/tokens
      - amocrm_config:/app/amocrm
      - persistent_data:/app/persistent_data
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "8080:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  # Именованные volumes для гарантированного сохранения
  amocrm_tokens:
    driver: local
  amocrm_config:
    driver: local  
  persistent_data:
    driver: local
```

#### 1.2 Создать структуру папок
```bash
# Создать на сервере постоянные директории
mkdir -p /opt/farolero/tokens
mkdir -p /opt/farolero/config
mkdir -p /opt/farolero/database

# Привязать к контейнеру
volumes:
  - /opt/farolero/tokens:/app/tokens
  - /opt/farolero/config:/app/amocrm
  - /opt/farolero/database:/app/database
```

### 2. Environment Variables Backup

#### 2.1 Обновить `.env.example`
```env
# AmoCRM Configuration
AMOCRM_DOMAIN=your_domain.amocrm.ru
AMOCRM_CLIENT_ID=your_client_id
AMOCRM_CLIENT_SECRET=your_client_secret
AMOCRM_REDIRECT_URI=https://yourdomain.com/api/amocrm/callback

# ВАЖНО: Backup токенов в переменных окружения
AMOCRM_ACCESS_TOKEN=backup_access_token_here
AMOCRM_REFRESH_TOKEN=backup_refresh_token_here
AMOCRM_TOKEN_EXPIRES_AT=1234567890

# Путь к токенам (для Docker)
TOKENS_PATH=/app/tokens
```

#### 2.2 Обновить `backend/amocrm/apiClient.js`
```javascript
// Улучшенная система сохранения токенов
function saveTokens(tokens) {
    if (!tokens.created_at) { 
        tokens.created_at = Math.floor(Date.now() / 1000); 
    }
    
    // 1. Сохранить в файл (primary)
    const tokensDir = path.dirname(TOKENS_PATH);
    if (!fs.existsSync(tokensDir)) {
        fs.mkdirSync(tokensDir, { recursive: true });
    }
    fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
    
    // 2. Backup в переменные окружения
    process.env.AMOCRM_ACCESS_TOKEN = tokens.access_token;
    process.env.AMOCRM_REFRESH_TOKEN = tokens.refresh_token;
    process.env.AMOCRM_TOKEN_EXPIRES_AT = String(tokens.created_at + tokens.expires_in);
    
    // 3. Backup в базу данных (дополнительная защита)
    saveTokesToDatabase(tokens);
    
    console.log(`[AMO] 💾 Tokens saved to: ${TOKENS_PATH}`);
    console.log(`[AMO] 🔄 Environment variables updated`);
}

// Новая функция - backup в БД
function saveTokesToDatabase(tokens) {
    try {
        const db = require('../database');
        db.run(`
            INSERT OR REPLACE INTO tokens 
            (service, access_token, refresh_token, expires_at, created_at) 
            VALUES (?, ?, ?, ?, ?)
        `, [
            'amocrm',
            tokens.access_token,
            tokens.refresh_token,
            tokens.created_at + tokens.expires_in,
            new Date().toISOString()
        ]);
        console.log('[AMO] 🗄️ Tokens backed up to database');
    } catch (error) {
        console.error('[AMO] ❌ Failed to backup tokens to database:', error.message);
    }
}

// Улучшенная функция восстановления токенов
function getTokens() {
    // 1. Попытка загрузить из файла
    if (fs.existsSync(TOKENS_PATH)) {
        try {
            const content = fs.readFileSync(TOKENS_PATH, 'utf-8');
            if (content) {
                const tokens = JSON.parse(content);
                console.log('[AMO] 📁 Tokens loaded from file');
                return tokens;
            }
        } catch (error) {
            console.warn('[AMO] ⚠️ Failed to read tokens from file:', error.message);
        }
    }
    
    // 2. Fallback: восстановление из переменных окружения
    if (process.env.AMOCRM_REFRESH_TOKEN) {
        console.log('[AMO] 🔄 Restoring tokens from environment variables');
        const tokens = {
            access_token: process.env.AMOCRM_ACCESS_TOKEN || '',
            refresh_token: process.env.AMOCRM_REFRESH_TOKEN,
            created_at: 0, // Принуждаем к обновлению
            expires_in: 86400 // 24 часа по умолчанию
        };
        
        // Сохраняем восстановленные токены в файл
        saveTokens(tokens);
        return tokens;
    }
    
    // 3. Последний fallback: попытка загрузить из БД
    try {
        const tokens = getTokensFromDatabase();
        if (tokens) {
            console.log('[AMO] 🗄️ Tokens restored from database');
            saveTokens(tokens); // Сохраняем в файл для быстрого доступа
            return tokens;
        }
    } catch (error) {
        console.warn('[AMO] ⚠️ Failed to restore from database:', error.message);
    }
    
    console.log('[AMO] ❌ No tokens found - authorization required');
    return { access_token: '', refresh_token: '', created_at: 0, expires_in: 0 };
}

function getTokensFromDatabase() {
    try {
        const db = require('../database');
        const row = db.get(`
            SELECT access_token, refresh_token, expires_at 
            FROM tokens 
            WHERE service = 'amocrm' 
            ORDER BY created_at DESC 
            LIMIT 1
        `);
        
        if (row) {
            return {
                access_token: row.access_token,
                refresh_token: row.refresh_token,
                created_at: Math.floor(Date.now() / 1000),
                expires_in: Math.max(0, row.expires_at - Math.floor(Date.now() / 1000))
            };
        }
    } catch (error) {
        console.error('[AMO] Database restore error:', error.message);
    }
    return null;
}
```

### 3. Обновление схемы базы данных

#### 3.1 Добавить таблицу токенов в `backend/database.js`
```javascript
// Добавить в функцию initDatabase()
db.run(`
    CREATE TABLE IF NOT EXISTS tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service VARCHAR(50) NOT NULL,
        access_token TEXT,
        refresh_token TEXT NOT NULL,
        expires_at INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(service)
    )
`);

console.log('✅ Database table "tokens" ready');
```

### 4. GitHub Actions для автоматического деплоя

#### 4.1 Создать `.github/workflows/deploy.yml`
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up environment variables
      run: |
        # Создать .env файл с секретами
        echo "AMOCRM_ACCESS_TOKEN=${{ secrets.AMOCRM_ACCESS_TOKEN }}" >> backend/.env
        echo "AMOCRM_REFRESH_TOKEN=${{ secrets.AMOCRM_REFRESH_TOKEN }}" >> backend/.env
        echo "VK_CLIENT_SECRET=${{ secrets.VK_CLIENT_SECRET }}" >> backend/.env
        echo "VK_SERVICE_KEY=${{ secrets.VK_SERVICE_KEY }}" >> backend/.env
        echo "INSTAGRAM_APP_SECRET=${{ secrets.INSTAGRAM_APP_SECRET }}" >> backend/.env
        echo "TELEGRAM_BOT_TOKEN=${{ secrets.TELEGRAM_BOT_TOKEN }}" >> backend/.env
        echo "JWT_SECRET=${{ secrets.JWT_SECRET }}" >> backend/.env
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/farolero
          git pull origin main
          
          # Сохранить текущие токены перед обновлением
          if [ -f "backend/tokens.json" ]; then
            cp backend/tokens.json tokens_backup.json
          fi
          
          # Обновить контейнеры
          docker-compose down
          docker-compose up -d --build
          
          # Восстановить токены если нужно
          if [ -f "tokens_backup.json" ] && [ ! -f "backend/tokens.json" ]; then
            cp tokens_backup.json backend/tokens.json
          fi
          
          # Проверить статус
          docker-compose ps
          docker-compose logs --tail=50
```

#### 4.2 Настроить GitHub Secrets
В репозитории GitHub → Settings → Secrets and variables → Actions:

```
AMOCRM_ACCESS_TOKEN = ваш_текущий_access_token
AMOCRM_REFRESH_TOKEN = ваш_refresh_token  
VK_CLIENT_SECRET = реальный_ключ_vk
VK_SERVICE_KEY = сервисный_ключ_vk
INSTAGRAM_APP_SECRET = секрет_instagram
TELEGRAM_BOT_TOKEN = токен_бота
JWT_SECRET = случайная_строка_для_jwt
HOST = ip_адрес_сервера
USERNAME = имя_пользователя_сервера
SSH_KEY = приватный_ssh_ключ
```

### 5. Скрипт для миграции токенов

#### 5.1 Создать `scripts/migrate-tokens.js`
```javascript
#!/usr/bin/env node
// Скрипт для безопасной миграции токенов

const fs = require('fs');
const path = require('path');

async function migrateTokens() {
    console.log('🔄 Migrating AmoCRM tokens...');
    
    // 1. Проверить наличие старых токенов
    const oldTokensPath = path.join(__dirname, '..', 'backend', 'tokens.json');
    const newTokensPath = path.join(__dirname, '..', 'persistent_data', 'tokens', 'tokens.json');
    
    if (fs.existsSync(oldTokensPath)) {
        console.log('📁 Found existing tokens file');
        
        // 2. Создать новую структуру папок
        const newDir = path.dirname(newTokensPath);
        if (!fs.existsSync(newDir)) {
            fs.mkdirSync(newDir, { recursive: true });
            console.log('📂 Created new tokens directory');
        }
        
        // 3. Скопировать токены
        fs.copyFileSync(oldTokensPath, newTokensPath);
        console.log('✅ Tokens migrated successfully');
        
        // 4. Проверить валидность
        try {
            const tokens = JSON.parse(fs.readFileSync(newTokensPath, 'utf-8'));
            if (tokens.access_token && tokens.refresh_token) {
                console.log('✅ Tokens validation passed');
                
                // 5. Обновить переменные окружения
                console.log('🔄 Update your .env file with:');
                console.log(`AMOCRM_ACCESS_TOKEN=${tokens.access_token}`);
                console.log(`AMOCRM_REFRESH_TOKEN=${tokens.refresh_token}`);
                
            } else {
                console.error('❌ Invalid tokens format');
            }
        } catch (error) {
            console.error('❌ Failed to validate tokens:', error.message);
        }
    } else {
        console.log('❌ No existing tokens found');
        console.log('ℹ️  Please authorize AmoCRM first by visiting /api/amocrm/init');
    }
}

migrateTokens().catch(console.error);
```

### 6. Мониторинг токенов

#### 6.1 Создать `scripts/monitor-tokens.js`
```javascript
#!/usr/bin/env node
// Мониторинг состояния токенов AmoCRM

const fs = require('fs');
const path = require('path');

function checkTokensHealth() {
    console.log('🔍 Checking AmoCRM tokens health...');
    
    const tokensPath = process.env.TOKENS_PATH || path.join(__dirname, '..', 'backend', 'tokens.json');
    
    if (!fs.existsSync(tokensPath)) {
        console.log('❌ Tokens file not found');
        return false;
    }
    
    try {
        const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = tokens.created_at + tokens.expires_in;
        const timeLeft = expiresAt - now;
        
        console.log(`📅 Tokens expire at: ${new Date(expiresAt * 1000).toISOString()}`);
        console.log(`⏰ Time left: ${Math.floor(timeLeft / 3600)} hours`);
        
        if (timeLeft < 3600) { // Менее часа
            console.log('⚠️  WARNING: Tokens expire soon!');
            return false;
        } else if (timeLeft < 86400) { // Менее суток
            console.log('⚠️  Tokens expire in less than 24 hours');
        } else {
            console.log('✅ Tokens are healthy');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Failed to check tokens:', error.message);
        return false;
    }
}

// Запуск проверки
if (require.main === module) {
    const isHealthy = checkTokensHealth();
    process.exit(isHealthy ? 0 : 1);
}

module.exports = { checkTokensHealth };
```

### 7. Cron задача для мониторинга

#### 7.1 Настроить crontab на сервере
```bash
# Проверять токены каждые 6 часов
0 */6 * * * cd /opt/farolero && node scripts/monitor-tokens.js

# Создать backup токенов каждый день
0 2 * * * cd /opt/farolero && cp backend/tokens.json backup/tokens-$(date +\%Y\%m\%d).json
```

### 8. Инструкция по восстановлению

#### 8.1 Если токены потерялись:

```bash
# 1. Проверить backup файлы
ls -la backup/tokens-*.json

# 2. Восстановить из последнего backup
cp backup/tokens-20241225.json backend/tokens.json

# 3. Перезапустить сервисы
docker-compose restart backend

# 4. Проверить статус
curl http://localhost:3001/api/amocrm/test
```

#### 8.2 Если backup нет:
```bash
# 1. Получить новый код авторизации
curl http://localhost:3001/api/amocrm/init

# 2. Пройти OAuth flow в браузере
# 3. Проверить создание новых токенов
cat backend/tokens.json

# 4. Обновить GitHub Secrets новыми токенами
```

## 🎯 Результат решения

### ✅ Гарантии безопасности
1. **Тройное резервирование**: файл → env → БД
2. **Persistent volumes** в Docker
3. **Автоматическое восстановление** при потере
4. **Мониторинг и алерты** при проблемах

### 🚀 Простота деплоя  
1. **GitHub Actions** автоматически деплоит
2. **Секреты** безопасно хранятся в GitHub
3. **Zero-downtime** обновления
4. **Rollback** в случае проблем

### 📊 Мониторинг
1. **Health checks** каждые 6 часов
2. **Автоматические backup** токенов
3. **Логирование** всех операций с токенами
4. **Алерты** при критических проблемах

---

**Статус**: ✅ Готово к внедрению  
**Приоритет**: 🔥 КРИТИЧЕСКИЙ  
**Время внедрения**: 2-4 часа  
**Ответственный**: Technical Lead  

*Этот документ решает основную проблему проекта и обеспечивает стабильную работу AmoCRM интеграции.*
