// backend/config.js
// AmoCRM custom field IDs
const TELEGRAM_ID_FIELD_ID = '986901';
const POINTS_FIELD_ID = '986893';
const VK_ID_FIELD_ID = '986979';
const INSTAGRAM_ID_FIELD_ID = '986981';
const QTICKETS_DISCOUNT_ID = '51147';

// Storage mode: 'local', 'hybrid', 'crm'
const STORAGE_MODE = process.env.STORAGE_MODE || 'local';

module.exports = {
    TELEGRAM_ID_FIELD_ID,
    POINTS_FIELD_ID,
    VK_ID_FIELD_ID,
    INSTAGRAM_ID_FIELD_ID,
    QTICKETS_DISCOUNT_ID,
    STORAGE_MODE
};