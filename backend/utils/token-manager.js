// backend/utils/token-manager.js
// TokenManager с тройной защитой токенов AmoCRM
// Архитектурный принцип: файл + environment + база данных

const fs = require('fs');
const path = require('path');
const { getDbConnection } = require('../database');

class TokenManager {
    constructor(serviceName = 'amocrm') {
        this.serviceName = serviceName;
        this.TOKENS_PATH = process.env.TOKENS_PATH 
            ? path.join(process.env.TOKENS_PATH, 'tokens.json')
            : path.join(__dirname, '..', 'tokens.json');
        
        console.log(`[TokenManager] 🔧 Initialized for ${serviceName}, path: ${this.TOKENS_PATH}`);
        this.initializeDatabase();
    }

    /**
     * Инициализация таблицы токенов в БД
     */
    initializeDatabase() {
        try {
            // Создаем таблицу для безопасного хранения токенов
            const db = getDbConnection();
            db.run(`
                CREATE TABLE IF NOT EXISTS tokens (
                    service VARCHAR(50) PRIMARY KEY,
                    access_token TEXT,
                    refresh_token TEXT,
                    expires_at INTEGER,
                    created_at INTEGER DEFAULT (unixepoch()),
                    updated_at INTEGER DEFAULT (unixepoch())
                )
            `);
            console.log('[TokenManager] ✅ Database table initialized');
        } catch (error) {
            console.error('[TokenManager] ❌ Failed to initialize database:', error);
        }
    }

    /**
     * УРОВЕНЬ 1: Загрузка из файла (primary)
     */
    loadFromFile() {
        try {
            if (fs.existsSync(this.TOKENS_PATH)) {
                const content = fs.readFileSync(this.TOKENS_PATH, 'utf-8');
                if (content) {
                    const tokens = JSON.parse(content);
                    console.log('[TokenManager] 📁 Tokens loaded from file');
                    return this.validateTokens(tokens);
                }
            }
        } catch (error) {
            console.error('[TokenManager] ❌ Failed to load from file:', error);
        }
        return null;
    }

    /**
     * УРОВЕНЬ 2: Загрузка из переменных окружения (backup)
     */
    loadFromEnvironment() {
        try {
            const envTokens = {
                access_token: process.env.AMOCRM_ACCESS_TOKEN || '',
                refresh_token: process.env.AMOCRM_REFRESH_TOKEN || '',
                created_at: parseInt(process.env.AMOCRM_CREATED_AT) || 0,
                expires_in: parseInt(process.env.AMOCRM_EXPIRES_IN) || 86400
            };

            if (envTokens.refresh_token) {
                console.log('[TokenManager] 🌍 Tokens loaded from environment');
                return this.validateTokens(envTokens);
            }
        } catch (error) {
            console.error('[TokenManager] ❌ Failed to load from environment:', error);
        }
        return null;
    }

    /**
     * УРОВЕНЬ 3: Загрузка из базы данных (persistent)
     */
    loadFromDatabase() {
        try {
            const db = getDbConnection();
            return new Promise((resolve, reject) => {
                db.get('SELECT * FROM tokens WHERE service = ?', [this.serviceName], (err, row) => {
                    if (err) {
                        console.error('[TokenManager] ❌ Database error:', err);
                        resolve(null);
                        return;
                    }
                    
                    if (row) {
                        const tokens = {
                            access_token: row.access_token,
                            refresh_token: row.refresh_token,
                            created_at: row.created_at,
                            expires_in: (row.expires_at - row.created_at)
                        };
                        console.log('[TokenManager] 🗄️ Tokens loaded from database');
                        resolve(this.validateTokens(tokens));
                    } else {
                        resolve(null);
                    }
                });
            });
        } catch (error) {
            console.error('[TokenManager] ❌ Failed to load from database:', error);
            return Promise.resolve(null);
        }
    }

    /**
     * Валидация токенов
     */
    validateTokens(tokens) {
        if (!tokens || !tokens.refresh_token) {
            return null;
        }

        // Проверяем что токены не слишком старые (максимум 90 дней)
        const maxAge = 90 * 24 * 60 * 60; // 90 дней в секундах
        const age = Math.floor(Date.now() / 1000) - tokens.created_at;
        
        if (age > maxAge) {
            console.log('[TokenManager] ⚠️ Tokens too old, need re-authorization');
            return null;
        }

        return tokens;
    }

    /**
     * Умная загрузка с fallback по уровням
     */
    async getTokens() {
        console.log('[TokenManager] 🔍 Loading tokens with triple protection...');
        
        // Уровень 1: Файл (быстрее всего)
        let tokens = this.loadFromFile();
        if (tokens) return tokens;

        // Уровень 2: Environment (backup)
        tokens = this.loadFromEnvironment();
        if (tokens) {
            // Восстанавливаем в файл для будущих запросов
            this.saveToFile(tokens);
            return tokens;
        }

        // Уровень 3: База данных (persistent)
        tokens = await this.loadFromDatabase();
        if (tokens) {
            // Восстанавливаем в файл и environment
            this.saveToFile(tokens);
            this.saveToEnvironment(tokens);
            return tokens;
        }

        console.log('[TokenManager] ❌ No valid tokens found in any storage');
        return { access_token: '', refresh_token: '', created_at: 0, expires_in: 0 };
    }

    /**
     * СОХРАНЕНИЕ: Тройная защита
     */
    async saveTokens(tokens) {
        if (!tokens.created_at) {
            tokens.created_at = Math.floor(Date.now() / 1000);
        }

        console.log('[TokenManager] 💾 Saving tokens with triple protection...');
        
        // Уровень 1: Сохранить в файл (primary)
        this.saveToFile(tokens);
        
        // Уровень 2: Дублировать в environment (backup)
        this.saveToEnvironment(tokens);
        
        // Уровень 3: Persistent в БД (long-term)
        this.saveToDatabase(tokens);
        
        console.log('[TokenManager] ✅ Tokens saved to all three storages');
        return tokens;
    }

    /**
     * Сохранение в файл
     */
    saveToFile(tokens) {
        try {
            // Убеждаемся, что директория существует
            const tokensDir = path.dirname(this.TOKENS_PATH);
            if (!fs.existsSync(tokensDir)) {
                fs.mkdirSync(tokensDir, { recursive: true });
            }
            
            fs.writeFileSync(this.TOKENS_PATH, JSON.stringify(tokens, null, 2));
            console.log(`[TokenManager] 📁 Saved to file: ${this.TOKENS_PATH}`);
        } catch (error) {
            console.error('[TokenManager] ❌ Failed to save to file:', error);
        }
    }

    /**
     * Сохранение в environment (для backup)
     */
    saveToEnvironment(tokens) {
        try {
            process.env.AMOCRM_ACCESS_TOKEN = tokens.access_token;
            process.env.AMOCRM_REFRESH_TOKEN = tokens.refresh_token;
            process.env.AMOCRM_CREATED_AT = tokens.created_at.toString();
            process.env.AMOCRM_EXPIRES_IN = tokens.expires_in.toString();
            
            console.log('[TokenManager] 🌍 Saved to environment variables');
            
            // В production советуем обновить секреты
            if (process.env.NODE_ENV === 'production') {
                console.log('[TokenManager] 🔄 Consider updating secrets in production environment');
            }
        } catch (error) {
            console.error('[TokenManager] ❌ Failed to save to environment:', error);
        }
    }

    /**
     * Сохранение в базу данных
     */
    saveToDatabase(tokens) {
        try {
            const expiresAt = tokens.created_at + tokens.expires_in;
            const now = Math.floor(Date.now() / 1000);
            
            const db = getDbConnection();
            db.run(`
                INSERT OR REPLACE INTO tokens 
                (service, access_token, refresh_token, expires_at, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                this.serviceName,
                tokens.access_token,
                tokens.refresh_token,
                expiresAt,
                tokens.created_at,
                now
            ]);
            
            console.log('[TokenManager] 🗄️ Saved to database');
        } catch (error) {
            console.error('[TokenManager] ❌ Failed to save to database:', error);
        }
    }

    /**
     * Проверка истечения токена
     */
    isTokenExpired(tokens) {
        if (!tokens || !tokens.access_token) return true;
        
        const now = Math.floor(Date.now() / 1000);
        const expirationTime = tokens.created_at + tokens.expires_in;
        const buffer = 300; // 5 минут буфер
        
        return now >= (expirationTime - buffer);
    }

    /**
     * Очистка всех токенов (при деавторизации)
     */
    clearAllTokens() {
        console.log('[TokenManager] 🗑️ Clearing all tokens...');
        
        // Удаляем файл
        try {
            if (fs.existsSync(this.TOKENS_PATH)) {
                fs.unlinkSync(this.TOKENS_PATH);
            }
        } catch (error) {
            console.error('[TokenManager] ❌ Failed to clear file:', error);
        }
        
        // Очищаем environment
        delete process.env.AMOCRM_ACCESS_TOKEN;
        delete process.env.AMOCRM_REFRESH_TOKEN;
        delete process.env.AMOCRM_CREATED_AT;
        delete process.env.AMOCRM_EXPIRES_IN;
        
        // Удаляем из БД
        try {
            const db = getDbConnection();
            db.run('DELETE FROM tokens WHERE service = ?', [this.serviceName]);
        } catch (error) {
            console.error('[TokenManager] ❌ Failed to clear database:', error);
        }
        
        console.log('[TokenManager] ✅ All tokens cleared from all storages');
    }

    /**
     * Здоровье токенов - диагностика
     */
    async getHealthStatus() {
        const file = this.loadFromFile();
        const env = this.loadFromEnvironment();
        const db = await this.loadFromDatabase();
        
        return {
            file: file ? 'healthy' : 'missing',
            environment: env ? 'healthy' : 'missing',
            database: db ? 'healthy' : 'missing',
            overall: (file || env || db) ? 'healthy' : 'unhealthy'
        };
    }
}

module.exports = TokenManager;
