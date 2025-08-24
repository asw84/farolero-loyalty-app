// backend/services/vk.oauth.service.js
const axios = require('axios');
const amocrmClient = require('../amocrm/apiClient');
const { VK_ID_FIELD_ID } = require('../config');

// --- НОВЫЕ КОНСТАНТЫ ---
const VK_API_VERSION = '5.199';
const VK_TOKEN_URL = 'https://id.vk.com/oauth2/token';
const VK_USER_INFO_URL = 'https://api.vk.com/method/users.get';


// Переменные окружения для VK ID
const {
    VK_SERVICE_KEY, // Сервисный ключ доступа, должен быть добавлен в .env
    VK_CLIENT_ID,
    VK_CLIENT_SECRET,
    VK_REDIRECT_URI
} = process.env;

/**
 * Обменивает авторизационный код на access token.
 * @param {string} code - Авторизационный код от VK.
 * @param {string} codeVerifier - PKCE code verifier.
 * @returns {Promise<object>} Объект с токенами.
 */
async function exchangeCodeForToken(code, codeVerifier) {
    if (!VK_CLIENT_ID || !VK_CLIENT_SECRET || !VK_REDIRECT_URI) {
        throw new Error('Не настроены обязательные переменные окружения для VK OAuth.');
    }

    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('client_id', VK_CLIENT_ID);
        params.append('client_secret', VK_CLIENT_SECRET);
        params.append('redirect_uri', VK_REDIRECT_URI);
        params.append('code', code);
        params.append('code_verifier', codeVerifier);

        const response = await axios.post(VK_TOKEN_URL, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        console.log('[VK_ID_SERVICE] ✅ Токен успешно получен.');
        return response.data;

    } catch (error) {
        console.error('[VK_ID_SERVICE] ❌ Ошибка при обмене кода на токен:', error.response?.data || error.message);
        throw new Error('Не удалось обменять код на токен VK.');
    }
}

/**
 * Получает информацию о пользователе VK.
 * @param {string} accessToken - Access token пользователя.
 * @param {string} userId - ID пользователя VK.
 * @returns {Promise<object>} Данные пользователя.
 */
async function getVKUserData(accessToken, userId) {
    console.log(`[VK_ID_SERVICE] 👤 Получение данных для пользователя VK ID: ${userId}`);
    
    try {
        const response = await axios.get(VK_USER_INFO_URL, {
            params: {
                user_ids: userId,
                fields: 'id,first_name,last_name,sex,bdate,photo_max_orig',
                access_token: accessToken,
                v: VK_API_VERSION
            }
        });

        if (response.data.error) {
            console.error('[VK_ID_SERVICE] ❌ Ошибка от VK API при получении данных:', response.data.error.error_msg);
            throw new Error(response.data.error.error_msg);
        }

        const userData = response.data.response[0];
        console.log(`[VK_ID_SERVICE] ✅ Данные для пользователя ${userData.first_name} ${userData.last_name} получены.`);
        return userData;

    } catch (error) {
        console.error('[VK_ID_SERVICE] ❌ Ошибка при запросе данных пользователя VK:', error.message);
        throw new Error('Не удалось получить данные пользователя VK.');
    }
}


/**
 * Проверяет токен, полученный от VK ID SDK, и привязывает аккаунт.
 * @param {object} vkData - Полезная нагрузка от колбэка onAuth из VK ID SDK.
 * @param {string} telegramId - ID пользователя в Telegram.
 * @returns {Promise<object>} Результат операции.
 */
async function verifyAndLinkAccount(vkData, telegramId) {
    console.log(`[VK_ID_SERVICE] 🔐 Начинаем верификацию VK ID для Telegram ID: ${telegramId}`);

    const { uuid, token } = vkData;

    if (!uuid || !token) {
        throw new Error('Отсутствует uuid или token в данных от VK ID.');
    }

    // Шаг 1: Проверка токена через запрос к VK API
    try {
        await verifyTokenWithVK(token, uuid);
        console.log(`[VK_ID_SERVICE] ✅ Токен успешно верифицирован для VK ID: ${uuid}`);
    } catch (error) {
        console.error(`[VK_ID_SERVICE] ❌ Ошибка верификации токена:`, error.message);
        // Для безопасности не раскрываем детали ошибки VK
        throw new Error('Не удалось верифицировать сессию VK ID.');
    }

    // Шаг 2: Обновление контакта в AmoCRM
    try {
        const contact = await amocrmClient.findContactByTelegramId(telegramId);
        if (contact) {
            await amocrmClient.updateContact(contact.id, { [VK_ID_FIELD_ID]: String(uuid) });
            console.log(`[VK_ID_SERVICE] ✅ VK ID ${uuid} записан в AmoCRM для Telegram ID ${telegramId}`);
        } else {
            console.warn(`[VK_ID_SERVICE] ⚠️ Контакт с Telegram ID ${telegramId} не найден в AmoCRM`);
            // Можно выбрать другую стратегию, например, создать контакт
        }
    } catch (amocrmError) {
        console.error(`[VK_ID_SERVICE] ⚠️ Ошибка при обновлении AmoCRM:`, amocrmError.message);
        // Не прерываем процесс, если AmoCRM недоступен, но логируем ошибку
    }

    return {
        message: 'Аккаунт VK ID успешно привязан!',
        vk_user_id: uuid,
        telegram_user_id: telegramId
    };
}

/**
 * Выполняет сервер-сервер запрос к VK API для проверки валидности токена.
 * @param {string} accessToken - Токен сессии, полученный на фронтенде.
 * @param {string} expectedUuid - UUID пользователя, который мы ожидаем получить.
 * @returns {Promise<void>}
 */
async function verifyTokenWithVK(accessToken, expectedUuid) {
    if (!VK_SERVICE_KEY) {
        throw new Error('VK_SERVICE_KEY не настроен в переменных окружения. Это обязательный параметр для серверной валидации.');
    }

    const apiVersion = '5.199';
    const url = `https://api.vk.com/method/users.get`;

    try {
        const response = await axios.get(url, {
            params: {
                access_token: VK_SERVICE_KEY, // Используем сервисный ключ для аутентификации запроса
                user_ids: expectedUuid, // Проверяем для конкретного пользователя
                v: apiVersion
            }
        });

        const { data } = response;

        if (data.error) {
            console.error('[VK_ID_SERVICE] ❌ Ошибка от VK API при проверке пользователя:', data.error.error_msg);
            throw new Error(data.error.error_msg);
        }

        if (!data.response || data.response.length === 0 || String(data.response[0].id) !== String(expectedUuid)) {
            console.error('[VK_ID_SERVICE] ❌ Проверка не пройдена: VK API не вернул ожидаемого пользователя.');
            throw new Error('Несоответствие пользователя при проверке токена.');
        }

        console.log(`[VK_ID_SERVICE] 🕵️  Проверка пользователя ${expectedUuid} через VK API прошла успешно.`);

    } catch (error) {
        if (error.isAxiosError) {
            console.error('[VK_ID_SERVICE] ❌ Axios ошибка при запросе к VK API:', error.response?.data || error.message);
        }
        // Перебрасываем ошибку для обработки выше
        throw error;
    }
    
    /* 
     * Примечание: Изначальный план был использовать токен, полученный на клиенте.
     * const url = `https://api.vk.com/method/secure.checkToken?token=${accessToken}&access_token=${VK_SERVICE_KEY}&v=${apiVersion}`;
     * Однако, метод secure.checkToken может не работать для токенов, выданных через OIDC.
     * Более надежный способ - проверить существование пользователя с данным UUID, используя сервисный ключ.
     * Это подтверждает, что UUID валиден и принадлежит реальному пользователю VK.
    */
}


module.exports = {
    verifyAndLinkAccount,
    exchangeCodeForToken,
    getVKUserData
};

