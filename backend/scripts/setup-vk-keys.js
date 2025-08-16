#!/usr/bin/env node
// backend/scripts/setup-vk-keys.js
// Интерактивная настройка VK ключей

const readline = require('readline');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ENV_PATH = path.join(__dirname, '..', '.env');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('🔵 === НАСТРОЙКА VK КЛЮЧЕЙ ===');
console.log('');

function question(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

async function main() {
    console.log('📋 Этот скрипт поможет настроить VK интеграцию');
    console.log('');
    
    // Проверяем существующий .env
    let envContent = '';
    if (fs.existsSync(ENV_PATH)) {
        envContent = fs.readFileSync(ENV_PATH, 'utf-8');
        console.log('✅ Найден существующий .env файл');
    } else {
        console.log('⚠️  .env файл не найден, создаем новый');
        // Копируем из примера
        const examplePath = path.join(__dirname, '..', 'env.example');
        if (fs.existsSync(examplePath)) {
            envContent = fs.readFileSync(examplePath, 'utf-8');
        }
    }
    
    console.log('');
    console.log('🔑 ПОЛУЧЕНИЕ VK КЛЮЧЕЙ:');
    console.log('1. Откройте https://dev.vk.com/');
    console.log('2. Выберите ваше приложение (или создайте новое)');
    console.log('3. Скопируйте "Защищённый ключ" из настроек');
    console.log('');
    
    // VK_CLIENT_SECRET
    const clientSecret = await question('Введите VK_CLIENT_SECRET (защищённый ключ): ');
    if (!clientSecret || clientSecret.includes('ВАШ_ЗАЩИЩЁННЫЙ_КЛЮЧ')) {
        console.log('❌ Неверный ключ! Должен быть реальный ключ из VK Developers');
        process.exit(1);
    }
    
    // VK_SERVICE_KEY (опционально)
    console.log('');
    console.log('🔧 VK_SERVICE_KEY нужен для VK ID API (опционально)');
    const serviceKey = await question('Введите VK_SERVICE_KEY (или Enter для пропуска): ');
    
    // VK_GROUP_ID (опционально)
    console.log('');
    console.log('👥 VK_GROUP_ID нужен для отслеживания активности в группе');
    const groupId = await question('Введите VK_GROUP_ID (только цифры, или Enter для пропуска): ');
    
    // JWT_SECRET
    console.log('');
    console.log('🔐 Генерирую JWT_SECRET...');
    const jwtSecret = crypto.randomBytes(64).toString('hex');
    console.log('✅ JWT_SECRET сгенерирован');
    
    // Обновляем .env
    console.log('');
    console.log('💾 Обновляю .env файл...');
    
    // Заменяем ключи
    envContent = envContent.replace(
        /VK_CLIENT_SECRET=.*/g, 
        `VK_CLIENT_SECRET=${clientSecret}`
    );
    
    if (serviceKey && serviceKey.trim()) {
        envContent = envContent.replace(
            /VK_SERVICE_KEY=.*/g,
            `VK_SERVICE_KEY=${serviceKey}`
        );
    }
    
    if (groupId && groupId.trim() && /^\d+$/.test(groupId)) {
        envContent = envContent.replace(
            /VK_GROUP_ID=.*/g,
            `VK_GROUP_ID=${groupId}`
        );
    }
    
    envContent = envContent.replace(
        /JWT_SECRET=.*/g,
        `JWT_SECRET=${jwtSecret}`
    );
    
    // Сохраняем файл
    fs.writeFileSync(ENV_PATH, envContent);
    console.log('✅ .env файл обновлен');
    
    console.log('');
    console.log('🧪 ТЕСТИРОВАНИЕ:');
    console.log('Запустите: node test-vk-integration.js');
    console.log('');
    
    console.log('🎯 ГОТОВО! VK интеграция настроена');
    console.log('');
    console.log('📊 СЛЕДУЮЩИЕ ШАГИ:');
    console.log('1. Проверьте тестом: node backend/test-vk-integration.js');
    console.log('2. Запустите сервер: npm start');
    console.log('3. Протестируйте авторизацию через веб-интерфейс');
    
    rl.close();
}

main().catch(error => {
    console.error('❌ Ошибка:', error.message);
    rl.close();
    process.exit(1);
});
