// backend/telegram/telegramService.js

const TelegramBot = require('node-telegram-bot-api');

// --- ДАННЫЕ ОТ ЗАКАЗЧИКА ---
// API-токен бота, которого они создадут и добавят в админы канала
const BOT_TOKEN = '7776667511:AAEYkFi3WaLa3h320KUCchRggXPhwWSbjZ8'; 
// Username их публичного канала (включая @)
const CHANNEL_USERNAME = '@farolerotestchannel'; // Пример, нужно будет уточнить
// ----------------------------

// Инициализируем бота. `polling: false` означает, что бот не будет сам слушать сообщения,
// а будет использоваться только для отправки запросов к API.
const bot = new TelegramBot(BOT_TOKEN, { polling: false });

/**
 * Проверяет, является ли пользователь подписчиком указанного канала.
 * @param {string | number} userId - Telegram ID пользователя для проверки.
 * @returns {Promise<boolean>} - true, если пользователь подписан, иначе false.
 */
async function isUserSubscribed(userId) {
    if (BOT_TOKEN === 'ЗАМЕНИТЬ_НА_РЕАЛЬНЫЙ_ТОКЕН_БОТА') {
        console.error('[TelegramService] ❌ Ошибка: API-токен бота не установлен!');
        // Для тестов, пока нет токена, будем всегда возвращать true
        return true; 
    }
    
    try {
        const chatMember = await bot.getChatMember(CHANNEL_USERNAME, userId);
        
        // Статусы, которые считаются подпиской
        const validStatuses = ['member', 'administrator', 'creator'];
        
        if (chatMember && validStatuses.includes(chatMember.status)) {
            console.log(`[TelegramService] ✅ Пользователь ${userId} подписан на канал ${CHANNEL_USERNAME}. Статус: ${chatMember.status}.`);
            return true;
        } else {
            console.log(`[TelegramService] ⚠️ Пользователь ${userId} НЕ подписан на канал ${CHANNEL_USERNAME}. Статус: ${chatMember.status}.`);
            return false;
        }
    } catch (error) {
        // API Telegram может вернуть ошибку, если пользователь никогда не взаимодействовал с ботом или если бот не админ.
        // Мы трактуем любую ошибку как "не подписан".
        console.error(`[TelegramService] ❌ Ошибка при проверке подписки для ${userId} в канале ${CHANNEL_USERNAME}:`, error.response?.body || error.message);
        return false;
    }
}

module.exports = {
    isUserSubscribed
};