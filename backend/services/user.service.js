// backend/services/user.service.js

const { findOrCreateUser } = require('../database');

async function getUserData(telegramId) {
    console.log(`[UserService] Запрошены данные для пользователя с Telegram ID: ${telegramId}`);
    try {
        const user = await findOrCreateUser(String(telegramId), 'telegram_user_id');

        if (!user) {
            // Эта ситуация маловероятна, так как findOrCreateUser должен всегда возвращать пользователя
            console.log(`[UserService] ⚠️ Пользователь с Telegram ID ${telegramId} не найден и не может быть создан.`);
            return null;
        }

        const userData = {
            points: user.points,
            status: 'Стандарт', // В будущем можно будет добавить логику статусов
            referralLink: `https://t.me/farolero_bot?start=ref_${telegramId}` // Логика реферальной ссылки остается
        };

        console.log(`[UserService] ✅ Пользователь найден. Отправляю данные:`, userData);
        return userData;

    } catch (error) {
        console.error('❌ [UserService] Ошибка при получении данных пользователя:', error);
        throw error; // Передаем ошибку выше, чтобы контроллер мог ее обработать
    }
}

module.exports = {
    getUserData,
};
