// backend/services/social.service.js

const telegramService = require('../telegram/telegramService');

/**
 * Проверяет подписку пользователя на соцсеть.
 * @param {string} telegramId - ID пользователя в Telegram.
 * @param {string} socialNetwork - Название соцсети.
 * @returns {object} Результат проверки.
 */
async function checkSubscription(telegramId, socialNetwork) {
    console.log(`[SocialService] Запрос на проверку подписки для ${telegramId} в сети ${socialNetwork}`);

    if (socialNetwork !== 'telegram') {
        const error = new Error(`Проверка для ${socialNetwork} пока не реализована.`);
        error.statusCode = 400;
        throw error;
    }

    const isSubscribed = await telegramService.isUserSubscribed(telegramId);

    if (isSubscribed) {
        console.log(`[SocialService] ✅ Подписка для ${telegramId} на Telegram подтверждена.`);
        return { success: true, message: 'Спасибо за подписку! Вам будет начислено 100 бонусных баллов.' };
    } else {
        console.log(`[SocialService] ⚠️ Подписка для ${telegramId} на Telegram НЕ подтверждена.`);
        return { success: false, message: 'Мы не смогли подтвердить вашу подписку.' };
    }
}

module.exports = {
    checkSubscription,
};
