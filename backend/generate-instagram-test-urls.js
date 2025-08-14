// backend/generate-instagram-test-urls.js
// Генератор тестовых URL для Instagram интеграции

require('dotenv').config();

console.log('📸 === ГЕНЕРАТОР INSTAGRAM ТЕСТОВЫХ URL ===');
console.log('📅', new Date().toLocaleString());
console.log('');

const config = {
    APP_ID: process.env.INSTAGRAM_APP_ID,
    REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI,
    APP_BASE_URL: process.env.APP_BASE_URL || 'http://localhost:3001'
};

// Проверяем конфигурацию
console.log('⚙️  Конфигурация:');
console.log(`   INSTAGRAM_APP_ID: ${config.APP_ID}`);
console.log(`   INSTAGRAM_REDIRECT_URI: ${config.REDIRECT_URI}`);
console.log(`   APP_BASE_URL: ${config.APP_BASE_URL}`);
console.log('');

// Функция генерации Instagram OAuth URL
function generateInstagramAuthUrl(telegramUserId, customScope = null) {
    try {
        // Создаем state с telegram user id
        const state = JSON.stringify({ telegram_user_id: telegramUserId });

        // Создаем URL авторизации Instagram
        const authUrl = new URL('https://api.instagram.com/oauth/authorize');
        authUrl.searchParams.set('client_id', config.APP_ID || 'YOUR_APP_ID');
        authUrl.searchParams.set('redirect_uri', config.REDIRECT_URI);
        authUrl.searchParams.set('scope', customScope || 'user_profile,user_media');
        authUrl.searchParams.set('response_type', 'code');
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
    const localInitUrl = `${config.APP_BASE_URL}/auth/instagram/login?tg_user_id=${userId}`;
    console.log(`   📱 Локальная инициация: ${localInitUrl}`);
    
    // Прямой Instagram OAuth URL
    const instagramAuth = generateInstagramAuthUrl(userId);
    if (instagramAuth) {
        console.log(`   📸 Прямой Instagram OAuth:`);
        console.log(`   ${instagramAuth.authUrl}`);
        console.log(`   🔑 State JSON: ${instagramAuth.state}`);
    }
});

console.log('\n🧪 === СПЕЦИАЛЬНЫЕ ТЕСТОВЫЕ URL ===');

// URL с минимальными правами
console.log('\n1. Тест с минимальными правами (только профиль):');
const minimalAuth = generateInstagramAuthUrl('minimal_test', 'user_profile');
if (minimalAuth) {
    console.log(minimalAuth.authUrl);
}

// URL с расширенными правами
console.log('\n2. Тест с расширенными правами (профиль + медиа):');
const extendedAuth = generateInstagramAuthUrl('extended_test', 'user_profile,user_media');
if (extendedAuth) {
    console.log(extendedAuth.authUrl);
}

console.log('\n📋 === ИНСТРУКЦИИ ПО ТЕСТИРОВАНИЮ ===');
console.log('');

if (config.APP_ID === 'YOUR_INSTAGRAM_APP_ID') {
    console.log('⚠️  ВНИМАНИЕ: Instagram приложение не настроено!');
    console.log('');
    console.log('📋 ДЛЯ НАЧАЛА РАБОТЫ:');
    console.log('1. Зайдите в Facebook Developers: https://developers.facebook.com/');
    console.log('2. Создайте приложение и добавьте Instagram Basic Display');
    console.log('3. Получите App ID и App Secret');
    console.log('4. Обновите INSTAGRAM_APP_ID и INSTAGRAM_APP_SECRET в .env');
    console.log('5. Повторно запустите этот скрипт');
} else {
    console.log('1. **Базовое тестирование:**');
    console.log('   - Скопируйте любой "Локальная инициация" URL');
    console.log('   - Откройте в браузере (при запущенном сервере)');
    console.log('   - Проверьте редирект на Instagram');
    console.log('');
    console.log('2. **Прямое тестирование Instagram:**');
    console.log('   - Скопируйте "Прямой Instagram OAuth" URL');
    console.log('   - Откройте в браузере');
    console.log('   - Пройдите авторизацию Instagram');
    console.log('   - Проверьте callback на вашем сервере');
    console.log('');
    console.log('3. **Проверка callback:**');
    console.log('   - После авторизации Instagram перенаправит на:');
    console.log(`   ${config.REDIRECT_URI}?code=XXX&state=YYY`);
    console.log('   - Убедитесь что endpoint обрабатывает этот запрос');
}

console.log('');
console.log('4. **Отладка ошибок:**');
console.log('   - Проверьте логи сервера');
console.log('   - Убедитесь что INSTAGRAM_APP_SECRET настроен');
console.log('   - Проверьте что Redirect URI добавлен в Instagram приложении');

console.log('');
console.log('🔧 === ПОЛЕЗНЫЕ КОМАНДЫ ===');
console.log('');
console.log('# Проверка конфигурации:');
console.log('node test-instagram-integration.js');
console.log('');
console.log('# Запуск сервера:');
console.log('node server.js');
console.log('');
console.log('# Проверка состояния Instagram App:');
console.log('curl "https://graph.instagram.com/me?fields=id,username&access_token=YOUR_TOKEN"');

console.log('');
console.log('📚 === ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ ===');
console.log('');
console.log('Instagram Basic Display API scope:');
console.log('- user_profile: доступ к базовому профилю (ID, username)');
console.log('- user_media: доступ к медиа контенту пользователя');
console.log('');
console.log('Ограничения:');
console.log('- Instagram требует HTTPS для production');
console.log('- Redirect URI должен быть точно настроен в приложении');
console.log('- Токены доступа действуют 60 дней для Basic Display API');

console.log('');
console.log('🎯 === СТАТУС ГОТОВНОСТИ ===');

let readinessScore = 0;
if (config.APP_ID && config.APP_ID !== 'YOUR_INSTAGRAM_APP_ID') readinessScore += 40;
if (config.REDIRECT_URI && config.REDIRECT_URI.startsWith('https://')) readinessScore += 30;
if (config.APP_ID !== 'YOUR_INSTAGRAM_APP_ID') readinessScore += 30; // Предполагаем что SECRET тоже настроен

console.log(`Instagram интеграция готова на: ${readinessScore}%`);

if (readinessScore >= 70) {
    console.log('✅ Готово к тестированию!');
} else if (readinessScore >= 30) {
    console.log('⚠️  Частично готово - нужна настройка credentials');
} else {
    console.log('❌ Требует полной настройки');
}

console.log('');
console.log('✅ Генерация завершена! Используйте URL выше для тестирования Instagram интеграции.');
