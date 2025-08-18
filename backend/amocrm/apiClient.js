// backend/amocrm/apiClient.js
// FINAL STABLE VERSION with improved token auto-refresh

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const TokenManager = require('../utils/token-manager');

const CONFIG_PATH = path.join(__dirname, 'amocrm.json');

if (!fs.existsSync(CONFIG_PATH)) { throw new Error('amocrm.json not found!'); }
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

const { TELEGRAM_ID_FIELD_ID } = require('../config');

const authApiClient = axios.create({ baseURL: config.base_url });
const apiClient = axios.create({ baseURL: config.base_url });

// TokenManager с тройной защитой (singleton)
const tokenManager = TokenManager.getInstance('amocrm');
let tokens = tokenManager.getTokens();

// Устаревшие функции заменены на TokenManager
// Оставляем для обратной совместимости
function getTokens() {
    return tokenManager.getTokens();
}

function saveTokens(tokens) {
    return tokenManager.saveTokens(tokens);
}

function isTokenExpired(tokens) {
    return tokenManager.isTokenExpired(tokens);
}

async function refreshTokens() {
    try {
        console.log('[AMO] 🔄 Tokens refreshing...');
        const currentTokens = await tokenManager.getTokens();
        const response = await authApiClient.post('/oauth2/access_token', {
            client_id: config.client_id,
            client_secret: config.client_secret,
            grant_type: 'refresh_token',
            refresh_token: currentTokens.refresh_token,
            redirect_uri: config.redirect_uri
        });

        const newTokens = {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expires_in: response.data.expires_in,
            created_at: Math.floor(Date.now() / 1000)
        };
        await tokenManager.saveTokens(newTokens);
        console.log('[AMO] ✅ Tokens refreshed successfully');
        return newTokens.access_token;
    } catch (err) {
        console.error('[AMO] ❌ Failed to refresh tokens', err.response?.data || err.message);
        throw err;
    }
}

async function getInitialToken() {
    try {
        console.log('[AMO] 🔑 Attempting to get initial token...');
        
        const currentTokens = tokenManager.getTokens();
        
        // Проверяем, есть ли у нас валидные токены
        if (currentTokens.access_token && !isTokenExpired(currentTokens)) {
            console.log('[AMO] ✅ Using existing valid token');
            return currentTokens.access_token;
        }
        
        // Если есть refresh_token, пробуем обновить токен
        if (currentTokens.refresh_token) {
            try {
                console.log('[AMO] 🔄 Trying to refresh token...');
                return await refreshTokens();
            } catch (refreshError) {
                console.log('[AMO] ⚠️ Failed to refresh token, need re-authorization');
                throw new Error('Требуется повторная авторизация. Пожалуйста, перейдите на /api/amocrm/init для получения кода авторизации.');
            }
        }
        
        // Если нет auth_code в конфиге, выдаем ошибку с инструкцией
        if (!config.auth_code) {
            throw new Error('Отсутствует код авторизации. Пожалуйста, перейдите на /api/amocrm/init для получения кода авторизации.');
        }
        
        const response = await authApiClient.post('/oauth2/access_token', {
            client_id: config.client_id, client_secret: config.client_secret,
            grant_type: 'authorization_code', code: config.auth_code,
            redirect_uri: config.redirect_uri
        });
        const newTokens = {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expires_in: response.data.expires_in,
            created_at: Math.floor(Date.now() / 1000)
        };
        await tokenManager.saveTokens(newTokens);
        console.log('[AMO] ✅ Initial token successfully retrieved.');
        return newTokens.access_token;
    } catch (error) {
        console.error('❌ [AMO] Error getting initial token:', error.response?.data || error.message);
        throw error;
    }
}

function getAuthUrl() {
    const { client_id, redirect_uri, base_url } = config;
    return `${base_url}/oauth2/authorize?client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&mode=popup`;
}

async function exchangeCodeForTokens(code) {
    try {
        console.log('[AMO] 🔑 Exchanging authorization code for tokens...');
        const response = await authApiClient.post('/oauth2/access_token', {
            client_id: config.client_id,
            client_secret: config.client_secret,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: config.redirect_uri
        });

        const newTokens = {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expires_in: response.data.expires_in,
            created_at: Math.floor(Date.now() / 1000)
        };
        await tokenManager.saveTokens(newTokens);
        console.log('[AMO] ✅ Tokens successfully obtained and saved');
        return newTokens;
    } catch (error) {
        console.error('❌ [AMO] Error exchanging code for tokens:', error.response?.data || error.message);
        throw error;
    }
}

apiClient.interceptors.request.use(async (axiosConfig) => {
    console.log(`[AMO] 🔑 Making request to: ${axiosConfig.url}`);
    
    const currentTokens = tokenManager.getTokens();
    
    if (!currentTokens.access_token) {
        console.log('[AMO] ⚠️ No access token found, getting initial token...');
        try {
            await getInitialToken();
        } catch (error) {
            console.error('[AMO] ❌ Failed to get initial token:', error.message);
            return Promise.reject(new Error('Failed to get initial token.'));
        }
    }
    
    const tokenExpirationTime = currentTokens.created_at + currentTokens.expires_in;
    const currentTime = Math.floor(Date.now() / 1000);
    console.log(`[AMO] 📅 Token expires at: ${new Date(tokenExpirationTime * 1000).toISOString()}, current time: ${new Date(currentTime * 1000).toISOString()}`);
    
    if (isTokenExpired(currentTokens)) {
        console.log('[AMO] 🔄 Token expired, refreshing...');
        try {
            const newAccessToken = await refreshTokens();
            axiosConfig.headers['Authorization'] = `Bearer ${newAccessToken}`;
            console.log('[AMO] ✅ Token refreshed successfully');
        } catch (error) {
            console.error('[AMO] ❌ Failed to refresh token:', error.message);
            return Promise.reject(new Error('Failed to refresh token.'));
        }
    } else {
        axiosConfig.headers['Authorization'] = `Bearer ${currentTokens.access_token}`;
        console.log('[AMO] ✅ Using existing valid token');
    }
    return axiosConfig;
});

// Добавляем интерцептор для ответов, чтобы логировать ошибки
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[AMO] ✅ Successful response from ${response.config.url}:`, response.status);
    return response;
  },
  (error) => {
    console.error(`[AMO] ❌ Error response from ${error.config?.url}:`, error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);

// The findContactByTelegramId function should use the robust hybrid search method
async function findContactByTelegramId(telegramId) {
    console.log(`[AmoCRM] Searching with hybrid query method for: ${telegramId}`);
    const response = await apiClient.get('/api/v4/contacts', { params: { query: String(telegramId) } });
    const contacts = response.data?._embedded?.contacts;
    if (contacts && contacts.length > 0) {
        const contact = contacts.find(c =>
            String(c.name).trim() === String(telegramId) || 
            c.custom_fields_values?.some(field => 
                field.field_id === TELEGRAM_ID_FIELD_ID && String(field.values[0]?.value).trim() === String(telegramId)
            )
        );
        if (contact) {
            console.log(`[AmoCRM] ✅ Found contact ID ${contact.id} via general query.`);
            return contact;
        }
    }
    console.log(`[AmoCRM] ⚠️ Contact with Telegram ID ${telegramId} not found.`);
    return null;
}

async function updateContact(contactId, fieldsToUpdate) {
    try {
        const custom_fields_values = Object.entries(fieldsToUpdate).map(([field_id, value]) => ({
            field_id: Number(field_id),
            values: [{ value: value }]
        }));
        await apiClient.patch(`/api/v4/contacts/${contactId}`, { custom_fields_values });
        return true;
    } catch (error) {
        console.error('❌ [AmoCRM] Error updating contact:', error.response?.data || error.message);
        return false;
    }
}

async function createLead(name, { pipeline_id, status_id, contact_id, sale }) {
    try {
        console.log(`[AmoCRM] Creating lead "${name}" and linking to contact ID ${contact_id}`);
        const leadData = {
            name: name,
            price: sale,
            pipeline_id: pipeline_id,
            status_id: status_id,
            _embedded: {
                contacts: [
                    {
                        id: contact_id
                    }
                ]
            }
        };
        await apiClient.post('/api/v4/leads', [leadData]);
        console.log(`[AmoCRM] ✅ Lead "${name}" successfully created and linked.`);
        return true;
    } catch (error) {
        const errorDetails = error.response ? JSON.stringify(error.response.data, null, 2) : error.message;
        console.error('❌ [AmoCRM] Error creating lead:', errorDetails);
        return false;
    }
}

async function getAuthorizedClient() {
    const currentTokens = tokenManager.getTokens();  // Получаем свежие токены
    
    if (!currentTokens.access_token || isTokenExpired(currentTokens)) {
        if (!currentTokens.refresh_token) {
            await getInitialToken();
        } else {
            await refreshTokens();
        }
    }

    return axios.create({
        baseURL: config.base_url,
        headers: {
            Authorization: `Bearer ${currentTokens.access_token}`
        }
    });
}

module.exports = {
    findContactByTelegramId,
    updateContact,
    createLead,
    getAuthorizedClient,
    getInitialToken,
    getAuthUrl,
    exchangeCodeForTokens,
    getTokens,
    saveTokens,
    isTokenExpired,
    refreshTokens
};