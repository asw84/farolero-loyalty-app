#!/usr/bin/env node

/**
 * amoCRM Token Manager - Автоматическое управление токенами
 * Автор: AI Assistant
 * Версия: 1.0.0
 * 
 * Функции:
 * - Автоматическое обновление токенов
 * - Мониторинг срока действия
 * - Резервное копирование
 * - Уведомления об ошибках
 * - Веб-интерфейс для мониторинга
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { execSync } = require('child_process');

// Конфигурация путей
const CONFIG_PATH = path.join(__dirname, '../backend/amocrm/amocrm.json');
const TOKENS_PATH = path.join(__dirname, '../backend/tokens.json');
const BACKUP_DIR = path.join(__dirname, '../persistent_data/token_backups');
const LOG_FILE = path.join(__dirname, '../logs/token-manager.log');

// Создаем директории если их нет
[path.dirname(LOG_FILE), BACKUP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

class TokenManager {
    constructor() {
        this.config = this.loadConfig();
        this.tokens = this.loadTokens();
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    /**
     * Загружаем конфигурацию amoCRM
     */
    loadConfig() {
        try {
            if (!fs.existsSync(CONFIG_PATH)) {
                throw new Error(`Конфиг не найден: ${CONFIG_PATH}`);
            }
            const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
            this.log(`[CONFIG] ✅ Конфигурация загружена из ${CONFIG_PATH}`);
            return config;
        } catch (error) {
            this.log(`[CONFIG] ❌ Ошибка загрузки конфига: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Загружаем токены
     */
    loadTokens() {
        try {
            if (!fs.existsSync(TOKENS_PATH)) {
                this.log(`[TOKENS] ⚠️ Файл токенов не найден, создаем пустой`);
                return { access_token: '', refresh_token: '', created_at: 0, expires_in: 0 };
            }
            
            const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf-8'));
            this.log(`[TOKENS] ✅ Токены загружены, срок до ${new Date((tokens.created_at + tokens.expires_in) * 1000).toLocaleString()}`);
            return tokens;
        } catch (error) {
            this.log(`[TOKENS] ❌ Ошибка загрузки токенов: ${error.message}`, 'error');
            return { access_token: '', refresh_token: '', created_at: 0, expires_in: 0 };
        }
    }

    /**
     * Сохраняем токены с резервным копированием
     */
    saveTokens(tokens) {
        try {
            // Создаем резервную копию перед сохранением
            if (fs.existsSync(TOKENS_PATH)) {
                const backupName = `tokens_backup_${Date.now()}.json`;
                const backupPath = path.join(BACKUP_DIR, backupName);
                fs.copyFileSync(TOKENS_PATH, backupPath);
                this.log(`[BACKUP] 💾 Создана резервная копия: ${backupName}`);
                
                // Оставляем только последние 10 резервных копий
                this.cleanupBackups();
            }

            // Добавляем метаданные
            tokens.created_at = tokens.created_at || Math.floor(Date.now() / 1000);
            tokens.updated_by = 'token-manager';
            tokens.last_refresh = new Date().toISOString();

            // Сохраняем токены
            fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
            this.tokens = tokens;
            
            this.log(`[TOKENS] ✅ Токены сохранены, срок до ${new Date((tokens.created_at + tokens.expires_in) * 1000).toLocaleString()}`);
            
            return true;
        } catch (error) {
            this.log(`[TOKENS] ❌ Ошибка сохранения токенов: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Очистка старых резервных копий
     */
    cleanupBackups() {
        try {
            const files = fs.readdirSync(BACKUP_DIR)
                .filter(file => file.startsWith('tokens_backup_'))
                .map(file => ({
                    name: file,
                    path: path.join(BACKUP_DIR, file),
                    time: fs.statSync(path.join(BACKUP_DIR, file)).mtime
                }))
                .sort((a, b) => b.time - a.time);

            // Удаляем старые файлы, оставляем только 10 последних
            if (files.length > 10) {
                files.slice(10).forEach(file => {
                    fs.unlinkSync(file.path);
                    this.log(`[BACKUP] 🗑️ Удален старый бэкап: ${file.name}`);
                });
            }
        } catch (error) {
            this.log(`[BACKUP] ⚠️ Ошибка очистки бэкапов: ${error.message}`, 'warning');
        }
    }

    /**
     * Проверяем, истек ли токен (за 5 минут до истечения)
     */
    isTokenExpired(tokens = this.tokens) {
        if (!tokens.access_token || !tokens.created_at || !tokens.expires_in) {
            return true;
        }
        
        const expirationTime = tokens.created_at + tokens.expires_in;
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expirationTime - currentTime;
        
        // Считаем токен истекшим за 5 минут (300 секунд) до реального истечения
        return timeUntilExpiry <= 300;
    }

    /**
     * Получаем время до истечения токена в читаемом формате
     */
    getTimeUntilExpiry(tokens = this.tokens) {
        if (!tokens.created_at || !tokens.expires_in) return 'неизвестно';
        
        const expirationTime = tokens.created_at + tokens.expires_in;
        const currentTime = Math.floor(Date.now() / 1000);
        const secondsLeft = expirationTime - currentTime;
        
        if (secondsLeft <= 0) return 'истек';
        
        const hours = Math.floor(secondsLeft / 3600);
        const minutes = Math.floor((secondsLeft % 3600) / 60);
        
        return `${hours}ч ${minutes}м`;
    }

    /**
     * Обновляем токены используя refresh_token
     */
    async refreshTokens() {
        try {
            this.log(`[REFRESH] 🔄 Начинаем обновление токенов...`);
            
            if (!this.tokens.refresh_token) {
                throw new Error('Отсутствует refresh_token. Требуется повторная авторизация.');
            }

            const response = await axios.post(`${this.config.base_url}/oauth2/access_token`, {
                client_id: this.config.client_id,
                client_secret: this.config.client_secret,
                grant_type: 'refresh_token',
                refresh_token: this.tokens.refresh_token,
                redirect_uri: this.config.redirect_uri
            });

            const newTokens = {
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token,
                expires_in: response.data.expires_in,
                created_at: Math.floor(Date.now() / 1000)
            };

            if (this.saveTokens(newTokens)) {
                this.retryCount = 0; // Сбрасываем счетчик ошибок
                this.log(`[REFRESH] ✅ Токены успешно обновлены. Действуют до ${new Date((newTokens.created_at + newTokens.expires_in) * 1000).toLocaleString()}`);
                return true;
            } else {
                throw new Error('Не удалось сохранить новые токены');
            }

        } catch (error) {
            this.retryCount++;
            this.log(`[REFRESH] ❌ Ошибка обновления токенов (попытка ${this.retryCount}/${this.maxRetries}): ${error.message}`, 'error');
            
            if (error.response) {
                this.log(`[REFRESH] 📋 Детали ошибки: ${JSON.stringify(error.response.data)}`, 'error');
            }
            
            return false;
        }
    }

    /**
     * Получаем первоначальные токены используя auth_code
     */
    async getInitialTokens() {
        try {
            this.log(`[INITIAL] 🔑 Попытка получения первоначальных токенов...`);
            
            if (!this.config.auth_code) {
                const authUrl = this.generateAuthUrl();
                throw new Error(`Отсутствует auth_code. Получите код авторизации по ссылке: ${authUrl}`);
            }

            const response = await axios.post(`${this.config.base_url}/oauth2/access_token`, {
                client_id: this.config.client_id,
                client_secret: this.config.client_secret,
                grant_type: 'authorization_code',
                code: this.config.auth_code,
                redirect_uri: this.config.redirect_uri
            });

            const tokens = {
                access_token: response.data.access_token,
                refresh_token: response.data.refresh_token,
                expires_in: response.data.expires_in,
                created_at: Math.floor(Date.now() / 1000)
            };

            if (this.saveTokens(tokens)) {
                this.log(`[INITIAL] ✅ Первоначальные токены получены успешно`);
                
                // Очищаем auth_code после использования
                this.config.auth_code = '';
                fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2));
                this.log(`[INITIAL] 🧹 auth_code очищен из конфига`);
                
                return true;
            } else {
                throw new Error('Не удалось сохранить токены');
            }

        } catch (error) {
            this.log(`[INITIAL] ❌ Ошибка получения первоначальных токенов: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Генерируем URL для авторизации
     */
    generateAuthUrl() {
        const authUrl = new URL(`${this.config.base_url}/oauth2/authorize`);
        authUrl.searchParams.set('client_id', this.config.client_id);
        authUrl.searchParams.set('state', `token_manager_${Date.now()}`);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('mode', 'post_message');
        authUrl.searchParams.set('redirect_uri', this.config.redirect_uri);
        
        return authUrl.toString();
    }

    /**
     * Основная логика проверки и обновления токенов
     */
    async checkAndRefreshTokens() {
        this.log(`[CHECK] 🔍 Проверяем состояние токенов...`);
        
        // Перезагружаем токены на случай если они обновились извне
        this.tokens = this.loadTokens();
        
        const timeUntilExpiry = this.getTimeUntilExpiry();
        this.log(`[CHECK] ⏰ Время до истечения токена: ${timeUntilExpiry}`);

        if (!this.tokens.access_token) {
            this.log(`[CHECK] ⚠️ Отсутствует access_token`);
            return await this.getInitialTokens();
        }

        if (this.isTokenExpired()) {
            this.log(`[CHECK] ⏰ Токен истекает, требуется обновление`);
            
            if (await this.refreshTokens()) {
                return true;
            } else if (this.retryCount >= this.maxRetries) {
                this.log(`[CHECK] 💥 Достигнуто максимальное количество попыток обновления`);
                const authUrl = this.generateAuthUrl();
                this.log(`[CHECK] 🔗 Требуется повторная авторизация: ${authUrl}`);
                
                // Отправляем уведомление
                this.sendNotification('Требуется повторная авторизация amoCRM', authUrl);
                
                return false;
            }
        } else {
            this.log(`[CHECK] ✅ Токен актуален, обновление не требуется`);
            return true;
        }
    }

    /**
     * Отправка уведомлений (можно расширить для Telegram, email, etc.)
     */
    sendNotification(title, message) {
        this.log(`[NOTIFICATION] 📢 ${title}: ${message}`, 'warning');
        
        // Здесь можно добавить отправку в Telegram, email, Slack, etc.
        // Например, отправка в Telegram:
        // await this.sendTelegramNotification(title, message);
    }

    /**
     * Получение статуса токенов для API
     */
    getTokenStatus() {
        const timeUntilExpiry = this.getTimeUntilExpiry();
        const isExpired = this.isTokenExpired();
        
        return {
            has_access_token: !!this.tokens.access_token,
            has_refresh_token: !!this.tokens.refresh_token,
            is_expired: isExpired,
            time_until_expiry: timeUntilExpiry,
            expires_at: this.tokens.created_at ? new Date((this.tokens.created_at + this.tokens.expires_in) * 1000).toISOString() : null,
            last_refresh: this.tokens.last_refresh || null,
            retry_count: this.retryCount,
            auth_url: isExpired && this.retryCount >= this.maxRetries ? this.generateAuthUrl() : null
        };
    }

    /**
     * Логирование с временными метками
     */
    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        
        console.log(logEntry);
        
        // Сохраняем в файл
        try {
            fs.appendFileSync(LOG_FILE, logEntry + '\n');
        } catch (error) {
            console.error(`Ошибка записи в лог файл: ${error.message}`);
        }
    }

    /**
     * Получение последних логов
     */
    getLogs(lines = 100) {
        try {
            if (!fs.existsSync(LOG_FILE)) {
                return [];
            }
            
            const logs = fs.readFileSync(LOG_FILE, 'utf-8')
                .split('\n')
                .filter(line => line.trim())
                .slice(-lines);
                
            return logs;
        } catch (error) {
            this.log(`[LOGS] ❌ Ошибка чтения логов: ${error.message}`, 'error');
            return [];
        }
    }
}

// Экспорт для использования в других модулях
module.exports = TokenManager;

// Если файл запущен напрямую
if (require.main === module) {
    const manager = new TokenManager();
    
    // Обработка аргументов командной строки
    const args = process.argv.slice(2);
    
    switch (args[0]) {
        case 'check':
            manager.checkAndRefreshTokens()
                .then(success => process.exit(success ? 0 : 1))
                .catch(error => {
                    manager.log(`[MAIN] ❌ Критическая ошибка: ${error.message}`, 'error');
                    process.exit(1);
                });
            break;
            
        case 'status':
            console.log(JSON.stringify(manager.getTokenStatus(), null, 2));
            break;
            
        case 'logs':
            const lines = parseInt(args[1]) || 50;
            manager.getLogs(lines).forEach(log => console.log(log));
            break;
            
        case 'auth-url':
            console.log(manager.generateAuthUrl());
            break;
            
        case 'daemon':
            // Режим демона - проверка каждые 10 минут
            setInterval(async () => {
                try {
                    await manager.checkAndRefreshTokens();
                } catch (error) {
                    manager.log(`[DAEMON] ❌ Ошибка в режиме демона: ${error.message}`, 'error');
                }
            }, 10 * 60 * 1000); // 10 минут
            
            manager.log(`[DAEMON] 🚀 Запущен в режиме демона (проверка каждые 10 минут)`);
            break;
            
        default:
            console.log(`
AmoCRM Token Manager v1.0.0

Использование: node token-manager.js <команда>

Команды:
  check      - Проверить и обновить токены (одноразово)
  status     - Показать текущий статус токенов
  logs [N]   - Показать последние N строк логов (по умолчанию 50)
  auth-url   - Сгенерировать URL для авторизации
  daemon     - Запустить в режиме демона (постоянная работа)

Примеры:
  node token-manager.js check
  node token-manager.js status
  node token-manager.js logs 100
  node token-manager.js daemon
            `);
            break;
    }
}
