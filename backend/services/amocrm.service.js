// backend/services/amocrm.service.js
// ВЕРСИЯ С ОТЛАДКОЙ

const amocrmClient = require('../amocrm/apiClient');
const { POINTS_FIELD_ID } = require('../config');

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

module.exports = {
    findContactByTelegramId,
    extractPointsFromContact,
};