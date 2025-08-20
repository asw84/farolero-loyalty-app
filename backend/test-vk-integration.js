// backend/test-vk-integration.js
// Тестирование и диагностика VK интеграции

require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const axios = require('axios');

console.log('🔵 === ДИАГНОСТИКА VK ИНТЕГРАЦИИ ===');
console.log('📅', new Date().toLocaleString());
console.log('');

// Проверка переменных окружения
console.log('⚙️  === ПРОВЕРКА КОНФИГУРАЦИИ VK ===');

const vkConfig = {
    CLIENT_ID: process.env.VK_CLIENT_ID,
    CLIENT_SECRET: process.env.VK_CLIENT_SECRET,
    REDIRECT_URI: process.env.VK_REDIRECT_URI,
    SERVICE_KEY: process.env.VK_SERVICE_KEY,
    GROUP_ID: process.env.VK_GROUP_ID,
    GROUP_TOKEN: process.env.VK_GROUP_TOKEN,
    JWT_SECRET: process.env.JWT_SECRET
};

let errors = 0;
let warnings = 0;

function logError(message) {
    console.log('❌', message);
    errors++;
}

function logWarning(message) {
    console.log('⚠️ ', message);
    warnings++;
}

function logSuccess(message) {
    console.log('✅', message);
}

function logInfo(message) {
    console.log('ℹ️ ', message);
}

// Проверяем основные параметры
if (vkConfig.CLIENT_ID && vkConfig.CLIENT_ID !== 'YOUR_VK_CLIENT_ID') {
    logSuccess(`VK_CLIENT_ID настроен: ${vkConfig.CLIENT_ID}`);
} else {
    logError('VK_CLIENT_ID не настроен или содержит placeholder');
}

if (vkConfig.CLIENT_SECRET && !vkConfig.CLIENT_SECRET.includes('REQUIRED')) {
    logSuccess('VK_CLIENT_SECRET настроен');
} else {
    logError('VK_CLIENT_SECRET не настроен (содержит REQUIRED)');
}

if (vkConfig.REDIRECT_URI && vkConfig.REDIRECT_URI.startsWith('https://')) {
    logSuccess(`VK_REDIRECT_URI настроен: ${vkConfig.REDIRECT_URI}`);
} else {
    logError('VK_REDIRECT_URI не настроен или некорректный');
}

if (vkConfig.JWT_SECRET && vkConfig.JWT_SECRET.length > 10) {
    logSuccess('JWT_SECRET настроен');
} else {
    logError('JWT_SECRET не настроен или слишком короткий');
}

// Проверяем опциональные параметры
if (vkConfig.SERVICE_KEY && !vkConfig.SERVICE_KEY.includes('REQUIRED')) {
    logSuccess('VK_SERVICE_KEY настроен');
} else {
    logWarning('VK_SERVICE_KEY не настроен (нужен для VK ID API)');
}

if (vkConfig.GROUP_ID && !vkConfig.GROUP_ID.includes('ID_СООБЩЕСТВА')) {
    logSuccess(`VK_GROUP_ID настроен: ${vkConfig.GROUP_ID}`);
} else {
    logWarning('VK_GROUP_ID не настроен (нужен для проверки активности в группе)');
}

if (vkConfig.GROUP_TOKEN && !vkConfig.GROUP_TOKEN.includes('ГРУППОВОЙ_ТОКЕН')) {
    logSuccess('VK_GROUP_TOKEN настроен');
} else {
    logWarning('VK_GROUP_TOKEN не настроен (нужен для проверки активности в группе)');
}

console.log('');
console.log('🌐 === ПРОВЕРКА ДОСТУПНОСТИ VK API ===');

// Тестируем доступность VK OAuth API
async function testVkOAuthAPI() {
    try {
        logInfo('Проверяем VK OAuth API...');
        const response = await axios.get('https://oauth.vk.com/authorize', {
            params: {
                client_id: '1', // Заведомо неверный ID для проверки доступности
                redirect_uri: 'https://example.com',
                response_type: 'code'
            },
            timeout: 10000,
            validateStatus: () => true // Принимаем любой статус
        });

        if (response.status === 200 || response.status === 400) {
            logSuccess('VK OAuth API доступен');
        } else {
            logWarning(`VK OAuth API вернул статус: ${response.status}`);
        }
    } catch (error) {
        logError(`VK OAuth API недоступен: ${error.message}`);
    }
}

// Тестируем VK API методы
async function testVkAPI() {
    try {
        logInfo('Проверяем VK API методы...');
        const response = await axios.get('https://api.vk.com/method/wall.get', {
            params: {
                v: '5.199',
                access_token: 'invalid_token', // Намеренно неверный токен
                owner_id: 1,
                count: 1
            },
            timeout: 10000
        });

        if (response.data && response.data.error && response.data.error.error_code === 5) {
            logSuccess('VK API доступен (ожидаемая ошибка авторизации)');
        } else {
            logWarning('VK API вернул неожиданный ответ');
        }
    } catch (error) {
        logError(`VK API недоступен: ${error.message}`);
    }
}

// Проверяем структуру URLs
function validateUrls() {
    console.log('');
    console.log('🔗 === ПРОВЕРКА URL СТРУКТУРЫ ===');

    if (vkConfig.REDIRECT_URI) {
        try {
            const url = new URL(vkConfig.REDIRECT_URI);
            logSuccess(`Redirect URI корректный: ${url.origin}${url.pathname}`);
            
            if (url.pathname.includes('/api/oauth/vk/callback')) {
                logSuccess('Путь redirect URI корректный');
            } else {
                logWarning('Путь redirect URI может быть некорректным');
            }
        } catch (error) {
            logError('Redirect URI имеет некорректный формат');
        }
    }

    // Проверяем соответствие домена в разных настройках
    const envDomain = process.env.APP_BASE_URL;
    if (envDomain && vkConfig.REDIRECT_URI) {
        try {
            const appUrl = new URL(envDomain);
            const redirectUrl = new URL(vkConfig.REDIRECT_URI);
            
            if (appUrl.origin === redirectUrl.origin) {
                logSuccess('Домены APP_BASE_URL и VK_REDIRECT_URI совпадают');
            } else {
                logWarning('Домены APP_BASE_URL и VK_REDIRECT_URI НЕ совпадают');
                logInfo(`APP_BASE_URL: ${appUrl.origin}`);
                logInfo(`VK_REDIRECT_URI: ${redirectUrl.origin}`);
            }
        } catch (error) {
            logWarning('Не удалось сравнить домены');
        }
    }
}

// Генерируем тестовые URLs
function generateTestUrls() {
    console.log('');
    console.log('🔧 === ТЕСТОВЫЕ URL ДЛЯ ПРОВЕРКИ ===');

    if (vkConfig.CLIENT_ID && vkConfig.REDIRECT_URI) {
        const testAuthUrl = new URL('https://oauth.vk.com/authorize');
        testAuthUrl.searchParams.set('client_id', vkConfig.CLIENT_ID);
        testAuthUrl.searchParams.set('redirect_uri', vkConfig.REDIRECT_URI);
        testAuthUrl.searchParams.set('response_type', 'code');
        testAuthUrl.searchParams.set('v', '5.199');
        testAuthUrl.searchParams.set('scope', process.env.VK_OAUTH_SCOPE || 'email');
        testAuthUrl.searchParams.set('state', 'test_state_123');

        console.log('🔗 Тестовый URL авторизации VK:');
        console.log(testAuthUrl.toString());
        console.log('');
        logInfo('Скопируйте этот URL в браузер для проверки авторизации VK');
    } else {
        logError('Не удалось сгенерировать тестовый URL - отсутствуют CLIENT_ID или REDIRECT_URI');
    }

    // URL для локального тестирования
    const localTestUrl = `http://localhost:3001/auth/vk/login?tg_user_id=test_user_123`;
    console.log('🏠 Локальный URL для тестирования:');
    console.log(localTestUrl);
    logInfo('Используйте этот URL для тестирования с локальным сервером');
}

// Рекомендации по исправлению
function generateRecommendations() {
    console.log('');
    console.log('💡 === РЕКОМЕНДАЦИИ ===');

    if (errors > 0) {
        console.log('❌ КРИТИЧЕСКИЕ ПРОБЛЕМЫ:');
        
        if (vkConfig.CLIENT_SECRET && vkConfig.CLIENT_SECRET.includes('REQUIRED')) {
            console.log('1. Получите VK_CLIENT_SECRET:');
            console.log('   - Зайдите в VK Developers: https://dev.vk.com/');
            console.log('   - Выберите ваше приложение');
            console.log('   - Скопируйте "Защищённый ключ"');
            console.log('   - Обновите VK_CLIENT_SECRET в .env');
        }

        if (!vkConfig.JWT_SECRET || vkConfig.JWT_SECRET.length < 10) {
            console.log('2. Сгенерируйте JWT_SECRET:');
            console.log('   - Используйте: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
            console.log('   - Или любой длинный случайный string');
        }
    }

    if (warnings > 0) {
        console.log('⚠️  ПРЕДУПРЕЖДЕНИЯ:');
        
        if (vkConfig.SERVICE_KEY && vkConfig.SERVICE_KEY.includes('REQUIRED')) {
            console.log('1. VK_SERVICE_KEY нужен для VK ID API');
            console.log('   - Получите в настройках VK приложения');
        }

        if (vkConfig.GROUP_ID && vkConfig.GROUP_ID.includes('ID_СООБЩЕСТВА')) {
            console.log('2. VK_GROUP_ID нужен для проверки активности в сообществе');
            console.log('   - Укажите ID вашей VK группы (только цифры)');
        }
    }

    console.log('');
    console.log('🚀 СЛЕДУЮЩИЕ ШАГИ:');
    console.log('1. Исправьте критические ошибки в .env');
    console.log('2. Перезапустите сервер');
    console.log('3. Протестируйте VK авторизацию');
    console.log('4. Проверьте callback обработку');
}

// Запускаем все проверки
async function runAllChecks() {
    validateUrls();
    await testVkOAuthAPI();
    await testVkAPI();
    generateTestUrls();
    generateRecommendations();

    console.log('');
    console.log('📊 === ИТОГОВЫЙ ОТЧЕТ ===');
    console.log(`✅ Успешных проверок: ${Math.max(0, 10 - errors - warnings)}`);
    console.log(`❌ Ошибок: ${errors}`);
    console.log(`⚠️  Предупреждений: ${warnings}`);

    const total = errors + warnings;
    if (total === 0) {
        console.log('🎉 VK интеграция полностью настроена!');
    } else if (errors === 0) {
        console.log('⚠️  VK интеграция частично настроена (есть предупреждения)');
    } else {
        console.log('❌ VK интеграция требует исправлений');
    }
}

runAllChecks().catch(error => {
    console.error('❌ Критическая ошибка диагностики:', error);
});
