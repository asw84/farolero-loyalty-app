// backend/services/amocrm.service.js
// ВЕРСИЯ С ОТЛАДКОЙ

const amocrmClient = require('../amocrm/apiClient');
const { POINTS_FIELD_ID, TELEGRAM_ID_FIELD_ID, VK_ID_FIELD_ID } = require('../config');

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

module.exports = {
    findContactByTelegramId,
    extractPointsFromContact,
    findByTelegramId,
    getCustomField,
};