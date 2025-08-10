// backend/services/vk.oauth.service.js

const axios = require('axios');
const amocrmClient = require('../amocrm/apiClient');
const { TELEGRAM_ID_FIELD_ID, VK_ID_FIELD_ID } = require('../config');
const { VK_APP_ID, VK_APP_SECRET, VK_REDIRECT_URI } = process.env;

/**
 * Обрабатывает OAuth callback от VK.
 * @param {string} code - Временный код авторизации от VK.
 * @param {string} telegram_user_id - ID пользователя в Telegram.
 * @returns {Promise<object>} Результат операции.
 */
async function handleOAuthCallback(code, telegram_user_id) {
    try {
        const { access_token, user_id } = await getAccessToken(code);
        
        // Обновляем контакт в AmoCRM: записываем VK ID в кастомное поле
        const contact = await amocrmClient.findContactByTelegramId(telegram_user_id);
        if (contact) {
            await amocrmClient.updateContact(contact.id, { [VK_ID_FIELD_ID]: String(user_id) });
            console.log(`[VK_OAUTH_SERVICE] ✅ VK ID ${user_id} записан в AmoCRM для Telegram ID ${telegram_user_id}`);
        } else {
            console.warn(`[VK_OAUTH_SERVICE] ⚠️ Контакт с Telegram ID ${telegram_user_id} не найден в AmoCRM.`);
        }

        return { success: true, message: 'Аккаунт VK успешно привязан!' };
    } catch (error) {
        console.error('[VK_OAUTH_SERVICE] ❌ Ошибка при обработке OAuth callback:', error);
        throw error;
    }
}

/**
 * Обменивает временный код на токен доступа.
 * @param {string} code - Временный код.
 * @returns {Promise<object>} Объект с токеном доступа и ID пользователя.
 */
async function getAccessToken(code) {
    const response = await axios.get('https://oauth.vk.com/access_token', {
        params: {
            client_id: VK_APP_ID,
            client_secret: VK_APP_SECRET,
            redirect_uri: VK_REDIRECT_URI,
            code,
        }
    });
    return response.data;
}

module.exports = {
    handleOAuthCallback,
};
