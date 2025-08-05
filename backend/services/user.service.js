// backend/services/user.service.js

const amocrmClient = require('../amocrm/apiClient');

const POINTS_FIELD_ID = process.env.AMO_POINTS_FIELD_ID;

async function getUserData(telegramId) {
    console.log(`[User] Запрошены данные для пользователя с Telegram ID: ${telegramId}`);
    const contact = await amocrmClient.findContactByTelegramId(telegramId);
    if (!contact) {
        console.log(`[User] ⚠️ Пользователь с Telegram ID ${telegramId} не найден.`);
        return null;
    }
    const points = contact.custom_fields_values?.find(field => field.field_id == POINTS_FIELD_ID)?.values[0]?.value || 0;
    const userData = {
        points: Number(points),
        status: 'Стандарт',
        referralLink: `https://t.me/farolero_bot?start=ref_${telegramId}`
    };
    console.log(`[User] ✅ Пользователь найден. Отправляю данные:`, userData);
    return userData;
}

module.exports = {
    getUserData,
};
