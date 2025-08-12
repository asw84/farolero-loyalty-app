// Тестовый файл для проверки работы автообновления токена AmoCRM
const { getAuthorizedClient, findContactByTelegramId } = require('./amocrm/apiClient');

async function testAmoCRM() {
    try {
        console.log('🧪 Тестирование AmoCRM API клиента...');
        
        // Тест 1: Получение авторизованного клиента
        console.log('\n1. Тест получения авторизованного клиента...');
        const client = await getAuthorizedClient();
        console.log('✅ Авторизованный клиент успешно получен');
        
        // Тест 2: Получение списка пользователей
        console.log('\n2. Тест получения списка пользователей...');
        const usersResponse = await client.get('/api/v4/users');
        console.log(`✅ Получено ${usersResponse.data._embedded?.users?.length || 0} пользователей`);
        
        // Тест 3: Поиск контакта по Telegram ID (если есть TELEGRAM_ID_FIELD_ID в config)
        console.log('\n3. Тест поиска контакта по Telegram ID...');
        const testTelegramId = '123456789'; // Замените на реальный ID для теста
        const contact = await findContactByTelegramId(testTelegramId);
        if (contact) {
            console.log(`✅ Найден контакт: ${contact.name} (ID: ${contact.id})`);
        } else {
            console.log(`⚠️ Контакт с Telegram ID ${testTelegramId} не найден`);
        }
        
        console.log('\n🎉 Все тесты успешно пройдены!');
    } catch (error) {
        console.error('❌ Ошибка при тестировании:', error.message);
        console.error('Подробности:', error.response?.data || error);
    }
}

// Запуск теста
if (require.main === module) {
    testAmoCRM();
}

module.exports = { testAmoCRM };