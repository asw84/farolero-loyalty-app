// backend/services/user.service.js
// ФИНАЛЬНАЯ ВЕРСИЯ С СИНХРОНИЗАЦИЕЙ

const amocrmService = require('./amocrm.service');
const { findUserByTelegramId, findOrCreateUser, updateUser } = require('../database');

async function getUserData(telegramId) {
    console.log(`[UserService] Запрошены данные для ${telegramId}`);
    try {
        let user = await findUserByTelegramId(telegramId);

        // Если пользователя нет в нашей БД или он еще не синхронизирован
        if (!user || !user.synced_with_amo) {
            console.log(`[UserService] Пользователь ${telegramId} требует синхронизации с AmoCRM.`);
            const amoContact = await amocrmService.findContactByTelegramId(telegramId);
            
            let pointsFromAmo = 0;
            if (amoContact) {
                pointsFromAmo = amocrmService.extractPointsFromContact(amoContact);
                console.log(`[UserService] В AmoCRM найдено ${pointsFromAmo} баллов.`);
            } else {
                console.log(`[UserService] Пользователь не найден в AmoCRM, будет создан с 0 баллов.`);
            }

            if (user) { // Если пользователь уже есть, но не синхронизирован
                await updateUser(telegramId, { points: pointsFromAmo, synced_with_amo: 1 });
            } else { // Если пользователя вообще нет
                // findOrCreateUser создаст его
                await findOrCreateUser(telegramId, 'telegram_user_id');
                // и мы сразу обновим ему баллы
                await updateUser(telegramId, { points: pointsFromAmo, synced_with_amo: 1 });
            }
            
            // Перезапрашиваем данные пользователя из нашей БД после обновления
            user = await findUserByTelegramId(telegramId);
        }

        const userData = {
            points: user.points,
            status: 'Стандарт',
            referralLink: `https://t.me/farolero_bot?start=ref_${telegramId}`
        };

        console.log(`[UserService] ✅ Отправляю данные из локальной БД:`, userData);
        return userData;

    } catch (error) {
        console.error('❌ [UserService] Ошибка при получении данных пользователя:', error);
        throw error;
    }
}

module.exports = {
    getUserData,
};