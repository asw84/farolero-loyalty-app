// backend/modules/core/Points/index.js
// Points Module - управление системой баллов

class PointsModule {
    constructor(database, logger, userModule) {
        this.db = database;
        this.logger = logger;
        this.userModule = userModule;
        
        this.POINTS_CONFIG = {
            welcome: 100,
            referral_referrer: 100,
            referral_referee: 50,
            vk_subscribe: 20,
            vk_like: 2,
            vk_comment: 5,
            vk_repost: 10,
            instagram_follow: 20,
            instagram_like: 2,
            purchase_cashback: (amount, rate) => Math.floor(amount * rate / 100)
        };

        this.logger.info('PointsModule initialized');
    }

    /**
     * Начисление баллов пользователю
     * @param {number} userId - ID пользователя
     * @param {number} amount - количество баллов
     * @param {string} reason - причина начисления
     * @param {Object} metadata - дополнительные данные
     * @returns {Promise<Object>}
     */
    async addPoints(userId, amount, reason, metadata = {}) {
        try {
            this.logger.debug('Adding points', { userId, amount, reason });

            if (amount <= 0) {
                throw new Error('Amount must be positive');
            }

            // Начинаем транзакцию
            const transaction = this.db.transaction(() => {
                // Обновляем баланс пользователя
                const updateStmt = this.db.prepare(`
                    UPDATE users 
                    SET points = points + ?, updated_at = ?
                    WHERE id = ?
                `);
                
                const result = updateStmt.run(amount, Math.floor(Date.now() / 1000), userId);
                
                if (result.changes === 0) {
                    throw new Error(`User with id ${userId} not found`);
                }

                // Записываем транзакцию
                const transactionStmt = this.db.prepare(`
                    INSERT INTO point_transactions 
                    (user_id, amount, type, reason, metadata, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);

                const transactionId = transactionStmt.run(
                    userId,
                    amount,
                    'credit',
                    reason,
                    JSON.stringify(metadata),
                    Math.floor(Date.now() / 1000)
                ).lastInsertRowid;

                return { transactionId, newBalance: this.getBalance(userId) };
            });

            const result = transaction();
            
            this.logger.info('Points added successfully', { 
                userId, 
                amount, 
                reason, 
                transactionId: result.transactionId 
            });

            return {
                success: true,
                transactionId: result.transactionId,
                amount,
                newBalance: result.newBalance,
                reason
            };

        } catch (error) {
            this.logger.error('Failed to add points', { userId, amount, reason, error });
            throw error;
        }
    }

    /**
     * Списание баллов у пользователя
     * @param {number} userId - ID пользователя
     * @param {number} amount - количество баллов
     * @param {string} reason - причина списания
     * @param {Object} metadata - дополнительные данные
     * @returns {Promise<Object>}
     */
    async deductPoints(userId, amount, reason, metadata = {}) {
        try {
            this.logger.debug('Deducting points', { userId, amount, reason });

            if (amount <= 0) {
                throw new Error('Amount must be positive');
            }

            const currentBalance = await this.getBalance(userId);
            if (currentBalance < amount) {
                throw new Error(`Insufficient balance. Current: ${currentBalance}, Required: ${amount}`);
            }

            // Начинаем транзакцию
            const transaction = this.db.transaction(() => {
                // Обновляем баланс пользователя
                const updateStmt = this.db.prepare(`
                    UPDATE users 
                    SET points = points - ?, updated_at = ?
                    WHERE id = ?
                `);
                
                updateStmt.run(amount, Math.floor(Date.now() / 1000), userId);

                // Записываем транзакцию
                const transactionStmt = this.db.prepare(`
                    INSERT INTO point_transactions 
                    (user_id, amount, type, reason, metadata, created_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);

                const transactionId = transactionStmt.run(
                    userId,
                    amount,
                    'debit',
                    reason,
                    JSON.stringify(metadata),
                    Math.floor(Date.now() / 1000)
                ).lastInsertRowid;

                return { transactionId, newBalance: currentBalance - amount };
            });

            const result = transaction();
            
            this.logger.info('Points deducted successfully', { 
                userId, 
                amount, 
                reason, 
                transactionId: result.transactionId 
            });

            return {
                success: true,
                transactionId: result.transactionId,
                amount,
                newBalance: result.newBalance,
                reason
            };

        } catch (error) {
            this.logger.error('Failed to deduct points', { userId, amount, reason, error });
            throw error;
        }
    }

    /**
     * Получение текущего баланса пользователя
     * @param {number} userId
     * @returns {number}
     */
    getBalance(userId) {
        try {
            const stmt = this.db.prepare('SELECT points FROM users WHERE id = ?');
            const result = stmt.get(userId);
            
            if (!result) {
                throw new Error(`User with id ${userId} not found`);
            }

            return result.points || 0;
        } catch (error) {
            this.logger.error('Failed to get balance', { userId, error });
            throw error;
        }
    }

    /**
     * Получение истории транзакций пользователя
     * @param {number} userId
     * @param {number} limit
     * @param {number} offset
     * @returns {Promise<Array>}
     */
    async getHistory(userId, limit = 50, offset = 0) {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM point_transactions 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            `);

            const transactions = stmt.all(userId, limit, offset);

            return transactions.map(transaction => ({
                id: transaction.id,
                amount: transaction.amount,
                type: transaction.type,
                reason: transaction.reason,
                metadata: transaction.metadata ? JSON.parse(transaction.metadata) : {},
                createdAt: transaction.created_at
            }));

        } catch (error) {
            this.logger.error('Failed to get transaction history', { userId, error });
            throw error;
        }
    }

    /**
     * Начисление баллов по типу активности
     * @param {number} userId
     * @param {string} activityType
     * @param {Object} metadata
     * @returns {Promise<Object>}
     */
    async awardPointsForActivity(userId, activityType, metadata = {}) {
        let amount = 0;
        let reason = activityType;

        switch (activityType) {
            case 'welcome':
                amount = this.POINTS_CONFIG.welcome;
                reason = 'Регистрация в программе лояльности';
                break;
            case 'referral_referrer':
                amount = this.POINTS_CONFIG.referral_referrer;
                reason = 'Приглашение друга';
                break;
            case 'referral_referee':
                amount = this.POINTS_CONFIG.referral_referee;
                reason = 'Регистрация по реферальной ссылке';
                break;
            case 'vk_subscribe':
                amount = this.POINTS_CONFIG.vk_subscribe;
                reason = 'Подписка на группу VK';
                break;
            case 'vk_like':
                amount = this.POINTS_CONFIG.vk_like;
                reason = 'Лайк поста в VK';
                break;
            case 'vk_comment':
                amount = this.POINTS_CONFIG.vk_comment;
                reason = 'Комментарий к посту в VK';
                break;
            case 'vk_repost':
                amount = this.POINTS_CONFIG.vk_repost;
                reason = 'Репост в VK';
                break;
            case 'instagram_follow':
                amount = this.POINTS_CONFIG.instagram_follow;
                reason = 'Подписка в Instagram';
                break;
            case 'instagram_like':
                amount = this.POINTS_CONFIG.instagram_like;
                reason = 'Лайк в Instagram';
                break;
            case 'purchase_cashback':
                const cashbackRate = metadata.cashbackRate || 5;
                const purchaseAmount = metadata.amount || 0;
                amount = this.POINTS_CONFIG.purchase_cashback(purchaseAmount, cashbackRate);
                reason = `Кэшбэк с покупки ${cashbackRate}%`;
                break;
            default:
                throw new Error(`Unknown activity type: ${activityType}`);
        }

        if (amount <= 0) {
            throw new Error(`Invalid amount for activity ${activityType}: ${amount}`);
        }

        return await this.addPoints(userId, amount, reason, { 
            activityType, 
            ...metadata 
        });
    }

    /**
     * Получение статистики по баллам
     * @returns {Promise<Object>}
     */
    async getStats() {
        try {
            const totalPointsStmt = this.db.prepare(`
                SELECT 
                    SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as totalEarned,
                    SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as totalSpent,
                    COUNT(*) as totalTransactions
                FROM point_transactions
            `);

            const userBalancesStmt = this.db.prepare(`
                SELECT 
                    AVG(points) as avgBalance,
                    MAX(points) as maxBalance,
                    MIN(points) as minBalance,
                    COUNT(*) as usersWithPoints
                FROM users 
                WHERE points > 0
            `);

            const stats = totalPointsStmt.get();
            const balances = userBalancesStmt.get();

            return {
                totalEarned: stats.totalEarned || 0,
                totalSpent: stats.totalSpent || 0,
                totalTransactions: stats.totalTransactions || 0,
                avgBalance: Math.round(balances.avgBalance || 0),
                maxBalance: balances.maxBalance || 0,
                minBalance: balances.minBalance || 0,
                usersWithPoints: balances.usersWithPoints || 0
            };

        } catch (error) {
            this.logger.error('Failed to get points stats', { error });
            throw error;
        }
    }

    /**
     * Перевод баллов между пользователями
     * @param {number} fromUserId
     * @param {number} toUserId  
     * @param {number} amount
     * @param {string} reason
     * @returns {Promise<Object>}
     */
    async transferPoints(fromUserId, toUserId, amount, reason = 'Перевод баллов') {
        try {
            this.logger.debug('Transferring points', { fromUserId, toUserId, amount });

            if (fromUserId === toUserId) {
                throw new Error('Cannot transfer points to the same user');
            }

            // Проверяем достаточность баланса
            const fromBalance = await this.getBalance(fromUserId);
            if (fromBalance < amount) {
                throw new Error(`Insufficient balance for transfer`);
            }

            // Выполняем транзакцию
            const transaction = this.db.transaction(() => {
                // Списываем у отправителя
                this.deductPoints(fromUserId, amount, `${reason} (отправлено)`, { 
                    transferTo: toUserId 
                });

                // Начисляем получателю
                this.addPoints(toUserId, amount, `${reason} (получено)`, { 
                    transferFrom: fromUserId 
                });
            });

            transaction();

            this.logger.info('Points transferred successfully', { fromUserId, toUserId, amount });

            return {
                success: true,
                amount,
                fromUserId,
                toUserId,
                reason
            };

        } catch (error) {
            this.logger.error('Failed to transfer points', { fromUserId, toUserId, amount, error });
            throw error;
        }
    }
}

module.exports = PointsModule;
