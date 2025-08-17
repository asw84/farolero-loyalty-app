// backend/config.js
// AmoCRM custom field IDs
const TELEGRAM_ID_FIELD_ID = '986901';
const POINTS_FIELD_ID = '986893';
const VK_ID_FIELD_ID = '986979';
const INSTAGRAM_ID_FIELD_ID = '986981';
const STATUS_FIELD_ID = process.env.STATUS_FIELD_ID || '000000'; // TODO: Настроить через autodetect-fields.js

// VK Configuration
const VK_CONFIG = {
    CLIENT_ID: process.env.VK_CLIENT_ID,
    CLIENT_SECRET: process.env.VK_CLIENT_SECRET,
    SERVICE_KEY: process.env.VK_SERVICE_KEY,
    GROUP_ID: process.env.VK_GROUP_ID,
    GROUP_TOKEN: process.env.VK_GROUP_TOKEN,
    REDIRECT_URI: process.env.VK_REDIRECT_URI,
    OAUTH_SCOPE: process.env.VK_OAUTH_SCOPE || 'offline,email,wall,groups',
    CONFIRMATION_TOKEN: process.env.VK_CONFIRMATION_TOKEN,
    SECRET_KEY: process.env.VK_SECRET_KEY,
    ACCESS_TOKEN: process.env.VK_ACCESS_TOKEN,
    CONFIG_UPDATE_INTERVAL: process.env.VK_CONFIG_UPDATE_INTERVAL || 3600000
};

// Instagram Configuration
const INSTAGRAM_CONFIG = {
    APP_ID: process.env.INSTAGRAM_APP_ID,
    APP_SECRET: process.env.INSTAGRAM_APP_SECRET,
    REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI,
    GRAPH_VERSION: process.env.INSTAGRAM_GRAPH_VERSION || 'v18.0'
};

// AmoCRM Configuration
const AMOCRM_CONFIG = {
    BASE_URL: process.env.AMOCRM_BASE_URL,
    CLIENT_ID: process.env.AMOCRM_CLIENT_ID,
    CLIENT_SECRET: process.env.AMOCRM_CLIENT_SECRET,
    REDIRECT_URI: process.env.AMOCRM_REDIRECT_URI,
    TOKENS_PATH: process.env.TOKENS_PATH || './app/tokens'
};

// Qtickets Configuration
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
    POINTS_FOR_REFERRAL_PURCHASE,
    VK_CONFIG,
    INSTAGRAM_CONFIG,
    AMOCRM_CONFIG
};