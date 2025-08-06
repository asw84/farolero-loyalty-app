// backend/services/amocrm.service.js
const amocrmClient = require('../amocrm/apiClient');
const { POINTS_FIELD_ID } = require('../config'); // <-- Будем хранить ID в конфиге

async function findContactByTelegramId(telegramId) {
    return await amocrmClient.findContactByTelegramId(telegramId);
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