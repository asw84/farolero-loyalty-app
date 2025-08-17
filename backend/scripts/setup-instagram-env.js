#!/usr/bin/env node
// Скрипт для настройки Instagram переменных окружения

const fs = require('fs');
const path = require('path');
const readline = require('readline');

console.log('📸 === НАСТРОЙКА INSTAGRAM ИНТЕГРАЦИИ ===\n');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function setupInstagramEnv() {
    try {
        // Проверяем что находимся в правильной директории
        const envPath = path.join(__dirname, '../.env');
        
        if (!fs.existsSync(envPath)) {
            console.log('❌ Файл .env не найден. Создайте его из env.example');
            process.exit(1);
        }

        console.log('📋 Для настройки Instagram интеграции нужны следующие данные:');
        console.log('   1. Facebook App ID (для Instagram API)');
        console.log('   2. Facebook App Secret (для Instagram API)');
        console.log('');
        console.log('💡 Получить их можно в Facebook for Developers:');
        console.log('   https://developers.facebook.com/');
        console.log('   Создайте приложение типа "Другое" → "Потребительский"');
        console.log('   Добавьте продукт "Instagram API" (НЕ Basic Display!)');
        console.log('');
        console.log('📚 Следуйте инструкциям в backend/docs/INSTAGRAM_SETUP_GUIDE.md');
        console.log('');

        // Получаем Facebook App ID
        const appId = await askQuestion('🔑 Введите Facebook App ID (для Instagram API): ');
        if (!appId || appId === 'YOUR_FACEBOOK_APP_ID') {
            console.log('❌ Некорректный Facebook App ID');
            process.exit(1);
        }

        // Проверяем что App ID содержит только цифры
        if (!/^\d+$/.test(appId)) {
            console.log('⚠️  Facebook App ID должен содержать только цифры');
        }

        // Получаем Facebook App Secret
        const appSecret = await askQuestion('🔐 Введите Facebook App Secret (для Instagram API): ');
        if (!appSecret || appSecret === 'YOUR_FACEBOOK_APP_SECRET') {
            console.log('❌ Некорректный Facebook App Secret');
            process.exit(1);
        }

        // Читаем текущий .env файл
        let envContent = fs.readFileSync(envPath, 'utf-8');

        // Заменяем Instagram настройки
        envContent = envContent.replace(
            /INSTAGRAM_APP_ID=.*/,
            `INSTAGRAM_APP_ID=${appId}`
        );
        
        envContent = envContent.replace(
            /INSTAGRAM_APP_SECRET=.*/,
            `INSTAGRAM_APP_SECRET=${appSecret}`
        );

        // Сохраняем обновленный .env
        fs.writeFileSync(envPath, envContent);

        console.log('');
        console.log('✅ Instagram настройки успешно обновлены!');
        console.log('');
        console.log('🔧 Настроенные переменные:');
        console.log(`   INSTAGRAM_APP_ID=${appId}`);
        console.log(`   INSTAGRAM_APP_SECRET=${appSecret.substring(0, 8)}...`);
        console.log(`   INSTAGRAM_REDIRECT_URI=https://api.5425685-au70735.twc1.net/api/instagram/callback`);
        console.log('');
        console.log('🚀 Следующие шаги:');
        console.log('1. Проверьте настройку:');
        console.log('   node backend/test-instagram-integration.js');
        console.log('');
        console.log('2. Протестируйте авторизацию:');
        console.log('   node backend/generate-instagram-test-urls.js');
        console.log('');
        console.log('3. Убедитесь что Redirect URI добавлен в Facebook настройках:');
        console.log('   https://api.5425685-au70735.twc1.net/api/instagram/callback');

    } catch (error) {
        console.error('❌ Ошибка настройки:', error.message);
        process.exit(1);
    } finally {
        rl.close();
    }
}

// Проверяем аргументы командной строки
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log('Использование: node setup-instagram-env.js');
    console.log('');
    console.log('Интерактивная настройка Instagram App ID и App Secret в .env файле');
    console.log('');
    console.log('Сначала получите ключи в Facebook for Developers:');
    console.log('https://developers.facebook.com/');
    process.exit(0);
}

setupInstagramEnv().catch(error => {
    console.error('❌ Критическая ошибка:', error);
    process.exit(1);
});
