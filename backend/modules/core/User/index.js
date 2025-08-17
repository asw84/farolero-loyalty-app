// backend/modules/core/User/index.js
// User Module - управление пользователями

class UserModule {
    constructor(database, logger, amocrmModule = null) {
        this.db = database;
        this.logger = logger;
        this.amocrmModule = amocrmModule;
        
        this.logger.info('UserModule initialized');
    }

    /**
     * Поиск пользователя по Telegram ID
     * @param {string} telegramId
     * @returns {Promise<Object|null>}
     */
    async findByTelegramId(telegramId) {
        try {
            this.logger.debug(`Finding user by telegramId: ${telegramId}`);
            
            const stmt = this.db.prepare('SELECT * FROM users WHERE telegram_user_id = ?');
            const user = stmt.get(telegramId);
            
            if (user) {
                this.logger.debug(`User found: ${user.id}`);
                return this.formatUser(user);
            }
            
            this.logger.debug(`User not found for telegramId: ${telegramId}`);
            return null;
        } catch (error) {
            this.logger.error('Failed to find user by telegramId', { telegramId, error });
            throw error;
        }
    }

    /**
     * Создание нового пользователя
     * @param {Object} userData
     * @returns {Promise<Object>}
     */
    async create(userData) {
        try {
            this.logger.debug('Creating new user', userData);
            
            const {
                telegramId,
                firstName,
                lastName = '',
                username = '',
                referrerId = null
            } = userData;

            // Валидация обязательных полей
            if (!telegramId || !firstName) {
                throw new Error('telegramId and firstName are required');
            }

            // Проверяем что пользователь не существует
            const existingUser = await this.findByTelegramId(telegramId);
            if (existingUser) {
                throw new Error(`User with telegramId ${telegramId} already exists`);
            }

            const stmt = this.db.prepare(`
                INSERT INTO users (telegram_user_id, first_name, last_name, username, points, registered_at)
                VALUES (?, ?, ?, ?, ?, datetime('now'))
            `);

            const initialPoints = 100; // Welcome bonus

            const result = stmt.run(
                telegramId,
                firstName,
                lastName,
                username,
                initialPoints
            );

            const newUser = {
                id: result.lastInsertRowid,
                telegramId,
                firstName,
                lastName,
                username,
                points: initialPoints,
                createdAt: new Date().toISOString()
            };

            this.logger.info('User created successfully', { userId: newUser.id, telegramId });

            // Синхронизация с AmoCRM (опционально)
            if (this.amocrmModule) {
                try {
                    await this.amocrmModule.createContact(newUser);
                    this.logger.debug('User synced to AmoCRM', { userId: newUser.id });
                } catch (amocrmError) {
                    this.logger.warn('Failed to sync user to AmoCRM', { 
                        userId: newUser.id, 
                        error: amocrmError 
                    });
                    // Не падаем, если AmoCRM недоступен
                }
            }

            return this.formatUser(newUser);
        } catch (error) {
            this.logger.error('Failed to create user', { userData, error });
            throw error;
        }
    }

    /**
     * Обновление данных пользователя
     * @param {number} userId
     * @param {Object} updateData
     * @returns {Promise<Object>}
     */
    async update(userId, updateData) {
        try {
            this.logger.debug('Updating user', { userId, updateData });

            const allowedFields = ['first_name', 'last_name', 'username', 'vk_id', 'instagram_id'];
            const updates = {};
            
            // Фильтруем только разрешенные поля
            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key)) {
                    updates[key] = updateData[key];
                }
            });

            if (Object.keys(updates).length === 0) {
                throw new Error('No valid fields to update');
            }

            // Добавляем timestamp обновления
            updates.updated_at = Math.floor(Date.now() / 1000);

            const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
            const values = Object.values(updates);
            values.push(userId);

            const stmt = this.db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`);
            const result = stmt.run(...values);

            if (result.changes === 0) {
                throw new Error(`User with id ${userId} not found`);
            }

            this.logger.info('User updated successfully', { userId, updatedFields: Object.keys(updates) });

            // Получаем обновленного пользователя
            return await this.findById(userId);
        } catch (error) {
            this.logger.error('Failed to update user', { userId, updateData, error });
            throw error;
        }
    }

    /**
     * Поиск пользователя по ID
     * @param {number} userId
     * @returns {Promise<Object|null>}
     */
    async findById(userId) {
        try {
            const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
            const user = stmt.get(userId);
            
            return user ? this.formatUser(user) : null;
        } catch (error) {
            this.logger.error('Failed to find user by id', { userId, error });
            throw error;
        }
    }

    /**
     * Получение статистики пользователей
     * @returns {Promise<Object>}
     */
    async getStats() {
        try {
            const totalStmt = this.db.prepare('SELECT COUNT(*) as total FROM users');
            const activeStmt = this.db.prepare(`
                SELECT COUNT(*) as active 
                FROM users 
                WHERE updated_at > ?
            `);
            
            const weekAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);
            
            const total = totalStmt.get().total;
            const active = activeStmt.get(weekAgo).active;

            return {
                totalUsers: total,
                activeUsers: active,
                inactiveUsers: total - active
            };
        } catch (error) {
            this.logger.error('Failed to get user stats', { error });
            throw error;
        }
    }

    /**
     * Форматирование пользователя для API
     * @param {Object} user
     * @returns {Object}
     */
    formatUser(user) {
        return {
            id: user.id,
            telegramId: user.telegram_user_id,
            firstName: user.first_name,
            lastName: user.last_name || '',
            username: user.username || '',
            points: user.points || 0,
            vkId: user.vk_user_id || null,
            instagramId: user.instagram_user_id || null,
            createdAt: user.registered_at,
            updatedAt: user.updated_at || user.registered_at
        };
    }

    /**
     * Проверка существования пользователя
     * @param {string} telegramId
     * @returns {Promise<boolean>}
     */
    async exists(telegramId) {
        const user = await this.findByTelegramId(telegramId);
        return !!user;
    }
}

module.exports = UserModule;
