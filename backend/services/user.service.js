// backend/services/user.service.js
// ФИНАЛЬНАЯ ВЕРСИЯ С ПОДДЕРЖКОЙ STORAGE_MODE

const amocrmService = require('./amocrm.service');
const { findUserByTelegramId, findOrCreateUser, updateUser, findUserByVkId } = require('../database');
const { STORAGE_MODE, APP_BASE_URL } = require('../config');
const { calculateStatus } = require('./loyaltyService');
const statusService = require('./status.service');

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
                const status = calculateStatus(pointsFromAmo);
                userData = {
                    points: pointsFromAmo,
                    status: status,
                    referralLink: `https://t.me/farolero_bot?start=ref_${telegramId}`
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
            
            // Обновляем статус на основе баллов
            const newStatus = calculateStatus(user.points);
            if (user.status !== newStatus) {
                await updateUser(telegramId, { status: newStatus });
                user.status = newStatus;
            }
            
            userData = {
                points: user.points,
                status: user.status
            };
            console.log(`[UserService] ✅ Синхронизировано и отдано из локальной БД: ${user.points} баллов`);
            
        } else {
            // Локальный режим: только локальная БД
            console.log(`[UserService] Работаю только с локальной БД`);
            let user = await findUserByTelegramId(telegramId);
            
            if (!user) {
                user = await findOrCreateUser(telegramId, 'telegram_user_id', referrerId);
            }
            
            // Обновляем статус на основе баллов
            const newStatus = calculateStatus(user.points);
            if (user.status !== newStatus) {
                await updateUser(telegramId, { status: newStatus });
                user.status = newStatus;
            }
            
            userData = {
                points: user.points,
                status: user.status
            };
            console.log(`[UserService] ✅ Данные из локальной БД: ${user.points} баллов`);
        }

        return userData;

    } catch (error) {
        console.error('❌ [UserService] Ошибка при получении данных пользователя:', error);
        throw error;
    }
}

/**
 * Привязывает VK ID к пользователю по его Telegram ID.
 * @param {string} telegramId - Telegram ID пользователя.
 * @param {string} vkUserId - VK ID пользователя.
 * @param {object} vkUserData - Дополнительные данные из VK.
 * @returns {Promise<object>} Результат операции.
 */
async function linkVkToUser(telegramId, vkUserId, vkUserData) {
    console.log(`[UserService] Привязка VK ID ${vkUserId} к Telegram ID ${telegramId}`);

    // 1. Проверить, не занят ли уже этот VK ID другим пользователем
    const existingVkUser = await findUserByVkId(vkUserId);
    if (existingVkUser && existingVkUser.telegram_user_id !== telegramId) {
        console.error(`[UserService] ❌ Попытка привязать VK ID ${vkUserId}, который уже используется пользователем ${existingVkUser.telegram_user_id}`);
        throw new Error('Этот VK аккаунт уже привязан к другому профилю.');
    }

    // 2. Найти пользователя по Telegram ID или создать нового, если его нет
    let user = await findUserByTelegramId(telegramId);
    if (!user) {
        console.log(`[UserService] Пользователь с Telegram ID ${telegramId} не найден. Создаем нового.`);
        user = await findOrCreateUser(telegramId, 'telegram_user_id');
    }

    // 3. Обновить данные пользователя
    const updateData = {
        vk_user_id: vkUserId
        // Здесь можно добавить обновление других полей, например, имени, если это необходимо
        // first_name: vkUserData.first_name,
        // last_name: vkUserData.last_name
    };

    await updateUser(telegramId, updateData);
    console.log(`[UserService] ✅ VK ID ${vkUserId} успешно привязан к пользователю ${telegramId}`);
    
    // 4. (Опционально) Синхронизировать с AmoCRM
    if (STORAGE_MODE === 'hybrid' || STORAGE_MODE === 'crm') {
       try {
           await amocrmService.updateUserVkId(telegramId, vkUserId);
           console.log(`[UserService] ✅ Данные VK ID синхронизированы с AmoCRM для ${telegramId}`);
       } catch (amoError) {
           console.warn(`[UserService] ⚠️ Не удалось синхронизировать VK ID с AmoCRM для ${telegramId}:`, amoError.message);
           // Не бросаем ошибку, чтобы не прерывать основной флоу
       }
    }
    
    return { success: true, message: 'Аккаунт VK успешно привязан.' };
}

module.exports = {
    getUserData,
    linkVkToUser
};