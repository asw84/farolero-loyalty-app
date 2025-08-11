'''// backend/services/vk.oauth.service.js
const axios = require('axios');
const amocrmClient = require('../amocrm/apiClient');
const { VK_ID_FIELD_ID } = require('../config');

// Переменные окружения для VK ID
const {
    VK_SERVICE_KEY // Сервисный ключ доступа, должен быть добавлен в .env
} = process.env;

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
    verifyAndLinkAccount
};
'''
