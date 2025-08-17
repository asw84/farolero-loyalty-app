// backend/config.js
// AmoCRM custom field IDs
const TELEGRAM_ID_FIELD_ID = '986901';
const POINTS_FIELD_ID = '986893';
const VK_ID_FIELD_ID = '986979';
const INSTAGRAM_ID_FIELD_ID = '986981';
const STATUS_FIELD_ID = process.env.STATUS_FIELD_ID || '000000'; // TODO: Настроить через autodetect-fields.js

const QTICKETS_DISCOUNTS = [
    { points: 100, discountId: '51147', value: 100 },
    { points: 200, discountId: '51148', value: 200 },
    { points: 500, discountId: '51149', value: 500 },
];

// Storage mode: 'local', 'hybrid', 'crm'
const STORAGE_MODE = process.env.STORAGE_MODE || 'local';
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://t.me/farolero_bot';

const POINTS_FOR_REFERRAL_PURCHASE = 50; // Example value

module.exports = {
    TELEGRAM_ID_FIELD_ID,
    POINTS_FIELD_ID,
    VK_ID_FIELD_ID,
    INSTAGRAM_ID_FIELD_ID,
    STATUS_FIELD_ID,
    QTICKETS_DISCOUNTS,
    STORAGE_MODE,
    APP_BASE_URL,
    POINTS_FOR_REFERRAL_PURCHASE
};