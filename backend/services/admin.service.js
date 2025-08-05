// backend/services/admin.service.js

const amocrmClient = require('../amocrm/apiClient');

const POINTS_FIELD_ID = process.env.AMO_POINTS_FIELD_ID;

/**
 * Возвращает статичные данные для админ-панели.
 * @returns {object} Статистика.
 */
function getStats() {
    console.log('[AdminService] Запрошена статистика');
    // В будущем здесь может быть реальная логика подсчета
    return { totalUsers: 150, ticketsSold: 75, pointsSpent: 12500 };
}

/**
 * Корректирует количество баллов пользователя.
 * @param {string} telegramId - ID пользователя в Telegram.
 * @param {number} points - Количество баллов для добавления (может быть отрицательным).
 * @param {string} reason - Причина корректировки.
 * @returns {object} Новый баланс пользователя.
 */
async function adjustPoints(telegramId, points, reason) {
    console.log(`[AdminService] Ручная корректировка баллов для ${telegramId}. Сумма: ${points}. Причина: ${reason}`);

    const contact = await amocrmClient.findContactByTelegramId(telegramId);
    if (!contact) {
        // Выбрасываем ошибку, чтобы контроллер мог ее поймать и отправить 404
        const error = new Error('Пользователь не найден в AmoCRM.');
        error.statusCode = 404;
        throw error;
    }

    const currentPoints = Number(contact.custom_fields_values?.find(f => f.field_id == POINTS_FIELD_ID)?.values[0]?.value || 0);
    const newTotalPoints = currentPoints + Number(points);

    await amocrmClient.updateContact(contact.id, { [POINTS_FIELD_ID]: newTotalPoints });

    console.log(`[AdminService] ✅ Баллы для ${telegramId} обновлены. Было: ${currentPoints}, стало: ${newTotalPoints}`);
    return { success: true, newTotalPoints };
}

module.exports = {
    getStats,
    adjustPoints,
};
