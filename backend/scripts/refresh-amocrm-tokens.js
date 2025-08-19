// backend/scripts/refresh-amocrm-tokens.js
// Скрипт для обновления токенов AmoCRM

require('dotenv').config();
const TokenManager = require('../utils/token-manager');
const amocrmClient = require('../amocrm/apiClient');

async function refreshTokens() {
    console.log('=== Обновление токенов AmoCRM ===');
    
    try {
        const tokenManager = TokenManager.getInstance('amocrm');
        
        // Получаем текущие токены
        const currentTokens = await tokenManager.getTokens();
        console.log('Текущие токены:');
        console.log('- access_token:', currentTokens.access_token ? 'Присутствует' : 'Отсутствует');
        console.log('- refresh_token:', currentTokens.refresh_token ? 'Присутствует' : 'Отсутствует');
        console.log('- created_at:', currentTokens.created_at);
        console.log('- expires_in:', currentTokens.expires_in);
        
        // Проверяем, есть ли refresh_token
        if (!currentTokens.refresh_token) {
            console.log('❌ Refresh token отсутствует. Необходимо пройти полную авторизацию.');
            console.log('Пожалуйста, перейдите на http://localhost:3001/api/amocrm/init');
            return false;
        }
        
        // Пробуем обновить токены
        console.log('🔄 Пробуем обновить токены...');
        const newAccessToken = await amocrmClient.refreshTokens();
        
        if (newAccessToken) {
            console.log('✅ Токены успешно обновлены!');
            
            // Проверяем обновленные токены
            const updatedTokens = await tokenManager.getTokens();
            console.log('Обновленные токены:');
            console.log('- access_token:', updatedTokens.access_token ? 'Присутствует' : 'Отсутствует');
            console.log('- refresh_token:', updatedTokens.refresh_token ? 'Присутствует' : 'Отсутствует');
            console.log('- created_at:', updatedTokens.created_at);
            console.log('- expires_in:', updatedTokens.expires_in);
            
            return true;
        } else {
            console.log('❌ Не удалось обновить токены');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Ошибка при обновлении токенов:', error.message);
        
        if (error.message.includes('refresh_token') || error.response?.data?.error === 'invalid_grant') {
            console.log('⚠️ Refresh token недействителен. Необходимо пройти полную авторизацию.');
            console.log('Пожалуйста, перейдите на http://localhost:3001/api/amocrm/init');
        }
        
        return false;
    }
}

// Запускаем обновление токенов
refreshTokens().then(success => {
    if (success) {
        console.log('✅ Обновление токенов завершено успешно');
        process.exit(0);
    } else {
        console.log('❌ Не удалось обновить токены');
        process.exit(1);
    }
}).catch(error => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
});