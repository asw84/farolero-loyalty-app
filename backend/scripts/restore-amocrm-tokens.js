#!/usr/bin/env node
// backend/scripts/restore-amocrm-tokens.js

require('dotenv').config();
const amocrmClient = require('../amocrm/apiClient');

async function restoreTokens() {
    try {
        console.log('🔄 [RESTORE] Проверяем состояние токенов AmoCRM...');
        
        // Пробуем использовать существующие токены
        try {
            const client = await amocrmClient.getAuthorizedClient();
            const response = await client.get('/api/v4/account');
            console.log('✅ [RESTORE] Токены работают! Аккаунт:', response.data.name);
            return;
        } catch (error) {
            console.log('⚠️ [RESTORE] Токены не работают, попытка восстановления...');
        }

        // Пытаемся восстановить через refresh_token из .env
        if (process.env.AMOCRM_REFRESH_TOKEN) {
            console.log('🔄 [RESTORE] Пытаемся восстановить через AMOCRM_REFRESH_TOKEN...');
            try {
                await amocrmClient.getInitialToken();
                console.log('✅ [RESTORE] Токены восстановлены через refresh_token!');
                return;
            } catch (error) {
                console.log('❌ [RESTORE] Не удалось восстановить через refresh_token');
            }
        }

        // Если автоматически не получилось - показываем инструкции
        console.log('\n🚨 [RESTORE] ТРЕБУЕТСЯ РУЧНОЕ ВОССТАНОВЛЕНИЕ:');
        console.log('1. Откройте AmoCRM → Настройки → Интеграции');
        console.log('2. Сгенерируйте новый код авторизации');
        console.log('3. Обновите auth_code в amocrm.json');
        console.log('4. Временно измените функцию init в контроллере');
        console.log('5. Перейдите на /api/amocrm/init');
        console.log('6. Верните функцию init к исходному виду\n');
        
        console.log('Или используйте admin endpoint:');
        console.log(`https://your-domain.com/admin/amocrm/reauth?secret=${process.env.ADMIN_SECRET_KEY}`);

    } catch (error) {
        console.error('❌ [RESTORE] Критическая ошибка:', error);
        process.exit(1);
    }
}

// Запускаем если вызван напрямую
if (require.main === module) {
    restoreTokens();
}

module.exports = { restoreTokens };
