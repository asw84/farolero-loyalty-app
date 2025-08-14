// backend/utils/autodetect-fields.js
// Утилита для автоматического определения ID кастомных полей AmoCRM

const amocrmClient = require('../amocrm/apiClient');

/**
 * Автоматически определяет ID кастомных полей по их названиям
 * @param {string} entityType - тип сущности (contacts, leads, companies)
 * @returns {Promise<Object>} - объект с ID полей
 */
async function autodetectCustomFields(entityType = 'contacts') {
    try {
        console.log(`[AUTODETECT] 🔍 Поиск кастомных полей для ${entityType}...`);
        
        const client = await amocrmClient.getAuthorizedClient();
        const response = await client.get(`/api/v4/${entityType}/custom_fields`);
        
        const fields = response.data._embedded?.custom_fields || [];
        const fieldMap = {};
        
        // Ищем поля по названиям или кодам
        const searchPatterns = {
            'TELEGRAM_ID_FIELD_ID': ['telegram', 'telegram_id', 'телеграм', 'тг'],
            'POINTS_FIELD_ID': ['points', 'баллы', 'балл', 'очки', 'point'],
            'VK_ID_FIELD_ID': ['vk', 'vk_id', 'вк', 'вконтакте', 'vkontakte'],
            'INSTAGRAM_ID_FIELD_ID': ['instagram', 'instagram_id', 'инстаграм', 'инста', 'ig']
        };
        
        for (const [configKey, patterns] of Object.entries(searchPatterns)) {
            const field = fields.find(f => {
                const name = f.name.toLowerCase();
                const code = f.code?.toLowerCase() || '';
                return patterns.some(pattern => 
                    name.includes(pattern) || code.includes(pattern)
                );
            });
            
            if (field) {
                fieldMap[configKey] = field.id;
                console.log(`[AUTODETECT] ✅ Найдено поле "${field.name}" (ID: ${field.id}) для ${configKey}`);
            } else {
                console.log(`[AUTODETECT] ❌ Поле для ${configKey} не найдено среди паттернов: ${patterns.join(', ')}`);
            }
        }
        
        return fieldMap;
    } catch (error) {
        console.error('[AUTODETECT] ❌ Ошибка при автоопределении полей:', error.message);
        throw error;
    }
}

/**
 * Выводит все доступные кастомные поля для анализа
 */
async function listAllCustomFields(entityType = 'contacts') {
    try {
        const client = await amocrmClient.getAuthorizedClient();
        const response = await client.get(`/api/v4/${entityType}/custom_fields`);
        
        const fields = response.data._embedded?.custom_fields || [];
        
        console.log(`\n[AUTODETECT] 📋 Все кастомные поля для ${entityType}:`);
        console.log('─'.repeat(80));
        
        fields.forEach(field => {
            console.log(`ID: ${field.id} | Название: "${field.name}" | Тип: ${field.type} | Код: ${field.code || 'нет'}`);
        });
        
        console.log('─'.repeat(80));
        console.log(`Всего полей: ${fields.length}\n`);
        
        return fields;
    } catch (error) {
        console.error('[AUTODETECT] ❌ Ошибка при получении списка полей:', error.message);
        throw error;
    }
}

/**
 * Генерирует обновленный config.js с найденными ID
 */
async function generateUpdatedConfig() {
    try {
        const fieldMap = await autodetectCustomFields('contacts');
        
        console.log('\n[AUTODETECT] 🔧 Предлагаемая конфигурация для config.js:');
        console.log('─'.repeat(50));
        
        for (const [key, id] of Object.entries(fieldMap)) {
            console.log(`const ${key} = '${id}';`);
        }
        
        console.log('─'.repeat(50));
        
        return fieldMap;
    } catch (error) {
        console.error('[AUTODETECT] ❌ Ошибка при генерации конфигурации:', error.message);
        throw error;
    }
}

module.exports = {
    autodetectCustomFields,
    listAllCustomFields,
    generateUpdatedConfig
};

// Если файл запущен напрямую, выполняем автоопределение
if (require.main === module) {
    (async () => {
        try {
            await listAllCustomFields('contacts');
            await generateUpdatedConfig();
        } catch (error) {
            console.error('Не удалось выполнить автоопределение:', error.message);
            process.exit(1);
        }
    })();
}
