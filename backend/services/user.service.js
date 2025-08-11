// backend/services/user.service.js
// ФИНАЛЬНАЯ ВЕРСИЯ С ПОДДЕРЖКОЙ STORAGE_MODE

const amocrmService = require('./amocrm.service');
const { findUserByTelegramId, findOrCreateUser, updateUser } = require('../database');
const { STORAGE_MODE, APP_BASE_URL } = require('../config');

async function getUserData(telegramId, referrerId = null) {
    console.log(`[UserService] Запрошены данные для ${telegramId}. Режим хранения: ${STORAGE_MODE}`);
    
    try {
        let userData;
        
        if (STORAGE_MODE === 'crm') {
            // Режим CRM: данные только из AmoCRM
            console.log(`[UserService] Получаю данные напрямую из AmoCRM`);
            const amoContact = await amocrmService.findContactByTelegramId(telegramId);
            
            if (amoContact) {
                const pointsFromAmo = amocrmService.extractPointsFromContact(amoContact);
                userData = {
                    points: pointsFromAmo,
                    status: 'Стандарт',
                    referralLink: `${APP_BASE_URL}/?startapp=ref_${telegramId}`
                };
                console.log(`[UserService] ✅ Данные из AmoCRM: ${pointsFromAmo} баллов`);
            } else {
                throw new Error(`Пользователь ${telegramId} не найден в AmoCRM`);
            }
            
        } else if (STORAGE_MODE === 'hybrid') {
            // Гибридный режим: синхронизация AmoCRM -> локальная БД -> отдача из локальной БД
            console.log(`[UserService] Синхронизация AmoCRM с локальной БД`);
            let user = await findUserByTelegramId(telegramId);
            
            // Всегда синхронизируемся с AmoCRM для актуальности данных
            const amoContact = await amocrmService.findContactByTelegramId(telegramId);
            let pointsFromAmo = 0;
            
            if (amoContact) {
                pointsFromAmo = amocrmService.extractPointsFromContact(amoContact);
                console.log(`[UserService] В AmoCRM найдено ${pointsFromAmo} баллов`);
            } else {
                console.log(`[UserService] Пользователь не найден в AmoCRM, будет создан с 0 баллов`);
            }

            if (user) {
                // Обновляем существующего пользователя
                await updateUser(telegramId, { points: pointsFromAmo, synced_with_amo: 1 });
            } else {
                // Создаем нового пользователя
                await findOrCreateUser(telegramId, 'telegram_user_id', referrerId);
                await updateUser(telegramId, { points: pointsFromAmo, synced_with_amo: 1 });
            }
            
            // Получаем обновленные данные из локальной БД
            user = await findUserByTelegramId(telegramId);
            userData = {
                points: user.points,
                status: 'Стандарт',
                referralLink: `${APP_BASE_URL}/?startapp=ref_${telegramId}`
            };
            console.log(`[UserService] ✅ Синхронизировано и отдано из локальной БД: ${user.points} баллов`);
            
        } else {
            // Локальный режим: только локальная БД
            console.log(`[UserService] Работаю только с локальной БД`);
            let user = await findUserByTelegramId(telegramId);
            
            if (!user) {
                user = await findOrCreateUser(telegramId, 'telegram_user_id', referrerId);
            }
            
            userData = {
                points: user.points,
                status: 'Стандарт',
                referralLink: `${APP_BASE_URL}/?startapp=ref_${telegramId}`
            };
            console.log(`[UserService] ✅ Данные из локальной БД: ${user.points} баллов`);
        }

        return userData;

    } catch (error) {
        console.error('❌ [UserService] Ошибка при получении данных пользователя:', error);
        throw error;
    }
}

module.exports = {
    getUserData,
};