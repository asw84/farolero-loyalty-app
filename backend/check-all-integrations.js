// backend/check-all-integrations.js
// Комплексная проверка всех интеграций одной командой

require('dotenv').config();

console.log('🔍 === КОМПЛЕКСНАЯ ПРОВЕРКА ВСЕХ ИНТЕГРАЦИЙ ===');
console.log('📅', new Date().toLocaleString());
console.log('');

// Счетчики статуса
let totalChecks = 0;
let passedChecks = 0;
let warnings = 0;
let errors = 0;

function logSuccess(message) {
    console.log('✅', message);
    passedChecks++;
    totalChecks++;
}

function logWarning(message) {
    console.log('⚠️ ', message);
    warnings++;
    totalChecks++;
}

function logError(message) {
    console.log('❌', message);
    errors++;
    totalChecks++;
}

function logInfo(message) {
    console.log('ℹ️ ', message);
}

// 1. ПРОВЕРКА ОСНОВНОЙ КОНФИГУРАЦИИ
console.log('🔧 === ОСНОВНАЯ КОНФИГУРАЦИЯ ===');

const mainConfig = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    APP_BASE_URL: process.env.APP_BASE_URL,
    JWT_SECRET: process.env.JWT_SECRET
};

if (mainConfig.APP_BASE_URL) {
    logSuccess(`APP_BASE_URL: ${mainConfig.APP_BASE_URL}`);
} else {
    logError('APP_BASE_URL не настроен');
}

if (mainConfig.JWT_SECRET && mainConfig.JWT_SECRET.length > 10) {
    logSuccess('JWT_SECRET настроен');
} else {
    logError('JWT_SECRET не настроен или слишком короткий');
}

// 2. ПРОВЕРКА AMOCRM
console.log('');
console.log('🏢 === AMOCRM ИНТЕГРАЦИЯ ===');

const amocrmConfig = {
    DOMAIN: process.env.AMOCRM_DOMAIN,
    CLIENT_ID: process.env.AMOCRM_CLIENT_ID,
    CLIENT_SECRET: process.env.AMOCRM_CLIENT_SECRET,
    REFRESH_TOKEN: process.env.AMOCRM_REFRESH_TOKEN
};

let amocrmScore = 0;
if (amocrmConfig.DOMAIN && amocrmConfig.DOMAIN.includes('amocrm.ru')) {
    logSuccess(`AmoCRM Domain: ${amocrmConfig.DOMAIN}`);
    amocrmScore += 25;
} else {
    logError('AMOCRM_DOMAIN не настроен');
}

if (amocrmConfig.CLIENT_ID) {
    logSuccess('AMOCRM_CLIENT_ID настроен');
    amocrmScore += 25;
} else {
    logError('AMOCRM_CLIENT_ID не настроен');
}

if (amocrmConfig.CLIENT_SECRET) {
    logSuccess('AMOCRM_CLIENT_SECRET настроен');
    amocrmScore += 25;
} else {
    logError('AMOCRM_CLIENT_SECRET не настроен');
}

if (amocrmConfig.REFRESH_TOKEN && amocrmConfig.REFRESH_TOKEN.length > 50) {
    logSuccess('AMOCRM_REFRESH_TOKEN настроен');
    amocrmScore += 25;
} else {
    logWarning('AMOCRM_REFRESH_TOKEN не настроен (можно получить через /auth/setup)');
}

console.log(`🏢 AmoCRM готовность: ${amocrmScore}%`);

// 3. ПРОВЕРКА VK
console.log('');
console.log('🔵 === VK ИНТЕГРАЦИЯ ===');

const vkConfig = {
    CLIENT_ID: process.env.VK_CLIENT_ID,
    CLIENT_SECRET: process.env.VK_CLIENT_SECRET,
    REDIRECT_URI: process.env.VK_REDIRECT_URI,
    SERVICE_KEY: process.env.VK_SERVICE_KEY
};

let vkScore = 0;
if (vkConfig.CLIENT_ID && vkConfig.CLIENT_ID !== 'YOUR_VK_CLIENT_ID') {
    logSuccess(`VK_CLIENT_ID: ${vkConfig.CLIENT_ID}`);
    vkScore += 40;
} else {
    logError('VK_CLIENT_ID не настроен');
}

if (vkConfig.CLIENT_SECRET && !vkConfig.CLIENT_SECRET.includes('REQUIRED')) {
    logSuccess('VK_CLIENT_SECRET настроен');
    vkScore += 40;
} else {
    logError('VK_CLIENT_SECRET не настроен (placeholder)');
}

if (vkConfig.REDIRECT_URI && vkConfig.REDIRECT_URI.startsWith('https://')) {
    logSuccess(`VK_REDIRECT_URI настроен`);
    vkScore += 20;
} else {
    logError('VK_REDIRECT_URI не настроен');
}

if (vkConfig.SERVICE_KEY && !vkConfig.SERVICE_KEY.includes('REQUIRED')) {
    logWarning('VK_SERVICE_KEY настроен (опционально)');
} else {
    logWarning('VK_SERVICE_KEY не настроен (опционально для VK ID API)');
}

console.log(`🔵 VK готовность: ${vkScore}%`);

// 4. ПРОВЕРКА INSTAGRAM
console.log('');
console.log('📸 === INSTAGRAM ИНТЕГРАЦИЯ ===');

const instagramConfig = {
    APP_ID: process.env.INSTAGRAM_APP_ID,
    APP_SECRET: process.env.INSTAGRAM_APP_SECRET,
    REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI
};

let instagramScore = 0;
if (instagramConfig.APP_ID && instagramConfig.APP_ID !== 'YOUR_FACEBOOK_APP_ID') {
    logSuccess(`INSTAGRAM_APP_ID настроен (Facebook App ID)`);
    instagramScore += 40;
} else {
    logError('INSTAGRAM_APP_ID не настроен (placeholder)');
}

if (instagramConfig.APP_SECRET && instagramConfig.APP_SECRET !== 'YOUR_FACEBOOK_APP_SECRET') {
    logSuccess('INSTAGRAM_APP_SECRET настроен (Facebook App Secret)');
    instagramScore += 40;
} else {
    logError('INSTAGRAM_APP_SECRET не настроен (placeholder)');
}

if (instagramConfig.REDIRECT_URI && instagramConfig.REDIRECT_URI.startsWith('https://')) {
    logSuccess('INSTAGRAM_REDIRECT_URI настроен');
    instagramScore += 20;
} else {
    logError('INSTAGRAM_REDIRECT_URI не настроен');
}

console.log(`📸 Instagram готовность: ${instagramScore}%`);

// 5. ПРОВЕРКА TELEGRAM
console.log('');
console.log('📱 === TELEGRAM BOT ===');

const telegramConfig = {
    BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN
};

let telegramScore = 0;
if (telegramConfig.BOT_TOKEN && 
    telegramConfig.BOT_TOKEN !== 'your_bot_token_here' && 
    telegramConfig.BOT_TOKEN.includes(':')) {
    logSuccess('TELEGRAM_BOT_TOKEN настроен');
    telegramScore = 100;
} else {
    logWarning('TELEGRAM_BOT_TOKEN не настроен (опционально)');
}

console.log(`📱 Telegram готовность: ${telegramScore}%`);

// 6. ПРОВЕРКА ФАЙЛОВОЙ СТРУКТУРЫ
console.log('');
console.log('📁 === ФАЙЛОВАЯ СТРУКТУРА ===');

const fs = require('fs');
const criticalFiles = [
    'server.js',
    'database.js',
    '.env',
    'amocrm/amocrm.json',
    'services/instagram.service.js',
    'controllers/auth.controller.js',
    'routes/auth.js'
];

let filesScore = 0;
for (const file of criticalFiles) {
    if (fs.existsSync(file)) {
        logSuccess(`${file} найден`);
        filesScore += Math.floor(100 / criticalFiles.length);
    } else {
        logError(`${file} отсутствует`);
    }
}

console.log(`📁 Файловая структура: ${Math.min(filesScore, 100)}%`);

// 7. ОБЩИЙ ОТЧЕТ
console.log('');
console.log('📊 === ИТОГОВЫЙ ОТЧЕТ ===');
console.log('════════════════════════════════════════════════════════');

const integrationScores = {
    'AmoCRM': amocrmScore,
    'VK': vkScore,
    'Instagram': instagramScore,
    'Telegram': telegramScore,
    'Files': Math.min(filesScore, 100)
};

console.log('🎯 ГОТОВНОСТЬ ПО ИНТЕГРАЦИЯМ:');
for (const [name, score] of Object.entries(integrationScores)) {
    const status = score >= 80 ? '✅' : score >= 50 ? '⚠️ ' : '❌';
    console.log(`   ${status} ${name}: ${score}%`);
}

const averageScore = Object.values(integrationScores).reduce((a, b) => a + b, 0) / Object.keys(integrationScores).length;

console.log('');
console.log(`📈 ОБЩАЯ ГОТОВНОСТЬ ПРОЕКТА: ${Math.round(averageScore)}%`);

const successRate = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

console.log('');
console.log('📊 СТАТИСТИКА ПРОВЕРОК:');
console.log(`   ✅ Успешных: ${passedChecks}`);
console.log(`   ❌ Ошибок: ${errors}`);
console.log(`   ⚠️  Предупреждений: ${warnings}`);
console.log(`   📊 Процент успеха: ${successRate}%`);

console.log('════════════════════════════════════════════════════════');

// 8. РЕКОМЕНДАЦИИ
console.log('');
console.log('💡 === ПРИОРИТЕТНЫЕ ДЕЙСТВИЯ ===');

if (vkScore < 100 && vkScore >= 60) {
    console.log('🔵 1. VK: Получите VK_CLIENT_SECRET из dev.vk.com');
}

if (instagramScore < 50) {
    console.log('📸 2. Instagram: Создайте приложение в developers.facebook.com (Instagram API)');
}

if (amocrmScore < 100) {
    console.log('🏢 3. AmoCRM: Используйте веб-интерфейс /auth/setup для получения токенов');
}

if (telegramScore < 100) {
    console.log('📱 4. Telegram: Получите токен бота от @BotFather (опционально)');
}

console.log('');
console.log('🚀 === СЛЕДУЮЩИЕ ШАГИ ===');

if (averageScore >= 80) {
    console.log('🎉 Проект готов к запуску!');
    console.log('   - Запустите сервер: node server.js');
    console.log('   - Протестируйте интеграции');
    console.log('   - Проверьте веб-интерфейс: /auth/setup');
} else if (averageScore >= 60) {
    console.log('⚠️  Проект частично готов');
    console.log('   - Исправьте критические ошибки');
    console.log('   - Запустите повторную проверку');
} else {
    console.log('❌ Проект требует настройки');
    console.log('   - Настройте основные интеграции');
    console.log('   - Проверьте переменные окружения');
}

console.log('');
console.log('🔗 ПОЛЕЗНЫЕ КОМАНДЫ:');
console.log('   node test-vk-integration.js       # Подробная диагностика VK');
console.log('   node test-instagram-integration.js # Подробная диагностика Instagram');
console.log('   node server.js                    # Запуск сервера');
console.log('   curl http://localhost:3001/health  # Проверка health');

// Возвращаем соответствующий код выхода
process.exit(errors > 0 ? 1 : 0);
