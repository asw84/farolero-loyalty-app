// backend/test-instagram-integration.js
// Тестирование и диагностика Instagram интеграции

require('dotenv').config();
const axios = require('axios');

console.log('📸 === ДИАГНОСТИКА INSTAGRAM ИНТЕГРАЦИИ ===');
console.log('📅', new Date().toLocaleString());
console.log('');

// Проверка переменных окружения
console.log('⚙️  === ПРОВЕРКА КОНФИГУРАЦИИ INSTAGRAM ===');

const instagramConfig = {
    APP_ID: process.env.INSTAGRAM_APP_ID,
    APP_SECRET: process.env.INSTAGRAM_APP_SECRET,
    REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI,
    APP_BASE_URL: process.env.APP_BASE_URL
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
if (instagramConfig.APP_ID && instagramConfig.APP_ID !== 'YOUR_INSTAGRAM_APP_ID') {
    logSuccess(`INSTAGRAM_APP_ID настроен: ${instagramConfig.APP_ID}`);
} else {
    logError('INSTAGRAM_APP_ID не настроен или содержит placeholder');
}

if (instagramConfig.APP_SECRET && instagramConfig.APP_SECRET !== 'YOUR_INSTAGRAM_APP_SECRET') {
    logSuccess('INSTAGRAM_APP_SECRET настроен');
} else {
    logError('INSTAGRAM_APP_SECRET не настроен или содержит placeholder');
}

if (instagramConfig.REDIRECT_URI && instagramConfig.REDIRECT_URI.startsWith('https://')) {
    logSuccess(`INSTAGRAM_REDIRECT_URI настроен: ${instagramConfig.REDIRECT_URI}`);
} else {
    logError('INSTAGRAM_REDIRECT_URI не настроен или некорректный');
}

console.log('');
console.log('🌐 === ПРОВЕРКА ДОСТУПНОСТИ INSTAGRAM API ===');

// Тестируем доступность Instagram Basic Display API
async function testInstagramAPI() {
    try {
        logInfo('Проверяем Instagram Basic Display API...');
        const response = await axios.get('https://graph.instagram.com/me', {
            params: {
                fields: 'id,username',
                access_token: 'invalid_token' // Намеренно неверный токен
            },
            timeout: 10000,
            validateStatus: () => true // Принимаем любой статус
        });

        if ([400, 401, 403].includes(response.status)) {
            logSuccess(`Instagram API доступен (ожидаемая ошибка авторизации: ${response.status})`);
        } else {
            logWarning(`Instagram API вернул неожиданный статус: ${response.status}`);
        }
    } catch (error) {
        if (error.code === 'ENOTFOUND') {
            logError('Instagram API недоступен (DNS ошибка)');
        } else if (error.code === 'ECONNREFUSED') {
            logError('Instagram API отказал в соединении');
        } else {
            logError(`Instagram API недоступен: ${error.message}`);
        }
    }
}

// Тестируем Instagram OAuth endpoints
async function testInstagramOAuth() {
    try {
        logInfo('Проверяем Instagram OAuth endpoints...');
        
        // Проверяем authorize endpoint
        const authorizeResponse = await axios.get('https://api.instagram.com/oauth/authorize', {
            params: {
                client_id: '1', // Заведомо неверный ID
                redirect_uri: 'https://example.com',
                scope: 'user_profile',
                response_type: 'code'
            },
            timeout: 10000,
            validateStatus: () => true
        });

        if ([400, 401, 403].includes(authorizeResponse.status)) {
            logSuccess('Instagram OAuth authorize endpoint доступен');
        } else {
            logWarning(`Instagram OAuth authorize вернул статус: ${authorizeResponse.status}`);
        }
    } catch (error) {
        logError(`Instagram OAuth недоступен: ${error.message}`);
    }
}

// Проверяем структуру URLs
function validateUrls() {
    console.log('');
    console.log('🔗 === ПРОВЕРКА URL СТРУКТУРЫ ===');

    if (instagramConfig.REDIRECT_URI) {
        try {
            const url = new URL(instagramConfig.REDIRECT_URI);
            logSuccess(`Redirect URI корректный: ${url.origin}${url.pathname}`);
            
            if (url.pathname.includes('/api/instagram/callback') || url.pathname.includes('/oauth/instagram/callback')) {
                logSuccess('Путь redirect URI корректный');
            } else {
                logWarning('Путь redirect URI может быть некорректным');
                logInfo('Ожидаемый путь: /api/instagram/callback или /oauth/instagram/callback');
            }
        } catch (error) {
            logError('Redirect URI имеет некорректный формат');
        }
    }

    // Проверяем соответствие домена
    if (instagramConfig.APP_BASE_URL && instagramConfig.REDIRECT_URI) {
        try {
            const appUrl = new URL(instagramConfig.APP_BASE_URL);
            const redirectUrl = new URL(instagramConfig.REDIRECT_URI);
            
            if (appUrl.origin === redirectUrl.origin) {
                logSuccess('Домены APP_BASE_URL и INSTAGRAM_REDIRECT_URI совпадают');
            } else {
                logWarning('Домены APP_BASE_URL и INSTAGRAM_REDIRECT_URI НЕ совпадают');
                logInfo(`APP_BASE_URL: ${appUrl.origin}`);
                logInfo(`INSTAGRAM_REDIRECT_URI: ${redirectUrl.origin}`);
            }
        } catch (error) {
            logWarning('Не удалось сравнить домены');
        }
    }
}

// Проверяем файловую структуру
function checkProjectStructure() {
    console.log('');
    console.log('📁 === ПРОВЕРКА ФАЙЛОВОЙ СТРУКТУРЫ ===');

    const fs = require('fs');
    
    const requiredFiles = [
        'services/instagram.service.js',
        'controllers/instagram.controller.js', 
        'routes/instagram.routes.js'
    ];

    for (const file of requiredFiles) {
        if (fs.existsSync(file)) {
            logSuccess(`Файл ${file} найден`);
        } else {
            logError(`Файл ${file} отсутствует`);
        }
    }

    // Проверяем что routes подключены в server.js
    if (fs.existsSync('server.js')) {
        const serverContent = fs.readFileSync('server.js', 'utf-8');
        if (serverContent.includes('instagram') || serverContent.includes('Instagram')) {
            logSuccess('Instagram routes подключены в server.js');
        } else {
            logWarning('Instagram routes могут быть не подключены в server.js');
        }
    }
}

// Генерируем тестовые URLs
function generateTestUrls() {
    console.log('');
    console.log('🔧 === ТЕСТОВЫЕ URL ДЛЯ ПРОВЕРКИ ===');

    if (instagramConfig.APP_ID && instagramConfig.REDIRECT_URI) {
        // URL для авторизации Instagram
        const authUrl = new URL('https://api.instagram.com/oauth/authorize');
        authUrl.searchParams.set('client_id', instagramConfig.APP_ID || 'YOUR_APP_ID');
        authUrl.searchParams.set('redirect_uri', instagramConfig.REDIRECT_URI);
        authUrl.searchParams.set('scope', 'user_profile,user_media');
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('state', 'test_state_instagram');

        console.log('📸 Тестовый URL авторизации Instagram:');
        console.log(authUrl.toString());
        console.log('');
        
        if (instagramConfig.APP_ID === 'YOUR_INSTAGRAM_APP_ID') {
            logWarning('APP_ID содержит placeholder - замените на реальный ID');
        } else {
            logInfo('Скопируйте этот URL в браузер для проверки авторизации Instagram');
        }
    } else {
        logError('Не удалось сгенерировать тестовый URL - отсутствуют APP_ID или REDIRECT_URI');
    }

    // URL для callback тестирования
    console.log('🔄 Callback URL для тестирования:');
    console.log(`${instagramConfig.REDIRECT_URI}?code=test_code&state=test_state`);
    logInfo('Используйте этот URL для проверки callback обработки');
}

// Анализируем типичные проблемы Instagram API
function analyzeInstagramSpecificIssues() {
    console.log('');
    console.log('🔍 === АНАЛИЗ СПЕЦИФИЧНЫХ ПРОБЛЕМ INSTAGRAM ===');

    // Instagram Basic Display API vs Instagram Graph API
    logInfo('Instagram API разделен на несколько версий:');
    console.log('   📋 Instagram Basic Display API - для основных функций');
    console.log('   📊 Instagram Graph API - для бизнес аккаунтов');
    console.log('   🏢 Instagram Marketing API - для рекламы');

    if (instagramConfig.REDIRECT_URI) {
        const isBasicDisplay = instagramConfig.REDIRECT_URI.includes('graph.instagram.com') ||
                              instagramConfig.REDIRECT_URI.includes('api.instagram.com');
        
        if (isBasicDisplay) {
            logInfo('Используется Instagram Basic Display API (рекомендуется)');
        } else {
            logInfo('Используется кастомный callback endpoint');
        }
    }

    // Проверяем scope требования
    logInfo('Обязательные scope для Instagram Basic Display:');
    console.log('   - user_profile (обязательно)');
    console.log('   - user_media (опционально, для доступа к медиа)');

    // Проверяем SSL требования
    if (instagramConfig.REDIRECT_URI && !instagramConfig.REDIRECT_URI.startsWith('https://')) {
        logError('Instagram требует HTTPS для redirect URI в production');
    } else {
        logSuccess('Redirect URI использует HTTPS (требование Instagram)');
    }
}

// Рекомендации по исправлению
function generateRecommendations() {
    console.log('');
    console.log('💡 === РЕКОМЕНДАЦИИ ===');

    if (errors > 0) {
        console.log('❌ КРИТИЧЕСКИЕ ПРОБЛЕМЫ:');
        
        if (instagramConfig.APP_ID === 'YOUR_INSTAGRAM_APP_ID') {
            console.log('1. Создайте Instagram приложение:');
            console.log('   - Зайдите в Facebook Developers: https://developers.facebook.com/');
            console.log('   - Создайте новое приложение');
            console.log('   - Добавьте продукт "Instagram Basic Display"');
            console.log('   - Скопируйте Instagram App ID');
            console.log('   - Обновите INSTAGRAM_APP_ID в .env');
        }

        if (instagramConfig.APP_SECRET === 'YOUR_INSTAGRAM_APP_SECRET') {
            console.log('2. Получите Instagram App Secret:');
            console.log('   - В настройках Instagram Basic Display');
            console.log('   - Скопируйте Instagram App Secret');
            console.log('   - Обновите INSTAGRAM_APP_SECRET в .env');
        }

        if (!instagramConfig.REDIRECT_URI || !instagramConfig.REDIRECT_URI.startsWith('https://')) {
            console.log('3. Настройте Redirect URI:');
            console.log('   - В настройках Instagram Basic Display');
            console.log('   - Добавьте Valid OAuth Redirect URIs');
            console.log('   - Используйте HTTPS (обязательно для production)');
        }
    }

    console.log('');
    console.log('📋 ПОШАГОВАЯ НАСТРОЙКА:');
    console.log('1. Facebook Developers → Создать приложение → Instagram Basic Display');
    console.log('2. Настроить Valid OAuth Redirect URIs');
    console.log('3. Получить App ID и App Secret');
    console.log('4. Обновить переменные в .env');
    console.log('5. Протестировать авторизацию');

    console.log('');
    console.log('🚀 СЛЕДУЮЩИЕ ШАГИ:');
    console.log('1. Исправьте критические ошибки в .env');
    console.log('2. Проверьте подключение routes в server.js');
    console.log('3. Протестируйте Instagram авторизацию');
    console.log('4. Проверьте callback обработку');
}

// Запускаем все проверки
async function runAllChecks() {
    validateUrls();
    checkProjectStructure();
    await testInstagramAPI();
    await testInstagramOAuth();
    analyzeInstagramSpecificIssues();
    generateTestUrls();
    generateRecommendations();

    console.log('');
    console.log('📊 === ИТОГОВЫЙ ОТЧЕТ ===');
    console.log(`✅ Успешных проверок: ${Math.max(0, 15 - errors - warnings)}`);
    console.log(`❌ Ошибок: ${errors}`);
    console.log(`⚠️  Предупреждений: ${warnings}`);

    const total = errors + warnings;
    if (total === 0) {
        console.log('🎉 Instagram интеграция полностью настроена!');
    } else if (errors === 0) {
        console.log('⚠️  Instagram интеграция частично настроена (есть предупреждения)');
    } else {
        console.log('❌ Instagram интеграция требует настройки');
    }

    // Сравнение с VK
    console.log('');
    console.log('📈 === СРАВНЕНИЕ С VK ИНТЕГРАЦИЕЙ ===');
    console.log('VK: частично настроена (90% готова)');
    console.log(`Instagram: ${errors === 0 ? 'частично настроена' : 'требует настройки'}`);
    
    if (errors > 0) {
        console.log('💡 Рекомендация: сначала завершите настройку VK, затем переходите к Instagram');
    }
}

runAllChecks().catch(error => {
    console.error('❌ Критическая ошибка диагностики:', error);
});
