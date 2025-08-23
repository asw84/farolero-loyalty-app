// backend/services/amocrm.service.js
// ВЕРСИЯ С ОТЛАДКОЙ

const amocrmClient = require('../amocrm/apiClient');
const { POINTS_FIELD_ID, TELEGRAM_ID_FIELD_ID, VK_ID_FIELD_ID, STATUS_FIELD_ID } = require('../config');

async function findContactByVkId(vkId) {
    // Эта функция может потребовать кастомной логики в apiClient для поиска по ID VK
    // Пока реализуем через общий поиск, если apiClient это поддерживает
    const contacts = await amocrmClient.findContactByCustomField(vkId, VK_ID_FIELD_ID);
    return contacts?.[0] || null;
}

async function findContactByTelegramId(telegramId) {
    const contact = await amocrmClient.findContactByTelegramId(telegramId);
    
    // --- НАША "ШПИОНСКАЯ" СТРОКА ---
    if (contact) {
        console.log('--- ПОЛНЫЙ ОБЪЕКТ КОНТАКТА ИЗ AMO ---');
        // Мы используем JSON.stringify, чтобы увидеть всю вложенную структуру
        console.log(JSON.stringify(contact, null, 2));
        console.log('------------------------------------');
    }
    // ------------------------------------

    return contact;
}

function extractPointsFromContact(contact) {
    if (!contact || !contact.custom_fields_values) {
        console.log(`[AmoCRM] ❌ Контакт не имеет custom_fields_values`);
        return 0;
    }
    
    console.log(`[AmoCRM] 🔍 Ищем поле с ID ${POINTS_FIELD_ID} среди ${contact.custom_fields_values.length} полей`);
    
    // Выводим все доступные поля для отладки
    contact.custom_fields_values.forEach(field => {
        console.log(`[AmoCRM] 📋 Поле ID: ${field.field_id} (тип: ${typeof field.field_id}), значение: ${field.values?.[0]?.value || 'пусто'}`);
    });
    
    // Ищем поле с нужным ID (сравниваем и как строку, и как число)
    const pointsField = contact.custom_fields_values.find(field =>
        String(field.field_id) === String(POINTS_FIELD_ID)
    );
    
    if (pointsField) {
        const points = Number(pointsField.values[0]?.value || 0);
        console.log(`[AmoCRM] ✅ Найдено поле баллов! Значение: ${points}`);
        return points;
    } else {
        console.log(`[AmoCRM] ❌ Поле с ID ${POINTS_FIELD_ID} не найдено!`);
        return 0;
    }
}

async function findByTelegramId(telegramId) {
    return await findContactByTelegramId(telegramId);
}

async function getCustomField(contactId, fieldName) {
    try {
        // Получаем контакт по ID
        const response = await amocrmClient.getAuthorizedClient().get(`/api/v4/contacts/${contactId}`);
        const contact = response.data;
        
        if (!contact || !contact.custom_fields_values) {
            console.log(`[AmoCRM] ❌ Контакт не имеет custom_fields_values`);
            return null;
        }
        
        // Определяем ID поля по имени
        let fieldId;
        switch (fieldName) {
            case 'VK_ID_FIELD_ID':
                fieldId = VK_ID_FIELD_ID;
                break;
            case 'TELEGRAM_ID_FIELD_ID':
                fieldId = TELEGRAM_ID_FIELD_ID;
                break;
            case 'POINTS_FIELD_ID':
                fieldId = POINTS_FIELD_ID;
                break;
            default:
                console.log(`[AmoCRM] ❌ Неизвестное поле: ${fieldName}`);
                return null;
        }
        
        // Ищем поле с нужным ID
        const field = contact.custom_fields_values.find(f =>
            String(f.field_id) === String(fieldId)
        );
        
        if (field) {
            const value = field.values?.[0]?.value;
            console.log(`[AmoCRM] ✅ Найдено поле ${fieldName}: ${value}`);
            return value;
        } else {
            console.log(`[AmoCRM] ❌ Поле ${fieldName} не найдено!`);
            return null;
        }
    } catch (error) {
        console.error(`[AmoCRM] ❌ Ошибка при получении поля ${fieldName}:`, error);
        return null;
    }
}

/**
 * Обновляет статус пользователя в AmoCRM
 * @param {string} telegramId - Telegram ID пользователя
 * @param {string} status - Новый статус пользователя
 * @returns {Promise<boolean>} - Результат обновления
 */
async function updateUserStatus(telegramId, status) {
    try {
        console.log(`[AmoCRM] Обновление статуса для ${telegramId}: ${status}`);
        
        // Находим контакт
        const contact = await findContactByTelegramId(telegramId);
        if (!contact) {
            console.log(`[AmoCRM] ❌ Контакт с Telegram ID ${telegramId} не найден`);
            return false;
        }
        
        // Проверяем, настроено ли поле статуса
        if (!STATUS_FIELD_ID || STATUS_FIELD_ID === '000000') {
            console.log(`[AmoCRM] ⚠️ STATUS_FIELD_ID не настроен. Пропускаем обновление статуса.`);
            return false;
        }
        
        // Обновляем статус
        const updateResult = await amocrmClient.updateContact(contact.id, {
            [STATUS_FIELD_ID]: status
        });
        
        if (updateResult) {
            console.log(`[AmoCRM] ✅ Статус обновлен: ${telegramId} → ${status}`);
            return true;
        } else {
            console.log(`[AmoCRM] ❌ Ошибка при обновлении статуса для ${telegramId}`);
            return false;
        }
        
    } catch (error) {
        console.error(`[AmoCRM] ❌ Ошибка при обновлении статуса:`, error);
        return false;
    }
}

/**
 * Обновляет VK ID пользователя в AmoCRM.
 * @param {string} telegramId - Telegram ID пользователя.
 * @param {string} vkUserId - Новый VK ID.
 * @returns {Promise<boolean>} Результат операции.
 */
async function updateUserVkId(telegramId, vkUserId) {
    try {
        console.log(`[AmoCRM] Обновление VK ID для ${telegramId}: ${vkUserId}`);
        
        const contact = await findContactByTelegramId(telegramId);
        if (!contact) {
            console.warn(`[AmoCRM] ⚠️ Контакт с Telegram ID ${telegramId} не найден для обновления VK ID.`);
            return false;
        }

        if (!VK_ID_FIELD_ID) {
            console.error('[AmoCRM] ❌ VK_ID_FIELD_ID не настроен в конфигурации!');
            throw new Error('VK_ID_FIELD_ID is not configured.');
        }

        const updateResult = await amocrmClient.updateContact(contact.id, {
            [VK_ID_FIELD_ID]: String(vkUserId)
        });

        if (updateResult) {
            console.log(`[AmoCRM] ✅ VK ID обновлен: ${telegramId} → ${vkUserId}`);
            return true;
        } else {
            console.error(`[AmoCRM] ❌ Не удалось обновить VK ID для контакта ${contact.id}`);
            return false;
        }

    } catch (error) {
        console.error(`[AmoCRM] ❌ Критическая ошибка при обновлении VK ID:`, error);
        // Не пробрасываем ошибку дальше, чтобы не сломать основной флоу авторизации
        return false;
    }
}


module.exports = {
    findContactByTelegramId,
    findContactByVkId,
    extractPointsFromContact,
    updateUserStatus,
    updateUserVkId,
    getCustomField
};