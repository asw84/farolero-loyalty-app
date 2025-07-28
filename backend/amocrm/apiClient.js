// backend/amocrm/apiClient.js
// ФИНАЛЬНАЯ АВТОНОМНАЯ ВЕРСИЯ С СОХРАНЕНИЕМ ТОКЕНОВ

const axios = require('axios');
const fs = require('fs').promises; // Используем асинхронный модуль для работы с файлами
const path = require('path');     // Модуль для работы с путями

// --- Константы ---
const aмoSubdomain = 'sergeiavetsyuk';
const clientId = 'f75ce4cb-c3b9-48f9-99b7-25cc5ac1b0df';
const clientSecret = 'FQRF0skZhtGJJyhMveXskAagAlRNJDcrNEXWIHujv1Px08uQES8NSNwNKrVcazua'; // <<<--- ВСТАВЬТЕ СЮДА ВАШ СЕКРЕТНЫЙ КЛЮЧ
const tokensFilePath = path.join(__dirname, 'tokens.json'); // Путь к нашему файлу с токенами

// --- Переменные для хранения токенов в памяти ---
let accessToken = null;
let refreshToken = null;

// --- Функция для чтения токенов из файла ---
const readTokens = async () => {
    try {
        const data = await fs.readFile(tokensFilePath, 'utf-8');
        const tokens = JSON.parse(data);
        accessToken = tokens.accessToken;
        refreshToken = tokens.refreshToken;
    } catch (error) {
        console.error('[Tokens] Не удалось прочитать файл с токенами. Возможно, его нужно создать.', error.message);
    }
};

// --- Функция для записи токенов в файл ---
const writeTokens = async (tokens) => {
    try {
        accessToken = tokens.access_token;
        refreshToken = tokens.refresh_token;
        await fs.writeFile(tokensFilePath, JSON.stringify({
            accessToken: accessToken,
            refreshToken: refreshToken,
        }, null, 2));
        console.log('[Tokens] ✅ Токены успешно сохранены в файл.');
    } catch (error) {
        console.error('[Tokens] ❌ Не удалось записать токены в файл.', error.message);
    }
};

const apiClient = axios.create({
    baseURL: `https://${aмoSubdomain}.amocrm.ru/api/v4`,
});

// --- Функция для обновления токенов ---
const getAccessToken = async () => {
    if (!refreshToken) {
        await readTokens();
        if (!refreshToken) {
            throw new Error('Отсутствует Refresh Token. Необходимо пройти авторизацию заново.');
        }
    }
    
    try {
        console.log('[AmoCRM] Попытка обновить токен доступа...');
        const response = await axios.post(`https://${aмoSubdomain}.amocrm.ru/oauth2/access_token`, {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        });
        
        // СОХРАНЯЕМ НОВЫЕ ТОКЕНЫ В ФАЙЛ
        await writeTokens(response.data);
        
        console.log('[AmoCRM] ✅ Токен доступа успешно обновлен и сохранен!');
        return response.data.access_token;
    } catch (error) {
        console.error('❌ Ошибка обновления токена:', error.response ? error.response.data : error.message);
        throw new Error('Не удалось обновить токен доступа');
    }
};

// --- Перехватчики (остаются почти без изменений) ---
apiClient.interceptors.request.use(async (config) => {
    if (!accessToken) {
        accessToken = await getAccessToken();
    }
    config.headers.Authorization = `Bearer ${accessToken}`;
    return config;
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            console.log('[AmoCRM] Токен доступа просрочен. Обновляемся...');
            originalRequest._retry = true;
            accessToken = await getAccessToken();
            return apiClient(originalRequest);
        }
        return Promise.reject(error);
    }
);

module.exports = apiClient;