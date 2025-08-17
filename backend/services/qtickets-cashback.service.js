// backend/services/qtickets-cashback.service.js
// Сервис для оплаты билетов кэшбэком (баллами лояльности)

const { findUserByTelegramId, deductPoints, addPurchase } = require('../database');
const statusService = require('./status.service');
const amocrmService = require('./amocrm.service');
const walkService = require('./walk.service');

/**
 * Проверить возможность оплаты кэшбэком
 * @param {string} telegramId - Telegram ID пользователя
 * @param {number} walkId - ID прогулки
 * @param {number} pointsToUse - Количество баллов для оплаты
 * @returns {Promise<Object>} - Результат проверки
 */
async function validateCashbackPayment(telegramId, walkId, pointsToUse) {
    try {
        // Получаем пользователя
        const user = await findUserByTelegramId(telegramId);
        if (!user) {
            throw new Error('Пользователь не найден');
        }

        // Получаем информацию о прогулке
        const walk = walkService.getWalkById(walkId);
        if (!walk) {
            throw new Error('Прогулка не найдена');
        }

        // Проверяем достаточность баллов
        if (user.points < pointsToUse) {
            return {
                valid: false,
                error: 'Недостаточно баллов',
                userPoints: user.points,
                requiredPoints: pointsToUse
            };
        }

        // Проверяем минимальную сумму для оплаты баллами (например, не менее 50 руб)
        const minCashbackAmount = 50;
        if (pointsToUse < minCashbackAmount) {
            return {
                valid: false,
                error: `Минимальная сумма для оплаты баллами: ${minCashbackAmount} баллов`,
                minRequired: minCashbackAmount
            };
        }

        // Проверяем максимальный процент оплаты баллами (например, не более 80% от стоимости)
        const maxCashbackPercent = 80;
        const maxCashbackAmount = Math.floor((walk.price * maxCashbackPercent) / 100);
        
        if (pointsToUse > maxCashbackAmount) {
            return {
                valid: false,
                error: `Максимальная оплата баллами: ${maxCashbackPercent}% от стоимости (${maxCashbackAmount} баллов)`,
                maxAllowed: maxCashbackAmount,
                walkPrice: walk.price
            };
        }

        return {
            valid: true,
            userPoints: user.points,
            walkPrice: walk.price,
            cashbackAmount: pointsToUse,
            remainingPrice: walk.price - pointsToUse,
            remainingPoints: user.points - pointsToUse
        };
    } catch (error) {
        console.error('❌ [QticketsCashback] Ошибка валидации:', error);
        throw error;
    }
}

/**
 * Рассчитать максимальную сумму кэшбэка для прогулки
 * @param {string} telegramId - Telegram ID пользователя
 * @param {number} walkId - ID прогулки
 * @returns {Promise<Object>} - Информация о доступном кэшбэке
 */
async function calculateAvailableCashback(telegramId, walkId) {
    try {
        const user = await findUserByTelegramId(telegramId);
        if (!user) {
            throw new Error('Пользователь не найден');
        }

        const walk = walkService.getWalkById(walkId);
        if (!walk) {
            throw new Error('Прогулка не найдена');
        }

        // Получаем статус пользователя
        const statusInfo = await statusService.getUserStatus(telegramId);

        // Максимальный процент оплаты баллами
        const maxCashbackPercent = 80;
        const maxCashbackByPrice = Math.floor((walk.price * maxCashbackPercent) / 100);
        
        // Максимальная сумма ограничена балансом пользователя
        const maxCashbackByBalance = user.points;
        
        // Итоговая максимальная сумма
        const maxCashbackAmount = Math.min(maxCashbackByPrice, maxCashbackByBalance);

        return {
            walkId: walkId,
            walkName: walk.name,
            walkPrice: walk.price,
            userPoints: user.points,
            userStatus: statusInfo.status,
            maxCashbackPercent: maxCashbackPercent,
            maxCashbackAmount: maxCashbackAmount,
            recommendedCashback: Math.min(Math.floor(walk.price * 0.5), maxCashbackAmount), // 50% рекомендуемая сумма
            minCashbackAmount: 50
        };
    } catch (error) {
        console.error('❌ [QticketsCashback] Ошибка расчета кэшбэка:', error);
        throw error;
    }
}

/**
 * Выполнить оплату кэшбэком
 * @param {string} telegramId - Telegram ID пользователя
 * @param {number} walkId - ID прогулки
 * @param {number} pointsToUse - Количество баллов для оплаты
 * @returns {Promise<Object>} - Результат операции
 */
async function processCashbackPayment(telegramId, walkId, pointsToUse) {
    try {
        // Валидируем операцию
        const validation = await validateCashbackPayment(telegramId, walkId, pointsToUse);
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error,
                details: validation
            };
        }

        const user = await findUserByTelegramId(telegramId);
        const walk = walkService.getWalkById(walkId);

        // Списываем баллы
        await deductPoints(user.id, pointsToUse, 'qtickets_cashback', 'purchase_cashback');
        
        // Записываем покупку в историю
        const purchaseData = {
            user_id: user.id,
            event_id: walkId,
            event_name: walk.name,
            total_price: walk.price,
            cashback_used: pointsToUse,
            final_price: walk.price - pointsToUse,
            purchase_date: new Date().toISOString(),
            source: 'qtickets_cashback'
        };

        await addPurchase(purchaseData);

        // Создаем сделку в AmoCRM
        try {
            const contact = await amocrmService.findContactByTelegramId(telegramId);
            if (contact) {
                const leadName = `Покупка с кэшбэком: ${walk.name}`;
                await amocrmService.createLead(leadName, {
                    sale: walk.price,
                    contact_id: contact.id,
                    custom_fields: [{
                        field_name: 'Использован кэшбэк',
                        field_value: `${pointsToUse} баллов`
                    }]
                });
                console.log(`✅ [QticketsCashback] Сделка создана в AmoCRM для ${telegramId}`);
            }
        } catch (amocrmError) {
            console.error('⚠️ [QticketsCashback] Ошибка создания сделки в AmoCRM:', amocrmError);
            // Не прерываем операцию
        }

        // Обновляем статус пользователя (баллы могли измениться)
        await statusService.updateUserStatus(telegramId);

        console.log(`✅ [QticketsCashback] Успешная оплата кэшбэком: ${telegramId}, прогулка ${walkId}, баллы ${pointsToUse}`);

        return {
            success: true,
            transaction: {
                walkId: walkId,
                walkName: walk.name,
                originalPrice: walk.price,
                cashbackUsed: pointsToUse,
                finalPrice: walk.price - pointsToUse,
                remainingPoints: validation.remainingPoints
            }
        };

    } catch (error) {
        console.error('❌ [QticketsCashback] Ошибка обработки оплаты:', error);
        throw error;
    }
}

/**
 * Получить историю кэшбэк операций пользователя
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<Array>} - История операций
 */
async function getCashbackHistory(telegramId) {
    try {
        const user = await findUserByTelegramId(telegramId);
        if (!user) {
            throw new Error('Пользователь не найден');
        }

        // Получаем историю покупок с кэшбэком
        const { getUserPurchases } = require('../database');
        const purchases = await getUserPurchases(user.id);
        
        // Фильтруем только покупки с использованием кэшбэка
        const cashbackPurchases = purchases
            .filter(purchase => purchase.cashback_used > 0)
            .map(purchase => ({
                id: purchase.id,
                eventName: purchase.event_name,
                originalPrice: purchase.total_price,
                cashbackUsed: purchase.cashback_used,
                finalPrice: purchase.final_price,
                purchaseDate: purchase.purchase_date,
                savings: purchase.cashback_used
            }));

        return cashbackPurchases;
    } catch (error) {
        console.error('❌ [QticketsCashback] Ошибка получения истории:', error);
        throw error;
    }
}

module.exports = {
    validateCashbackPayment,
    calculateAvailableCashback,
    processCashbackPayment,
    getCashbackHistory
};
