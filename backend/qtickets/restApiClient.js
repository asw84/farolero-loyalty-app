// backend/qtickets/restApiClient.js

const axios = require('axios');

// --- Секретные данные ---
// Это тот ключ, который вам предоставил заказчик
const QTICKETS_REST_API_KEY = 'usBHkfpNPMq1mKMWtN9WbKhXpqradnjZ';
// -----------------------

const restApiClient = axios.create({
    baseURL: 'https://qtickets.ru/api/rest/v1', // Базовый URL для REST API
    headers: {
        'Authorization': `Bearer ${QTICKETS_REST_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }
});

module.exports = restApiClient;