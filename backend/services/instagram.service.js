// backend/services/instagram.service.js

const axios = require('axios');
const { linkInstagramAccount } = require('../database');

const { INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET, INSTAGRAM_REDIRECT_URI } = process.env;

/**
 * Обрабатывает OAuth callback от Instagram.
 * @param {string} code - Временный код авторизации от Instagram.
 * @param {string} telegram_user_id - ID пользователя в Telegram, который инициировал процесс.
 * @returns {Promise<object>} Результат операции.
 */
async function handleOAuthCallback(code, telegram_user_id) {
    try {
        // 1. Обменять код на токен доступа
        const accessToken = await getAccessToken(code);

        // 2. Получить данные пользователя Instagram
        const instagramProfile = await getInstagramProfile(accessToken);

        // 3. Привязать аккаунт Instagram к пользователю Telegram в нашей БД
        await linkInstagramAccount(
            telegram_user_id,
            instagramProfile.id,
            instagramProfile.username
        );

        console.log(`[INSTAGRAM_SERVICE] ✅ Успешно привязан Instagram-аккаунт ${instagramProfile.username} к Telegram ID ${telegram_user_id}`);

        return { success: true, message: 'Аккаунт Instagram успешно привязан!' };

    } catch (error) {
        console.error('❌ [INSTAGRAM_SERVICE] Ошибка в процессе OAuth:', error.response ? error.response.data : error.message);
        throw new Error('Не удалось получить данные от Instagram.');
    }
}

/**
 * Обменивает временный код на долгосрочный токен доступа.
 * @param {string} code - Временный код.
 * @returns {Promise<string>} Токен доступа.
 */
async function getAccessToken(code) {
    const params = new URLSearchParams();
    params.append('client_id', INSTAGRAM_APP_ID);
    params.append('client_secret', INSTAGRAM_APP_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('redirect_uri', INSTAGRAM_REDIRECT_URI);
    params.append('code', code);

    const response = await axios.post('https://api.instagram.com/oauth/access_token', params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    return response.data.access_token;
}

/**
 * Получает профиль пользователя, используя токен доступа.
 * @param {string} accessToken - Токен доступа.
 * @returns {Promise<object>} Профиль пользователя (id, username).
 */
async function getInstagramProfile(accessToken) {
    const response = await axios.get('https://graph.instagram.com/me', {
        params: {
            fields: 'id,username',
            access_token: accessToken
        }
    });
    return response.data;
}

module.exports = {
    handleOAuthCallback,
};
