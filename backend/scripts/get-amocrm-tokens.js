#!/usr/bin/env node
// Скрипт для получения свежих токенов AmoCRM
// Использование: node scripts/get-amocrm-tokens.js

const fs = require('fs');
const path = require('path');

// Загружаем конфигурацию
require('dotenv').config();

const amocrmClient = require('../amocrm/apiClient');

async function getTokens() {
    console.log('🔄 Получение токенов AmoCRM...');
    
    try {
        // 1. Проверяем наличие auth_code в amocrm.json
        const configPath = path.join(__dirname, '..', 'amocrm', 'amocrm.json');
        
        if (!fs.existsSync(configPath)) {
            console.error('❌ Файл amocrm.json не найден!');
            console.log('📝 Создайте файл amocrm.json с auth_code');
            return;
        }
        
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        
        if (!config.auth_code) {
            console.error('❌ auth_code не найден в amocrm.json!');
            console.log('📝 Добавьте свежий auth_code в файл amocrm.json');
            return;
        }
        
        console.log('✅ auth_code найден, длина:', config.auth_code.length);
        
        // 2. Пытаемся получить токены
        console.log('🔑 Обмениваем auth_code на токены...');
        
        const tokens = await amocrmClient.getInitialToken();
        
        console.log('✅ Токены успешно получены!');
        console.log('📅 Access token expires in:', Math.floor(tokens.expires_in / 3600), 'hours');
        console.log('💾 Токены сохранены в:', process.env.TOKENS_PATH || '/app/tokens/tokens.json');
        
        // 3. Проверяем сохранение
        const tokensPath = process.env.TOKENS_PATH || path.join(__dirname, '..', 'tokens', 'tokens.json');
        
        if (fs.existsSync(tokensPath)) {
            const savedTokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
            console.log('✅ Проверка: токены корректно сохранены');
            console.log('🕐 Создан:', new Date(savedTokens.created_at * 1000).toLocaleString());
        }
        
        // 4. Тестируем подключение
        console.log('🧪 Тестируем подключение к AmoCRM...');
        
        const testRequest = await amocrmClient.makeRequest('/api/v4/account');
        
        if (testRequest && testRequest.id) {
            console.log('✅ Подключение к AmoCRM работает!');
            console.log('🏢 Аккаунт:', testRequest.name || 'N/A');
        }
        
        console.log('\n🎉 Успех! Токены AmoCRM готовы к использованию.');
        
    } catch (error) {
        console.error('❌ Ошибка получения токенов:', error.message);
        
        if (error.response && error.response.data) {
            console.error('📋 Детали ошибки:', error.response.data);
            
            if (error.response.data.hint === 'Authorization code has expired') {
                console.log('\n💡 Решение:');
                console.log('1. Получите новый код авторизации:');
                console.log('   node generate-auth-url.js');
                console.log('2. Обновите auth_code в amocrm.json');
                console.log('3. Запустите скрипт снова');
            }
        }
        
        process.exit(1);
    }
}

// Функция для проверки текущих токенов
async function checkCurrentTokens() {
    console.log('🔍 Проверка текущих токенов...');
    
    const tokensPath = process.env.TOKENS_PATH || path.join(__dirname, '..', 'tokens', 'tokens.json');
    
    if (!fs.existsSync(tokensPath)) {
        console.log('❌ Файл токенов не найден');
        return false;
    }
    
    try {
        const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
        const now = Math.floor(Date.now() / 1000);
        const expiresAt = tokens.created_at + tokens.expires_in;
        const timeLeft = expiresAt - now;
        
        console.log('📅 Токен создан:', new Date(tokens.created_at * 1000).toLocaleString());
        console.log('⏰ Истекает через:', Math.floor(timeLeft / 3600), 'часов');
        
        if (timeLeft <= 0) {
            console.log('❌ Токен истек');
            return false;
        } else if (timeLeft < 3600) {
            console.log('⚠️  Токен истекает скоро!');
            return false;
        } else {
            console.log('✅ Токен актуален');
            return true;
        }
        
    } catch (error) {
        console.error('❌ Ошибка чтения токенов:', error.message);
        return false;
    }
}

// Основная логика
async function main() {
    console.log('🚀 AmoCRM Token Manager\n');
    
    const args = process.argv.slice(2);
    
    if (args.includes('--check') || args.includes('-c')) {
        await checkCurrentTokens();
        return;
    }
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log('Использование:');
        console.log('  node scripts/get-amocrm-tokens.js          # Получить новые токены');
        console.log('  node scripts/get-amocrm-tokens.js --check  # Проверить текущие токены');
        console.log('  node scripts/get-amocrm-tokens.js --help   # Показать справку');
        return;
    }
    
    // Проверим текущие токены сначала
    const tokensValid = await checkCurrentTokens();
    
    if (tokensValid) {
        console.log('\n💡 Текущие токены актуальны. Нужны новые? Используйте --force');
        if (!args.includes('--force')) {
            return;
        }
    }
    
    console.log('\n🔄 Получаем новые токены...\n');
    await getTokens();
}

// Запуск
main().catch(error => {
    console.error('💥 Критическая ошибка:', error.message);
    process.exit(1);
});
