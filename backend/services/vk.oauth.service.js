// backend/services/vk.oauth.service.js

const axios = require('axios');
const { linkVkAccount } = require('../database');

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
        await linkVkAccount(telegram_user_id, String(user_id));

        console.log(`[VK_OAUTH_SERVICE] ✅ Успешно привязан VK-аккаунт ${user_id} к Telegram ID ${telegram_user_id}`);

        return { success: true, message: 'Аккаунт VK успешно привязан!' };

    } catch (error) {
        console.error('❌ [VK_OAUTH_SERVICE] Ошибка в процессе OAuth:', error.response ? error.response.data : error.message);
        throw new Error('Не удалось получить данные от VK.');
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
