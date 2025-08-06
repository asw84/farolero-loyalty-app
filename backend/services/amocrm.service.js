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
        return 0;
    }
    const pointsField = contact.custom_fields_values.find(field => field.field_id === POINTS_FIELD_ID);
    return Number(pointsField?.values[0]?.value || 0);
}

module.exports = {
    findContactByTelegramId,
    extractPointsFromContact,
};