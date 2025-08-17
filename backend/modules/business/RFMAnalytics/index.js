// backend/modules/business/RFMAnalytics/index.js
// RFM Analytics Module - модернизированный RFM-анализ

class RFMAnalyticsModule {
    constructor(database, logger, userModule, pointsModule) {
        this.db = database;
        this.logger = logger;
        this.userModule = userModule;
        this.pointsModule = pointsModule;
        
        // RFM сегменты и их описания
        this.RFM_SEGMENTS = {
            'Champions': {
                description: 'Лучшие клиенты',
                rfm_range: { R: [4, 5], F: [4, 5], M: [4, 5] },
                strategy: 'Награждайте их. Могут стать ранними последователями новых продуктов.',
                color: '#1e7b85',
                priority: 1
            },
            'Loyal Customers': {
                description: 'Лояльные покупатели',
                rfm_range: { R: [3, 5], F: [3, 5], M: [3, 5] },
                strategy: 'Увеличивайте продажи. Предлагайте членство или программы лояльности.',
                color: '#2d5aa0',
                priority: 2
            },
            'Potential Loyalists': {
                description: 'Потенциально лояльные',
                rfm_range: { R: [3, 5], F: [1, 3], M: [1, 3] },
                strategy: 'Предлагайте программы членства. Рекомендуйте продукты.',
                color: '#5a67d8',
                priority: 3
            },
            'New Customers': {
                description: 'Новые клиенты',
                rfm_range: { R: [4, 5], F: [1, 1], M: [1, 1] },
                strategy: 'Обеспечьте поддержку для создания отношений и увеличения покупок.',
                color: '#48bb78',
                priority: 4
            },
            'Promising': {
                description: 'Перспективные',
                rfm_range: { R: [3, 4], F: [1, 1], M: [1, 1] },
                strategy: 'Создавайте узнаваемость бренда. Предлагайте бесплатные пробные версии.',
                color: '#38b2ac',
                priority: 5
            },
            'Need Attention': {
                description: 'Требуют внимания',
                rfm_range: { R: [2, 3], F: [2, 3], M: [2, 3] },
                strategy: 'Ограниченные по времени предложения. Рекомендуйте на основе предыдущих покупок.',
                color: '#ed8936',
                priority: 6
            },
            'About to Sleep': {
                description: 'Засыпают',
                rfm_range: { R: [2, 3], F: [1, 2], M: [1, 2] },
                strategy: 'Поделитесь ценными ресурсами. Рекомендуйте популярные продукты.',
                color: '#f56565',
                priority: 7
            },
            'At Risk': {
                description: 'В группе риска',
                rfm_range: { R: [1, 2], F: [2, 5], M: [2, 5] },
                strategy: 'Отправляйте персонализированные emails для восстановления связи.',
                color: '#e53e3e',
                priority: 8
            },
            'Cannot Lose Them': {
                description: 'Нельзя потерять',
                rfm_range: { R: [1, 2], F: [4, 5], M: [4, 5] },
                strategy: 'Выигрывайте их обратно с возобновлением кампаний, игнорируйте скидки.',
                color: '#9f7aea',
                priority: 9
            },
            'Hibernating': {
                description: 'Спящие',
                rfm_range: { R: [1, 2], F: [1, 2], M: [1, 2] },
                strategy: 'Предлагайте другие категории продуктов и специальные скидки.',
                color: '#a0aec0',
                priority: 10
            }
        };

        this.logger.info('RFMAnalyticsModule initialized');
    }

    /**
     * Расчет RFM для всех пользователей
     * @returns {Promise<Object>}
     */
    async calculateRFMForAllUsers() {
        try {
            this.logger.info('Starting RFM calculation for all users');

                            // Получаем всех пользователей с покупками
        const stmt = this.db.prepare(`
            SELECT DISTINCT u.telegram_user_id as telegram_id
            FROM users u
            INNER JOIN purchases p ON u.telegram_user_id = p.user_telegram_id
        `);
        
        const users = stmt.all();
        
        if (!users || !Array.isArray(users)) {
            this.logger.warn('No users found or invalid result format');
            return {
                processed: 0,
                errors: 0,
                total: 0,
                success: true
            };
        }
            let processedCount = 0;
            let errors = 0;

            for (const user of users) {
                try {
                    await this.calculateUserRFM(user.telegram_id);
                    processedCount++;
                } catch (error) {
                    this.logger.error('Failed to calculate RFM for user', { 
                        telegramId: user.telegram_id, 
                        error 
                    });
                    errors++;
                }
            }

            this.logger.info('RFM calculation completed', { 
                processed: processedCount, 
                errors, 
                total: users.length 
            });

            return {
                processed: processedCount,
                errors,
                total: users.length,
                success: true
            };

        } catch (error) {
            this.logger.error('Failed to calculate RFM for all users', { error });
            throw error;
        }
    }

    /**
     * Расчет RFM для конкретного пользователя
     * @param {string} telegramId
     * @returns {Promise<Object>}
     */
    async calculateUserRFM(telegramId) {
        try {
            const user = await this.userModule.findByTelegramId(telegramId);
            if (!user) {
                throw new Error(`User ${telegramId} not found`);
            }

            // Получаем транзакции покупок
            const purchaseStmt = this.db.prepare(`
                SELECT amount, purchase_date as created_at, order_id as metadata
                FROM purchases
                WHERE user_telegram_id = ?
                ORDER BY purchase_date DESC
            `);

            const purchases = purchaseStmt.all(telegramId);

            if (purchases.length === 0) {
                this.logger.debug('No purchases found for user', { telegramId });
                return null;
            }

            // Рассчитываем RFM метрики
            const metrics = this.calculateRFMMetrics(purchases);
            
            // Получаем квантили для скоринга
            const quantiles = await this.getQuantiles();
            
            // Конвертируем в скоры 1-5
            const recencyScore = this.getRecencyScore(metrics.daysSinceLastPurchase, quantiles.recency);
            const frequencyScore = this.getScore(metrics.frequency, quantiles.frequency);
            const monetaryScore = this.getScore(metrics.monetary, quantiles.monetary);

            // Определяем сегмент
            const segmentName = this.determineSegment(recencyScore, frequencyScore, monetaryScore);

            // Сохраняем в БД
            const saveStmt = this.db.prepare(`
                INSERT OR REPLACE INTO rfm_segments 
                (user_telegram_id, recency_score, frequency_score, monetary_score, 
                 segment_name, calculated_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `);

            saveStmt.run(
                telegramId,
                recencyScore,
                frequencyScore,
                monetaryScore,
                segmentName
            );

            const result = {
                userId: user.id,
                telegramId,
                recencyScore,
                frequencyScore,
                monetaryScore,
                segmentName,
                segment: this.RFM_SEGMENTS[segmentName],
                metrics
            };

            this.logger.debug('RFM calculated for user', {
                telegramId,
                segment: segmentName,
                scores: `R${recencyScore}F${frequencyScore}M${monetaryScore}`
            });

            return result;

        } catch (error) {
            this.logger.error('Failed to calculate user RFM', { telegramId, error });
            throw error;
        }
    }

    /**
     * Расчет RFM метрик из транзакций
     * @param {Array} purchases
     * @returns {Object}
     */
    calculateRFMMetrics(purchases) {
        // Recency: дни с последней покупки
        const lastPurchaseDate = new Date(purchases[0].created_at);
        const today = new Date();
        const daysSinceLastPurchase = Math.floor((today - lastPurchaseDate) / (1000 * 60 * 60 * 24));

        // Frequency: количество покупок
        const frequency = purchases.length;

        // Monetary: общая потраченная сумма
        const monetary = purchases.reduce((sum, purchase) => sum + parseFloat(purchase.amount), 0);

        return {
            daysSinceLastPurchase,
            frequency,
            monetary
        };
    }

    /**
     * Получение квантилей для нормализации
     * @returns {Promise<Object>}
     */
    async getQuantiles() {
        // Получаем статистику из таблицы purchases для расчета квантилей
        const stmt = this.db.prepare(`
            SELECT 
                user_telegram_id,
                COUNT(*) as frequency_count,
                SUM(amount) as monetary_value,
                MIN(julianday('now') - julianday(purchase_date)) as recency_days
            FROM purchases
            WHERE purchase_date > date('now', '-30 days')
            GROUP BY user_telegram_id
            HAVING COUNT(*) > 0
        `);

        const data = stmt.all();

        if (data.length < 10) {
            // Если данных мало, используем стандартные квантили
            return {
                recency: [7, 30, 90, 365], // дни
                frequency: [1, 2, 5, 10],  // количество
                monetary: [100, 500, 1500, 5000] // рубли
            };
        }

        // Вычисляем квантили из реальных данных
        const recency = data.map(d => d.recency_days).sort((a, b) => a - b);
        const frequency = data.map(d => d.frequency_count).sort((a, b) => a - b);
        const monetary = data.map(d => d.monetary_value).sort((a, b) => a - b);

        return {
            recency: this.calculateQuantiles(recency),
            frequency: this.calculateQuantiles(frequency),
            monetary: this.calculateQuantiles(monetary)
        };
    }

    /**
     * Вычисление квантилей
     * @param {Array} sortedArray
     * @returns {Array}
     */
    calculateQuantiles(sortedArray) {
        const q1 = sortedArray[Math.floor(sortedArray.length * 0.25)];
        const q2 = sortedArray[Math.floor(sortedArray.length * 0.5)];
        const q3 = sortedArray[Math.floor(sortedArray.length * 0.75)];
        const q4 = sortedArray[Math.floor(sortedArray.length * 0.9)];
        
        return [q1, q2, q3, q4];
    }

    /**
     * Конвертация значения в скор 1-5
     * @param {number} value
     * @param {Array} quantiles
     * @returns {number}
     */
    getScore(value, quantiles) {
        if (value >= quantiles[3]) return 5;
        if (value >= quantiles[2]) return 4;
        if (value >= quantiles[1]) return 3;
        if (value >= quantiles[0]) return 2;
        return 1;
    }

    /**
     * Скор для Recency (обратная логика - меньше дней = выше скор)
     * @param {number} days
     * @param {Array} quantiles
     * @returns {number}
     */
    getRecencyScore(days, quantiles) {
        if (days <= quantiles[0]) return 5;
        if (days <= quantiles[1]) return 4;
        if (days <= quantiles[2]) return 3;
        if (days <= quantiles[3]) return 2;
        return 1;
    }

    /**
     * Определение сегмента по RFM скорам
     * @param {number} R
     * @param {number} F  
     * @param {number} M
     * @returns {string}
     */
    determineSegment(R, F, M) {
        if (R >= 4 && F >= 4 && M >= 4) return 'Champions';
        if (R >= 3 && F >= 3 && M >= 3) return 'Loyal Customers';
        if (R >= 3 && F <= 3 && M <= 3) return 'Potential Loyalists';
        if (R >= 4 && F === 1 && M === 1) return 'New Customers';
        if (R >= 3 && F === 1 && M === 1) return 'Promising';
        if (R >= 2 && R <= 3 && F >= 2 && F <= 3 && M >= 2 && M <= 3) return 'Need Attention';
        if (R >= 2 && R <= 3 && F <= 2 && M <= 2) return 'About to Sleep';
        if (R <= 2 && F >= 2 && M >= 2) return 'At Risk';
        if (R <= 2 && F >= 4 && M >= 4) return 'Cannot Lose Them';
        return 'Hibernating';
    }

    /**
     * Получение RFM данных пользователя
     * @param {string} telegramId
     * @returns {Promise<Object>}
     */
    async getUserRFM(telegramId) {
        try {
            const stmt = this.db.prepare(`
                SELECT * FROM rfm_segments 
                WHERE user_telegram_id = ? 
                ORDER BY calculated_at DESC 
                LIMIT 1
            `);

            const rfmData = stmt.get(telegramId);
            
            if (!rfmData) {
                // Если данных нет, рассчитываем
                return await this.calculateUserRFM(telegramId);
            }

            // Проверяем актуальность (обновляем раз в неделю)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const calculatedAt = new Date(rfmData.calculated_at);
            
            if (calculatedAt < weekAgo) {
                return await this.calculateUserRFM(telegramId);
            }

            // Получаем реальные метрики из таблицы покупок
            const purchaseStmt = this.db.prepare(`
                SELECT amount, purchase_date as created_at
                FROM purchases
                WHERE user_telegram_id = ?
                ORDER BY purchase_date DESC
            `);
            const purchases = purchaseStmt.all(telegramId);
            const metrics = purchases.length > 0 ? this.calculateRFMMetrics(purchases) : null;

            return {
                userId: rfmData.user_telegram_id,
                telegramId: rfmData.user_telegram_id,
                recencyScore: rfmData.recency_score,
                frequencyScore: rfmData.frequency_score,
                monetaryScore: rfmData.monetary_score,
                segmentName: rfmData.segment_name,
                segment: this.RFM_SEGMENTS[rfmData.segment_name],
                metrics: metrics,
                calculatedAt: rfmData.calculated_at
            };

        } catch (error) {
            this.logger.error('Failed to get user RFM', { telegramId, error });
            throw error;
        }
    }

    /**
     * Получение сводки по сегментам
     * @returns {Promise<Object>}
     */
    async getSegmentsSummary() {
        try {
            const stmt = this.db.prepare(`
                SELECT 
                    r.segment_name,
                    COUNT(*) as count,
                    AVG(p_stats.monetary_value) as avg_monetary,
                    AVG(p_stats.frequency_count) as avg_frequency,
                    AVG(p_stats.recency_days) as avg_recency
                FROM rfm_segments r
                LEFT JOIN (
                    SELECT 
                        user_telegram_id,
                        SUM(amount) as monetary_value,
                        COUNT(*) as frequency_count,
                        MIN(julianday('now') - julianday(purchase_date)) as recency_days
                    FROM purchases
                    GROUP BY user_telegram_id
                ) p_stats ON r.user_telegram_id = p_stats.user_telegram_id
                WHERE r.calculated_at > date('now', '-30 days')
                GROUP BY r.segment_name
                ORDER BY COUNT(*) DESC
            `);

            const segments = stmt.all();
            
            if (!segments || !Array.isArray(segments)) {
                this.logger.warn('No segments found or invalid result format');
                return {
                    segments: [],
                    totalUsers: 0,
                    lastUpdated: new Date().toISOString()
                };
            }

            const summary = segments.map(segment => ({
                name: segment.segment_name,
                count: segment.count,
                percentage: 0, // будет рассчитан ниже
                averages: {
                    monetary: Math.round(segment.avg_monetary || 0),
                    frequency: Math.round((segment.avg_frequency || 0) * 10) / 10,
                    recency: Math.round(segment.avg_recency || 0)
                },
                segment: this.RFM_SEGMENTS[segment.segment_name]
            }));

            const totalUsers = summary.reduce((sum, s) => sum + s.count, 0);
            if (totalUsers > 0) {
                summary.forEach(s => {
                    s.percentage = Math.round((s.count / totalUsers) * 100);
                });
            }

            return {
                segments: summary,
                totalUsers,
                lastUpdated: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error('Failed to get segments summary', { error });
            throw error;
        }
    }

    /**
     * Получение пользователей сегмента
     * @param {string} segmentName
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    async getSegmentUsers(segmentName, limit = 50) {
        try {
            const stmt = this.db.prepare(`
                SELECT 
                    r.user_telegram_id as telegram_id,
                    u.telegram_user_id,
                    u.points,
                    r.recency_score,
                    r.frequency_score,
                    r.monetary_score,
                    p_stats.monetary_value,
                    p_stats.frequency_count,
                    p_stats.recency_days
                FROM rfm_segments r
                JOIN users u ON r.user_telegram_id = u.telegram_user_id
                LEFT JOIN (
                    SELECT 
                        user_telegram_id,
                        SUM(amount) as monetary_value,
                        COUNT(*) as frequency_count,
                        MIN(julianday('now') - julianday(purchase_date)) as recency_days
                    FROM purchases
                    GROUP BY user_telegram_id
                ) p_stats ON r.user_telegram_id = p_stats.user_telegram_id
                WHERE r.segment_name = ?
                ORDER BY p_stats.monetary_value DESC
                LIMIT ?
            `);

            const users = stmt.all(segmentName, limit);
            
            if (!users || !Array.isArray(users)) {
                this.logger.warn('No users found for segment or invalid result format', { segmentName });
                return [];
            }

            return users.map(user => ({
                telegramId: user.telegram_id,
                telegramUserId: user.telegram_user_id,
                points: user.points || 0,
                rfmScores: {
                    recency: user.recency_score,
                    frequency: user.frequency_score,
                    monetary: user.monetary_score
                },
                metrics: {
                    monetaryValue: user.monetary_value || 0,
                    frequencyCount: user.frequency_count || 0,
                    recencyDays: user.recency_days || 0
                }
            }));

        } catch (error) {
            this.logger.error('Failed to get segment users', { segmentName, error });
            throw error;
        }
    }

    /**
     * Получение всех сегментов с описанием
     * @returns {Object}
     */
    getAllSegments() {
        return this.RFM_SEGMENTS;
    }
}

module.exports = RFMAnalyticsModule;
