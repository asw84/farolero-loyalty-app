#!/usr/bin/env node
// backend/scripts/monitor-amocrm.js
// Мониторинг состояния токенов AmoCRM

require('dotenv').config();
const { restoreTokens } = require('./restore-amocrm-tokens');

async function monitorAmoCRM() {
    try {
        console.log('🔍 [MONITOR] Проверка состояния AmoCRM токенов...');
        
        const amocrmClient = require('../amocrm/apiClient');
        const client = await amocrmClient.getAuthorizedClient();
        const response = await client.get('/api/v4/account');
        
        console.log('✅ [MONITOR] AmoCRM токены работают корректно');
        console.log(`📊 [MONITOR] Аккаунт: ${response.data.name}`);
        
        // Отправляем уведомление в Telegram (если настроен)
        if (process.env.TELEGRAM_MONITOR_CHAT_ID && process.env.TELEGRAM_BOT_TOKEN) {
            const message = `✅ AmoCRM Status OK\nАккаунт: ${response.data.name}\nВремя: ${new Date().toLocaleString()}`;
            await sendTelegramNotification(message);
        }
        
    } catch (error) {
        console.error('❌ [MONITOR] Ошибка в AmoCRM токенах:', error.message);
        
        // Уведомление об ошибке
        if (process.env.TELEGRAM_MONITOR_CHAT_ID && process.env.TELEGRAM_BOT_TOKEN) {
            const message = `🚨 AmoCRM ERROR\nОшибка: ${error.message}\nВремя: ${new Date().toLocaleString()}\n\nТребуется восстановление токенов!`;
            await sendTelegramNotification(message);
        }
        
        // Пытаемся автоматически восстановить
        try {
            console.log('🔄 [MONITOR] Попытка автоматического восстановления...');
            await restoreTokens();
        } catch (restoreError) {
            console.error('❌ [MONITOR] Автоматическое восстановление не удалось:', restoreError.message);
        }
    }
}

async function sendTelegramNotification(message) {
    try {
        const axios = require('axios');
        const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
        
        await axios.post(url, {
            chat_id: process.env.TELEGRAM_MONITOR_CHAT_ID,
            text: message,
            parse_mode: 'HTML'
        });
        
        console.log('📱 [MONITOR] Уведомление отправлено в Telegram');
    } catch (error) {
        console.error('❌ [MONITOR] Ошибка отправки уведомления:', error.message);
    }
}

// Запускаем если вызван напрямую
if (require.main === module) {
    monitorAmoCRM().then(() => {
        process.exit(0);
    }).catch((error) => {
        console.error('❌ [MONITOR] Критическая ошибка:', error);
        process.exit(1);
    });
}

module.exports = { monitorAmoCRM };
