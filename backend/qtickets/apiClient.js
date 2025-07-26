// backend/qtickets/apiClient.js
const axios = require('axios');

// --- Секретные данные ---
const QTICKETS_API_KEY = 'usBHkfpNPMq1mKMWtN9WbKhXpqradnjZ';
// -----------------------

const apiClient = axios.create({
    baseURL: 'https://qtickets.ru/api/partners/v1', // Базовый URL для Partners API
    headers: {
        'Authorization': `Bearer ${QTICKETS_API_KEY}`,
        'Accept': 'application/json'
    }
});

// Экспортируем готовый клиент
module.exports = apiClient;