// backend/amocrm/apiClient.js
// FINAL STABLE VERSION with improved token auto-refresh

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'amocrm.json');
const TOKENS_PATH = path.join(__dirname, '..', 'tokens.json');

if (!fs.existsSync(CONFIG_PATH)) { throw new Error('amocrm.json not found!'); }
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

const { TELEGRAM_ID_FIELD_ID } = require('../config');

const authApiClient = axios.create({ baseURL: config.base_url });
const apiClient = axios.create({ baseURL: config.base_url });

// Глобальное хранение токенов в памяти
let tokens = getTokens();

function getTokens() {
    if (fs.existsSync(TOKENS_PATH)) {
        const content = fs.readFileSync(TOKENS_PATH, 'utf-8');
        if (content) return JSON.parse(content);
    }
    return { access_token: '', refresh_token: '', created_at: 0, expires_in: 0 };
}

function saveTokens(tokens) {
    if (!tokens.created_at) { tokens.created_at = Math.floor(Date.now() / 1000); }
    fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

function isTokenExpired(tokens) {
    const now = Math.floor(Date.now() / 1000);
    return now > (tokens.created_at + tokens.expires_in - 60); // за 60 сек до истечения
}

async function refreshTokens() {
    try {
        console.log('[AMO] 🔄 Tokens refreshing...');
        const response = await authApiClient.post('/oauth2/access_token', {
            client_id: config.client_id,
            client_secret: config.client_secret,
            grant_type: 'refresh_token',
            refresh_token: tokens.refresh_token,
            redirect_uri: config.redirect_uri
        });

        tokens = {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expires_in: response.data.expires_in,
            created_at: Math.floor(Date.now() / 1000)
        };
        saveTokens(tokens);
        console.log('[AMO] ✅ Tokens refreshed successfully');
        return tokens.access_token;
    } catch (err) {
        console.error('[AMO] ❌ Failed to refresh tokens', err.response?.data || err.message);
        throw err;
    }
}

async function getInitialToken() {
    try {
        console.log('[AMO] 🔑 Attempting to get initial token...');
        const response = await authApiClient.post('/oauth2/access_token', {
            client_id: config.client_id, client_secret: config.client_secret,
            grant_type: 'authorization_code', code: config.auth_code,
            redirect_uri: config.redirect_uri
        });
        tokens = {
            access_token: response.data.access_token,
            refresh_token: response.data.refresh_token,
            expires_in: response.data.expires_in,
            created_at: Math.floor(Date.now() / 1000)
        };
        saveTokens(tokens);
        console.log('[AMO] ✅ Initial token successfully retrieved.');
        return tokens.access_token;
    } catch (error) {
        console.error('❌ [AMO] Error getting initial token:', error.response?.data || error.message);
        throw error;
    }
}

apiClient.interceptors.request.use(async (axiosConfig) => {
    if (!tokens.access_token) {
        try {
            await getInitialToken();
        } catch (error) {
            return Promise.reject(new Error('Failed to get initial token.'));
        }
    }
    
    if (isTokenExpired(tokens)) {
        try {
            const newAccessToken = await refreshTokens();
            axiosConfig.headers['Authorization'] = `Bearer ${newAccessToken}`;
        } catch (error) {
            return Promise.reject(new Error('Failed to refresh token.'));
        }
    } else {
        axiosConfig.headers['Authorization'] = `Bearer ${tokens.access_token}`;
    }
    return axiosConfig;
});


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
    if (!tokens.access_token || isTokenExpired(tokens)) {
        if (!tokens.refresh_token) {
            await getInitialToken();
        } else {
            await refreshTokens();
        }
    }

    return axios.create({
        baseURL: config.base_url,
        headers: {
            Authorization: `Bearer ${tokens.access_token}`
        }
    });
}

module.exports = {
    findContactByTelegramId,
    updateContact,
    createLead,
    getAuthorizedClient
};