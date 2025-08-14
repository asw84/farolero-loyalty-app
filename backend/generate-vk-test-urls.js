// backend/generate-vk-test-urls.js
// Генератор тестовых URL для VK интеграции

require('dotenv').config();
const jwt = require('jsonwebtoken');

console.log('🔵 === ГЕНЕРАТОР VK ТЕСТОВЫХ URL ===');
console.log('📅', new Date().toLocaleString());
console.log('');

const config = {
    CLIENT_ID: process.env.VK_CLIENT_ID,
    REDIRECT_URI: process.env.VK_REDIRECT_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    APP_BASE_URL: process.env.APP_BASE_URL || 'http://localhost:3001'
};

// Проверяем конфигурацию
if (!config.CLIENT_ID || !config.REDIRECT_URI || !config.JWT_SECRET) {
    console.error('❌ Отсутствуют обязательные переменные окружения');
    process.exit(1);
}

console.log('⚙️  Конфигурация:');
console.log(`   VK_CLIENT_ID: ${config.CLIENT_ID}`);
console.log(`   VK_REDIRECT_URI: ${config.REDIRECT_URI}`);
console.log(`   APP_BASE_URL: ${config.APP_BASE_URL}`);
console.log('');

// Функция генерации VK OAuth URL
function generateVkAuthUrl(telegramUserId, customState = null) {
    try {
        // Создаем JWT state
        const state = customState || jwt.sign(
            { tg_user_id: telegramUserId, timestamp: Date.now() }, 
            config.JWT_SECRET, 
            { expiresIn: '10m' }
        );

        // Создаем URL авторизации VK
        const authUrl = new URL('https://oauth.vk.com/authorize');
        authUrl.searchParams.set('client_id', config.CLIENT_ID);
        authUrl.searchParams.set('redirect_uri', config.REDIRECT_URI);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('v', '5.199');
        authUrl.searchParams.set('display', 'page');
        authUrl.searchParams.set('scope', 'offline');
        authUrl.searchParams.set('state', state);

        return { authUrl: authUrl.toString(), state };
    } catch (error) {
        console.error('❌ Ошибка генерации URL:', error.message);
        return null;
    }
}

// Генерируем тестовые URL
console.log('🔗 === ТЕСТОВЫЕ URL ===');

const testUsers = [
    'test_user_123',
    'demo_user_456', 
    'your_telegram_id'
];

testUsers.forEach((userId, index) => {
    console.log(`\n${index + 1}. Тестовый пользователь: ${userId}`);
    
    // Локальный endpoint инициации
    const localInitUrl = `${config.APP_BASE_URL}/auth/vk/login?tg_user_id=${userId}`;
    console.log(`   📱 Локальная инициация: ${localInitUrl}`);
    
    // Прямой VK OAuth URL
    const vkAuth = generateVkAuthUrl(userId);
    if (vkAuth) {
        console.log(`   🔵 Прямой VK OAuth:`);
        console.log(`   ${vkAuth.authUrl}`);
        console.log(`   🔑 State JWT: ${vkAuth.state}`);
    }
});

console.log('\n🧪 === СПЕЦИАЛЬНЫЕ ТЕСТОВЫЕ URL ===');

// URL с кастомными параметрами
console.log('\n1. Тест с минимальными правами:');
const minimalUrl = new URL('https://oauth.vk.com/authorize');
minimalUrl.searchParams.set('client_id', config.CLIENT_ID);
minimalUrl.searchParams.set('redirect_uri', config.REDIRECT_URI);
minimalUrl.searchParams.set('response_type', 'code');
minimalUrl.searchParams.set('scope', ''); // Минимальные права
minimalUrl.searchParams.set('state', 'minimal_test');
console.log(minimalUrl.toString());

// URL с расширенными правами
console.log('\n2. Тест с расширенными правами:');
const extendedUrl = new URL('https://oauth.vk.com/authorize');
extendedUrl.searchParams.set('client_id', config.CLIENT_ID);
extendedUrl.searchParams.set('redirect_uri', config.REDIRECT_URI);
extendedUrl.searchParams.set('response_type', 'code');
extendedUrl.searchParams.set('scope', 'offline,wall,groups'); // Расширенные права
extendedUrl.searchParams.set('state', 'extended_test');
console.log(extendedUrl.toString());

// Мобильная версия
console.log('\n3. Мобильная версия:');
const mobileUrl = new URL('https://oauth.vk.com/authorize');
mobileUrl.searchParams.set('client_id', config.CLIENT_ID);
mobileUrl.searchParams.set('redirect_uri', config.REDIRECT_URI);
mobileUrl.searchParams.set('response_type', 'code');
mobileUrl.searchParams.set('display', 'mobile');
mobileUrl.searchParams.set('scope', 'offline');
mobileUrl.searchParams.set('state', 'mobile_test');
console.log(mobileUrl.toString());

console.log('\n📋 === ИНСТРУКЦИИ ПО ТЕСТИРОВАНИЮ ===');
console.log('');
console.log('1. **Базовое тестирование:**');
console.log('   - Скопируйте любой "Локальная инициация" URL');
console.log('   - Откройте в браузере (при запущенном сервере)');
console.log('   - Проверьте редирект на VK');
console.log('');
console.log('2. **Прямое тестирование VK:**');
console.log('   - Скопируйте "Прямой VK OAuth" URL');
console.log('   - Откройте в браузере');
console.log('   - Пройдите авторизацию VK');
console.log('   - Проверьте callback на вашем сервере');
console.log('');
console.log('3. **Проверка callback:**');
console.log('   - После авторизации VK перенаправит на:');
console.log(`   ${config.REDIRECT_URI}?code=XXX&state=YYY`);
console.log('   - Убедитесь что endpoint обрабатывает этот запрос');
console.log('');
console.log('4. **Отладка ошибок:**');
console.log('   - Проверьте логи сервера');
console.log('   - Убедитесь что VK_CLIENT_SECRET настроен');
console.log('   - Проверьте что Redirect URI добавлен в VK приложении');

console.log('\n🔧 === ПОЛЕЗНЫЕ КОМАНДЫ ===');
console.log('');
console.log('# Проверка конфигурации:');
console.log('node test-vk-integration.js');
console.log('');
console.log('# Запуск сервера:');
console.log('node server.js');
console.log('');
console.log('# Проверка JWT токена:');
console.log('node -e "console.log(require(\'jsonwebtoken\').decode(\'JWT_TOKEN_HERE\'))"');

console.log('\n✅ Генерация завершена! Используйте URL выше для тестирования VK интеграции.');
