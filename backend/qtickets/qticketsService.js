// backend/qtickets/qticketsService.js

const restApiClient = require('./restApiClient');
const crypto = require('crypto'); // Используем встроенный модуль для генерации случайных строк

/**
 * Генерирует уникальный промокод, регистрирует его в Qtickets и возвращает.
 * @param {number|string} discountId - ID скидки, созданной в ЛК Qtickets.
 * @returns {Promise<string|null>} - Возвращает строку с промокодом или null в случае ошибки.
 */
async function createSinglePromoCode(discountId) {
    if (!discountId) {
        console.error('[QticketsService] ❌ Ошибка: discountId не предоставлен.');
        return null;
    }

    // Генерируем случайный, читаемый промокод. Например, FRL-XXXXXX
    const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
    const promoCodeString = `FRL-${randomPart}`;

    console.log(`[QticketsService] Генерирую промокод "${promoCodeString}" для скидки ID ${discountId}...`);

    try {
        // Отправляем запрос на эндпоинт для создания промокодов
        const response = await restApiClient.post('/promo-codes', {
            data: {
                discount_id: Number(discountId),
                code: promoCodeString,
                max_uses_count: 1, // Одноразовый
                is_active: 1
            }
        });

        if (response.data && response.data.data && response.data.data.code === promoCodeString) {
            console.log(`[QticketsService] ✅ Успешно зарегистрирован промокод: ${promoCodeString}`);
            return promoCodeString;
        } else {
            console.error('[QticketsService] ❌ API Qtickets вернул неожиданный ответ:', response.data);
            return null;
        }
    } catch (error) {
        const errorMsg = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`[QticketsService] ❌ Ошибка при регистрации промокода в Qtickets:`, errorMsg);
        return null;
    }
}

module.exports = {
    createSinglePromoCode
};