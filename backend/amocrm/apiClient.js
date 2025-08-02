// backend/amocrm/apiClient.js
// ПОЛНАЯ ВЕРСИЯ С ФУНКЦИЕЙ СОЗДАНИЯ СДЕЛОК (LEADS)

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'amocrm.json');
const TOKENS_PATH = path.join(__dirname, '..', 'tokens.json');

if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error('Файл конфигурации amocrm.json не найден!');
}
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));

const TELEGRAM_ID_FIELD_ID = 986895;
const POINTS_FIELD_ID = 986893;

let apiClient = axios.create({
    baseURL: config.base_url
});

function getTokens() {
    if (fs.existsSync(TOKENS_PATH)) {
        const fileContent = fs.readFileSync(TOKENS_PATH, 'utf-8');
        // Добавим проверку на пустой файл
        if (fileContent) {
            return JSON.parse(fileContent);
        }
    }
    return null;
}

function saveTokens(tokens) {
    // Добавляем время создания токена для точного расчета срока жизни
    if (!tokens.created_at) {
        tokens.created_at = Date.now() / 1000;
    }
    fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

async function getInitialToken() {
    try {
        console.log('[AmoCRM] Попытка получить первичный токен по коду авторизации...');
        const response = await apiClient.post('/oauth2/access_token', {
            client_id: config.client_id,
            client_secret: config.client_secret,
            grant_type: 'authorization_code',
            code: config.auth_code,
            redirect_uri: config.redirect_uri
        });
        saveTokens(response.data);
        console.log('[AmoCRM] ✅ Первичный токен успешно получен и сохранен.');
        return response.data.access_token;
    } catch (error) {
        console.error('❌ [AmoCRM] Критическая ошибка при получении первичного токена:', error.response?.data || error.message);
        throw error;
    }
}

async function refreshToken(tokens) {
    try {
        console.log('[AmoCRM] Токен истек. Обновляю...');
        const response = await apiClient.post('/oauth2/access_token', {
            client_id: config.client_id,
            client_secret: config.client_secret,
            grant_type: 'refresh_token',
            refresh_token: tokens.refresh_token,
            redirect_uri: config.redirect_uri
        });
        saveTokens(response.data);
        console.log('[AmoCRM] ✅ Токен успешно обновлен и сохранен.');
        return response.data.access_token;
    } catch (error) {
        console.error('❌ [AmoCRM] Критическая ошибка при обновлении токена:', error.response?.data || error.message);
        throw error;
    }
}

apiClient.interceptors.request.use(async (axiosConfig) => {
    let tokens = getTokens();
    if (!tokens) {
         console.warn('[AmoCRM] Токены не найдены. Необходимо выполнить авторизацию.');
         return Promise.reject(new Error('Токены не найдены'));
    }

    const tokenExpiresAt = tokens.created_at + tokens.expires_in;
    if (Date.now() / 1000 > tokenExpiresAt - 60) {
        const newAccessToken = await refreshToken(tokens);
        axiosConfig.headers['Authorization'] = `Bearer ${newAccessToken}`;
    } else {
        axiosConfig.headers['Authorization'] = `Bearer ${tokens.access_token}`;
    }
    return axiosConfig;
});

async function findContactByTelegramId(telegramId) {
    try {
        console.log(`[AmoCRM] Ищу контакт с Telegram ID: ${telegramId}`);
        const response = await apiClient.get('/api/v4/contacts', {
            params: {
                query: telegramId,
            }
        });

        const contacts = response.data?._embedded?.contacts;
        if (!contacts) {
            console.log(`[AmoCRM] Контакты не найдены по запросу: ${telegramId}`);
            return null;
        }

        const contact = contacts.find(c =>
            c.custom_fields_values?.some(field =>
                field.field_id === TELEGRAM_ID_FIELD_ID &&
                field.values[0]?.value == telegramId
            )
        );

        if (contact) {
            console.log(`[AmoCRM] ✅ Найден контакт: ID ${contact.id}`);
            return contact;
        } else {
            console.log(`[AmoCRM] Контакт с Telegram ID ${telegramId} не найден среди результатов.`);
            return null;
        }
    } catch (error) {
        console.error('❌ [AmoCRM] Ошибка при поиске контакта:', error.response?.data || error.message);
        return null;
    }
}

async function updateContact(contactId, fieldsToUpdate) {
    try {
        const custom_fields_values = Object.entries(fieldsToUpdate).map(([field_id, value]) => ({
            field_id: Number(field_id),
            values: [{ value: value }]
        }));
        console.log(`[AmoCRM] Обновляю контакт ${contactId} данными:`, JSON.stringify(custom_fields_values));
        await apiClient.patch(`/api/v4/contacts/${contactId}`, { custom_fields_values });
        return true;
    } catch (error) {
        console.error('❌ [AmoCRM] Ошибка при обновлении контакта:', error.response?.data || error.message);
        return false;
    }
}

// --- НОВАЯ ФУНКЦИЯ ДЛЯ СОЗДАНИЯ СДЕЛКИ ---
async function createLead(name, { pipeline_id, status_id, contact_id, sale }) {
    try {
        console.log(`[AmoCRM] Создаю сделку "${name}" для контакта ${contact_id}`);
        const leadData = {
            name: name,
            price: sale,
            pipeline_id: pipeline_id,
            status_id: status_id,
            _embedded: {
                contacts: [{ id: contact_id }]
            }
        };

        // API AmoCRM ожидает массив сделок, даже если мы создаем одну
        await apiClient.post('/api/v4/leads', [leadData]);
        return true;
    } catch (error) {
        console.error('❌ [AmoCRM] Ошибка при создании сделки:', error.response?.data || error.message);
        return false;
    }
}

// --- ОБНОВЛЯЕМ ЭКСПОРТЫ ---
module.exports = {
    getInitialToken,
    findContactByTelegramId,
    updateContact,
    createLead // <-- Добавляем новую функцию
};