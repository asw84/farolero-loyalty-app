// backend/services/purchase-history.service.js
// Сервис для работы с детальной историей покупок с кэшбэком

const { findUserByTelegramId, dbAll } = require('../database');
const statusService = require('./status.service');

/**
 * Получить детальную историю покупок пользователя
 * @param {string} telegramId - Telegram ID пользователя
 * @param {Object} options - Опции фильтрации и сортировки
 * @returns {Promise<Object>} - Детальная история покупок
 */
async function getDetailedPurchaseHistory(telegramId, options = {}) {
    try {
        const user = await findUserByTelegramId(telegramId);
        if (!user) {
            throw new Error('Пользователь не найден');
        }

        const {
            limit = 50,
            offset = 0,
            sortBy = 'purchase_date',
            sortOrder = 'DESC',
            dateFrom = null,
            dateTo = null,
            source = null,
            withCashback = null
        } = options;

        // Строим SQL запрос с учетом фильтров
        let query = `
            SELECT 
                p.*,
                CASE 
                    WHEN p.cashback_used > 0 THEN 'cashback'
                    ELSE 'regular'
                END as transaction_type,
                (p.total_price - p.final_price) as total_discount,
                CASE 
                    WHEN p.event_name IS NOT NULL THEN p.event_name
                    ELSE 'Покупка билета'
                END as display_name
            FROM purchases p 
            WHERE p.user_telegram_id = ?
        `;
        
        const params = [telegramId];

        // Добавляем фильтры
        if (dateFrom) {
            query += ' AND p.purchase_date >= ?';
            params.push(dateFrom);
        }
        
        if (dateTo) {
            query += ' AND p.purchase_date <= ?';
            params.push(dateTo);
        }
        
        if (source) {
            query += ' AND p.source = ?';
            params.push(source);
        }
        
        if (withCashback === true) {
            query += ' AND p.cashback_used > 0';
        } else if (withCashback === false) {
            query += ' AND (p.cashback_used IS NULL OR p.cashback_used = 0)';
        }

        // Добавляем сортировку и лимиты
        query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const purchases = await dbAll(query, params);

        // Получаем статистику
        const statsQuery = `
            SELECT 
                COUNT(*) as total_purchases,
                COALESCE(SUM(p.total_price), 0) as total_spent,
                COALESCE(SUM(p.cashback_used), 0) as total_cashback_used,
                COALESCE(SUM(p.total_price - p.final_price), 0) as total_savings,
                COUNT(CASE WHEN p.cashback_used > 0 THEN 1 END) as cashback_purchases,
                COALESCE(AVG(p.total_price), 0) as avg_purchase_amount
            FROM purchases p 
            WHERE p.user_telegram_id = ?
        `;
        
        const stats = await dbAll(statsQuery, [telegramId]);
        const purchaseStats = stats[0] || {};

        return {
            user: {
                telegramId: user.telegram_user_id,
                currentPoints: user.points,
                status: user.status
            },
            purchases: purchases.map(purchase => ({
                id: purchase.id,
                eventId: purchase.event_id,
                eventName: purchase.display_name,
                originalPrice: purchase.total_price || purchase.amount, // Совместимость со старыми записями
                cashbackUsed: purchase.cashback_used || 0,
                finalPrice: purchase.final_price || purchase.amount,
                totalDiscount: (purchase.total_price || purchase.amount) - (purchase.final_price || purchase.amount),
                savings: purchase.cashback_used || 0,
                purchaseDate: purchase.purchase_date,
                source: purchase.source,
                transactionType: purchase.cashback_used > 0 ? 'cashback' : 'regular',
                orderId: purchase.order_id
            })),
            pagination: {
                limit: limit,
                offset: offset,
                total: purchaseStats.total_purchases || 0,
                hasMore: (offset + limit) < (purchaseStats.total_purchases || 0)
            },
            statistics: {
                totalPurchases: purchaseStats.total_purchases || 0,
                totalSpent: purchaseStats.total_spent || 0,
                totalCashbackUsed: purchaseStats.total_cashback_used || 0,
                totalSavings: purchaseStats.total_savings || 0,
                cashbackPurchases: purchaseStats.cashback_purchases || 0,
                regularPurchases: (purchaseStats.total_purchases || 0) - (purchaseStats.cashback_purchases || 0),
                averagePurchase: Math.round(purchaseStats.avg_purchase_amount || 0),
                cashbackPercentage: purchaseStats.total_purchases > 0 ? 
                    Math.round((purchaseStats.cashback_purchases / purchaseStats.total_purchases) * 100) : 0
            }
        };

    } catch (error) {
        console.error('❌ [PurchaseHistory] Ошибка получения истории:', error);
        throw error;
    }
}

/**
 * Получить сводку покупок по периодам
 * @param {string} telegramId - Telegram ID пользователя
 * @param {string} period - Период группировки ('month', 'week', 'day')
 * @returns {Promise<Array>} - Сводка по периодам
 */
async function getPurchaseSummaryByPeriod(telegramId, period = 'month') {
    try {
        const user = await findUserByTelegramId(telegramId);
        if (!user) {
            throw new Error('Пользователь не найден');
        }

        let dateFormat;
        switch (period) {
            case 'day':
                dateFormat = '%Y-%m-%d';
                break;
            case 'week':
                dateFormat = '%Y-%W';
                break;
            case 'month':
            default:
                dateFormat = '%Y-%m';
                break;
        }

        const query = `
            SELECT 
                strftime('${dateFormat}', p.purchase_date) as period,
                COUNT(*) as purchases_count,
                COALESCE(SUM(p.total_price), SUM(p.amount)) as total_amount,
                COALESCE(SUM(p.cashback_used), 0) as cashback_used,
                COUNT(CASE WHEN COALESCE(p.cashback_used, 0) > 0 THEN 1 END) as cashback_purchases,
                COALESCE(AVG(p.total_price), AVG(p.amount)) as avg_amount
            FROM purchases p 
            WHERE p.user_telegram_id = ?
            GROUP BY strftime('${dateFormat}', p.purchase_date)
            ORDER BY period DESC
            LIMIT 12
        `;

        const summary = await dbAll(query, [telegramId]);

        return summary.map(item => ({
            period: item.period,
            purchasesCount: item.purchases_count,
            totalAmount: item.total_amount,
            cashbackUsed: item.cashback_used,
            cashbackPurchases: item.cashback_purchases,
            regularPurchases: item.purchases_count - item.cashback_purchases,
            averageAmount: Math.round(item.avg_amount),
            savingsPercentage: item.total_amount > 0 ? 
                Math.round((item.cashback_used / item.total_amount) * 100) : 0
        }));

    } catch (error) {
        console.error('❌ [PurchaseHistory] Ошибка получения сводки:', error);
        throw error;
    }
}

/**
 * Получить топ категорий покупок
 * @param {string} telegramId - Telegram ID пользователя
 * @param {number} limit - Количество категорий
 * @returns {Promise<Array>} - Топ категорий
 */
async function getTopPurchaseCategories(telegramId, limit = 10) {
    try {
        const user = await findUserByTelegramId(telegramId);
        if (!user) {
            throw new Error('Пользователь не найден');
        }

        const query = `
            SELECT 
                p.source,
                COUNT(*) as purchases_count,
                COALESCE(SUM(p.total_price), SUM(p.amount)) as total_amount,
                COALESCE(SUM(p.cashback_used), 0) as cashback_used,
                COALESCE(AVG(p.total_price), AVG(p.amount)) as avg_amount
            FROM purchases p 
            WHERE p.user_telegram_id = ?
            GROUP BY p.source
            ORDER BY total_amount DESC
            LIMIT ?
        `;

        const categories = await dbAll(query, [telegramId, limit]);

        return categories.map(category => ({
            source: category.source,
            displayName: getSourceDisplayName(category.source),
            purchasesCount: category.purchases_count,
            totalAmount: category.total_amount,
            cashbackUsed: category.cashback_used,
            averageAmount: Math.round(category.avg_amount),
            savingsPercentage: category.total_amount > 0 ? 
                Math.round((category.cashback_used / category.total_amount) * 100) : 0
        }));

    } catch (error) {
        console.error('❌ [PurchaseHistory] Ошибка получения категорий:', error);
        throw error;
    }
}

/**
 * Получить рекомендации по оптимизации кэшбэка
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<Object>} - Рекомендации
 */
async function getCashbackRecommendations(telegramId) {
    try {
        const user = await findUserByTelegramId(telegramId);
        if (!user) {
            throw new Error('Пользователь не найден');
        }

        const userStatus = await statusService.getUserStatus(telegramId);
        const history = await getDetailedPurchaseHistory(telegramId, { limit: 100 });
        
        const recommendations = [];

        // Рекомендация по повышению статуса
        if (userStatus.pointsToNextLevel > 0) {
            recommendations.push({
                type: 'status_upgrade',
                title: 'Повысьте статус для большего кэшбэка',
                description: `До статуса "${getNextStatusName(userStatus.status)}" осталось ${userStatus.pointsToNextLevel} баллов`,
                benefit: `+${getNextStatusCashback(userStatus.status) - userStatus.cashbackRate}% кэшбэк`,
                priority: 'high'
            });
        }

        // Рекомендация по использованию кэшбэка
        const cashbackPercentage = history.statistics.cashbackPercentage;
        if (cashbackPercentage < 30 && user.points > 100) {
            recommendations.push({
                type: 'use_cashback',
                title: 'Используйте накопленные баллы',
                description: `У вас ${user.points} баллов. Используйте их для экономии на покупках`,
                benefit: `Экономия до ${Math.floor(user.points * 0.8)} руб.`,
                priority: 'medium'
            });
        }

        // Рекомендация по регулярности покупок
        if (history.statistics.totalPurchases > 0) {
            const avgMonthlyPurchases = history.statistics.totalPurchases / 3; // За последние 3 месяца
            if (avgMonthlyPurchases < 2) {
                recommendations.push({
                    type: 'increase_activity',
                    title: 'Увеличьте активность покупок',
                    description: 'Больше покупок = больше баллов и кэшбэка',
                    benefit: 'Быстрое повышение статуса',
                    priority: 'low'
                });
            }
        }

        return {
            userStatus: userStatus,
            recommendations: recommendations,
            potentialSavings: {
                currentCashbackRate: userStatus.cashbackRate,
                potentialCashbackRate: getNextStatusCashback(userStatus.status),
                monthlyEstimate: Math.round(history.statistics.averagePurchase * 2 * userStatus.cashbackRate / 100)
            }
        };

    } catch (error) {
        console.error('❌ [PurchaseHistory] Ошибка получения рекомендаций:', error);
        throw error;
    }
}

// Вспомогательные функции
function getSourceDisplayName(source) {
    const displayNames = {
        'qtickets': 'Билеты Qtickets',
        'qtickets_webhook': 'Билеты Qtickets',
        'qtickets_cashback': 'Билеты с кэшбэком',
        'test': 'Тестовые покупки'
    };
    return displayNames[source] || source;
}

function getNextStatusName(currentStatus) {
    const statusOrder = ['Бронза', 'Серебро', 'Золото', 'Платина'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    return currentIndex < statusOrder.length - 1 ? statusOrder[currentIndex + 1] : 'Максимальный';
}

function getNextStatusCashback(currentStatus) {
    const cashbackRates = {
        'Бронза': 10,
        'Серебро': 15,
        'Золото': 20,
        'Платина': 20
    };
    return cashbackRates[getNextStatusName(currentStatus)] || 20;
}

module.exports = {
    getDetailedPurchaseHistory,
    getPurchaseSummaryByPeriod,
    getTopPurchaseCategories,
    getCashbackRecommendations
};
