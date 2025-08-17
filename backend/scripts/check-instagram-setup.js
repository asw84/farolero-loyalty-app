#!/usr/bin/env node
// Проверка готовности Instagram интеграции к тестированию

require('dotenv').config();

console.log('📸 === ПРОВЕРКА INSTAGRAM ИНТЕГРАЦИИ ===\n');

const instagramConfig = {
    APP_ID: process.env.INSTAGRAM_APP_ID,
    APP_SECRET: process.env.INSTAGRAM_APP_SECRET,
    REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI
};

let score = 0;
let maxScore = 100;

function logSuccess(message) {
    console.log('✅', message);
}

function logError(message) {
    console.log('❌', message);
}

function logWarning(message) {
    console.log('⚠️ ', message);
}

function logInfo(message) {
    console.log('ℹ️ ', message);
}

// Проверка App ID
console.log('🔑 Проверка Facebook App ID (для Instagram API):');
if (instagramConfig.APP_ID && instagramConfig.APP_ID !== 'YOUR_FACEBOOK_APP_ID') {
    if (/^\d+$/.test(instagramConfig.APP_ID)) {
        logSuccess(`Facebook App ID настроен корректно: ${instagramConfig.APP_ID}`);
        score += 40;
    } else {
        logWarning(`Facebook App ID содержит не только цифры: ${instagramConfig.APP_ID}`);
        score += 20;
    }
} else {
    logError('Facebook App ID не настроен (содержит placeholder)');
}

console.log('');

// Проверка App Secret
console.log('🔐 Проверка Facebook App Secret (для Instagram API):');
if (instagramConfig.APP_SECRET && instagramConfig.APP_SECRET !== 'YOUR_FACEBOOK_APP_SECRET') {
    const secretPreview = instagramConfig.APP_SECRET.substring(0, 8) + '...';
    logSuccess(`Facebook App Secret настроен: ${secretPreview}`);
    score += 40;
} else {
    logError('Facebook App Secret не настроен (содержит placeholder)');
}

console.log('');

// Проверка Redirect URI
console.log('🔗 Проверка Redirect URI:');
if (instagramConfig.REDIRECT_URI) {
    if (instagramConfig.REDIRECT_URI.startsWith('https://')) {
        logSuccess(`Redirect URI настроен корректно: ${instagramConfig.REDIRECT_URI}`);
        score += 20;
    } else {
        logWarning('Redirect URI не использует HTTPS (требуется для production)');
        score += 10;
    }
} else {
    logError('Redirect URI не настроен');
}

console.log('');

// Проверка файловой структуры
console.log('📁 Проверка файловой структуры:');
const fs = require('fs');

const requiredFiles = [
    { path: 'services/instagram.service.js', description: 'Instagram сервис' },
    { path: 'controllers/instagram.controller.js', description: 'Instagram контроллер' },
    { path: 'routes/instagram.routes.js', description: 'Instagram роуты' }
];

let filesOk = true;
for (const file of requiredFiles) {
    if (fs.existsSync(file.path)) {
        logSuccess(`${file.description} найден`);
    } else {
        logError(`${file.description} отсутствует: ${file.path}`);
        filesOk = false;
    }
}

console.log('');

// Генерация тестовых URL
if (score >= 60) {
    console.log('🚀 Генерация тестовых URL:');
    
    // URL авторизации
    const authUrl = new URL('https://api.instagram.com/oauth/authorize');
    authUrl.searchParams.set('client_id', instagramConfig.APP_ID);
    authUrl.searchParams.set('redirect_uri', instagramConfig.REDIRECT_URI);
    authUrl.searchParams.set('scope', 'user_profile,user_media');
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', JSON.stringify({ telegram_user_id: 'test_123' }));

    console.log('📸 Instagram авторизация:');
    console.log(authUrl.toString());
    console.log('');

    // Локальный тест URL
    const localTestUrl = `https://api.5425685-au70735.twc1.net/auth/instagram/login?tg_user_id=test_123`;
    console.log('🔧 Локальный тест через контроллер:');
    console.log(localTestUrl);
} else {
    logWarning('Недостаточно настроек для генерации тестовых URL');
}

console.log('');

// Итоговый отчет
console.log('📊 === ИТОГОВЫЙ ОТЧЕТ ===');
console.log(`Готовность Instagram интеграции: ${score}%`);

if (score >= 80) {
    logSuccess('Instagram интеграция готова к тестированию!');
    console.log('');
    console.log('🚀 Следующие шаги:');
    console.log('1. Протестируйте авторизацию в браузере');
    console.log('2. Добавьте тестовых пользователей в Facebook настройках');
    console.log('3. Проверьте callback обработку');
} else if (score >= 60) {
    logWarning('Instagram интеграция частично настроена');
    console.log('');
    console.log('⚠️  Что нужно исправить:');
    if (instagramConfig.APP_ID === 'YOUR_INSTAGRAM_APP_ID') {
        console.log('- Получите реальный Instagram App ID');
    }
    if (instagramConfig.APP_SECRET === 'YOUR_INSTAGRAM_APP_SECRET') {
        console.log('- Получите реальный Instagram App Secret');
    }
} else {
    logError('Instagram интеграция требует настройки');
    console.log('');
    console.log('❌ Критические проблемы:');
    console.log('1. Создайте Instagram приложение в Facebook for Developers');
    console.log('2. Получите App ID и App Secret');
    console.log('3. Обновите .env файл');
}

console.log('');
console.log('📚 Документация: backend/docs/INSTAGRAM_SETUP_GUIDE.md');

process.exit(score >= 60 ? 0 : 1);
