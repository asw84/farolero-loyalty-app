// backend/services/status.service.js
// Сервис для управления статусами пользователей и кэшбэком

const { findUserByTelegramId, updateUser } = require('../database');
const { calculateStatus, calculateCashbackRate } = require('./loyaltyService');
const amocrmService = require('./amocrm.service');

/**
 * Получить статус пользователя по баллам
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<Object>} - Объект с информацией о статусе и кэшбэке
 */
async function getUserStatus(telegramId) {
    try {
        const user = await findUserByTelegramId(telegramId);
        if (!user) {
            throw new Error(`Пользователь ${telegramId} не найден`);
        }

        const currentStatus = calculateStatus(user.points);
        const cashbackRate = calculateCashbackRate(currentStatus);

        return {
            userId: user.id,
            telegramId: user.telegram_user_id,
            points: user.points,
            status: currentStatus,
            cashbackRate: cashbackRate,
            nextLevelPoints: getNextLevelPoints(user.points),
            pointsToNextLevel: getPointsToNextLevel(user.points)
        };
    } catch (error) {
        console.error('❌ [StatusService] Ошибка при получении статуса:', error);
        throw error;
    }
}

/**
 * Обновить статус пользователя на основе текущих баллов
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<Object>} - Результат обновления
 */
async function updateUserStatus(telegramId) {
    try {
        const user = await findUserByTelegramId(telegramId);
        if (!user) {
            throw new Error(`Пользователь ${telegramId} не найден`);
        }

        const oldStatus = user.status;
        const newStatus = calculateStatus(user.points);
        
        // Обновляем статус если он изменился
        if (oldStatus !== newStatus) {
            await updateUser(telegramId, { status: newStatus });
            
            // Синхронизируем статус с AmoCRM
            try {
                await amocrmService.updateUserStatus(telegramId, newStatus);
                console.log(`✅ [StatusService] Статус синхронизирован с AmoCRM: ${telegramId} → ${newStatus}`);
            } catch (amocrmError) {
                console.error(`⚠️ [StatusService] Ошибка синхронизации с AmoCRM:`, amocrmError);
                // Не прерываем выполнение, статус обновлен локально
            }
            
            console.log(`✅ [StatusService] Статус пользователя ${telegramId} изменен: ${oldStatus} → ${newStatus}`);
            
            return {
                statusChanged: true,
                oldStatus,
                newStatus,
                points: user.points,
                cashbackRate: calculateCashbackRate(newStatus)
            };
        }

        return {
            statusChanged: false,
            status: newStatus,
            points: user.points,
            cashbackRate: calculateCashbackRate(newStatus)
        };
    } catch (error) {
        console.error('❌ [StatusService] Ошибка при обновлении статуса:', error);
        throw error;
    }
}

/**
 * Рассчитать кэшбэк для суммы покупки
 * @param {string} telegramId - Telegram ID пользователя
 * @param {number} purchaseAmount - Сумма покупки
 * @returns {Promise<Object>} - Информация о кэшбэке
 */
async function calculateCashback(telegramId, purchaseAmount) {
    try {
        const statusInfo = await getUserStatus(telegramId);
        const cashbackAmount = Math.round((purchaseAmount * statusInfo.cashbackRate) / 100);
        
        return {
            purchaseAmount,
            cashbackRate: statusInfo.cashbackRate,
            cashbackAmount,
            userStatus: statusInfo.status,
            userPoints: statusInfo.points
        };
    } catch (error) {
        console.error('❌ [StatusService] Ошибка при расчете кэшбэка:', error);
        throw error;
    }
}

/**
 * Получить количество баллов для следующего уровня
 * @param {number} currentPoints - Текущие баллы
 * @returns {number} - Баллы для следующего уровня
 */
function getNextLevelPoints(currentPoints) {
    if (currentPoints < 500) return 500;   // До Серебра
    if (currentPoints < 1500) return 1500; // До Золота
    if (currentPoints < 3000) return 3000; // До Платины
    return null; // Максимальный уровень
}

/**
 * Получить количество баллов до следующего уровня
 * @param {number} currentPoints - Текущие баллы
 * @returns {number} - Баллы до следующего уровня
 */
function getPointsToNextLevel(currentPoints) {
    const nextLevel = getNextLevelPoints(currentPoints);
    return nextLevel ? nextLevel - currentPoints : 0;
}

/**
 * Получить список всех статусов с требованиями
 * @returns {Array} - Массив статусов
 */
function getStatusLevels() {
    return [
        {
            name: 'Бронза',
            minPoints: 0,
            maxPoints: 499,
            cashbackRate: 5,
            color: '#CD7F32'
        },
        {
            name: 'Серебро',
            minPoints: 500,
            maxPoints: 1499,
            cashbackRate: 10,
            color: '#C0C0C0'
        },
        {
            name: 'Золото',
            minPoints: 1500,
            maxPoints: 2999,
            cashbackRate: 15,
            color: '#FFD700'
        },
        {
            name: 'Платина',
            minPoints: 3000,
            maxPoints: null,
            cashbackRate: 20,
            color: '#E5E4E2'
        }
    ];
}

module.exports = {
    getUserStatus,
    updateUserStatus,
    calculateCashback,
    getNextLevelPoints,
    getPointsToNextLevel,
    getStatusLevels
};
