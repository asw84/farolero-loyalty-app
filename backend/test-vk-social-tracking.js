// backend/test-vk-social-tracking.js
// Тест отслеживания социальной активности VK

require('dotenv').config();
const vkService = require('./services/vk.service');

console.log('🔵 === ТЕСТ ОТСЛЕЖИВАНИЯ VK АКТИВНОСТИ ===');
console.log('📅', new Date().toLocaleString());
console.log('');

// Конфигурация теста
const TEST_CONFIG = {
    // Тестовые данные - замените на реальные для проверки
    USER_VK_ID: '123456789',  // ID пользователя VK для тестирования
    GROUP_ID: process.env.VK_GROUP_ID,
    POST_OWNER_ID: `-${process.env.VK_GROUP_ID}`,  // ID группы с минусом для проверки постов
    POST_ID: '1',  // ID поста для проверки
};

// Проверка переменных окружения
console.log('⚙️  === ПРОВЕРКА КОНФИГУРАЦИИ ===');

const requiredEnvVars = [
    'VK_ACCESS_TOKEN',
    'VK_GROUP_ID'
];

let configOk = true;

requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (!value || value.includes('YOUR_') || value.includes('REQUIRED')) {
        console.log(`❌ ${varName} не настроен или содержит placeholder`);
        configOk = false;
    } else {
        console.log(`✅ ${varName} настроен`);
    }
});

if (!configOk) {
    console.log('');
    console.log('❌ === КРИТИЧЕСКИЕ ОШИБКИ КОНФИГУРАЦИИ ===');
    console.log('1. Настройте VK_ACCESS_TOKEN в .env файле');
    console.log('2. Настройте VK_GROUP_ID в .env файле');
    console.log('3. Перезапустите тест');
    process.exit(1);
}

console.log('');
console.log('🧪 === ЗАПУСК ТЕСТОВ VK API ===');

// Тест 1: Проверка подписки на группу
async function testGroupMembership() {
    console.log('');
    console.log('👥 Тест 1: Проверка подписки на группу');
    
    try {
        const isMember = await vkService.isMember(TEST_CONFIG.USER_VK_ID);
        console.log(`Результат: ${isMember ? 'ПОДПИСАН' : 'НЕ ПОДПИСАН'}`);
        return true;
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        return false;
    }
}

// Тест 2: Проверка лайка поста
async function testPostLike() {
    console.log('');
    console.log('👍 Тест 2: Проверка лайка поста');
    
    try {
        const hasLiked = await vkService.hasLikedPost(
            TEST_CONFIG.USER_VK_ID, 
            TEST_CONFIG.POST_OWNER_ID, 
            TEST_CONFIG.POST_ID
        );
        console.log(`Результат: ${hasLiked ? 'ЛАЙКНУЛ' : 'НЕ ЛАЙКАЛ'}`);
        return true;
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        return false;
    }
}

// Тест 3: Проверка комментария к посту
async function testPostComment() {
    console.log('');
    console.log('💬 Тест 3: Проверка комментария к посту');
    
    try {
        const hasCommented = await vkService.hasCommentedPost(
            TEST_CONFIG.USER_VK_ID, 
            TEST_CONFIG.POST_OWNER_ID, 
            TEST_CONFIG.POST_ID
        );
        console.log(`Результат: ${hasCommented ? 'КОММЕНТИРОВАЛ' : 'НЕ КОММЕНТИРОВАЛ'}`);
        return true;
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        return false;
    }
}

// Тест 4: Проверка репоста
async function testPostRepost() {
    console.log('');
    console.log('🔁 Тест 4: Проверка репоста');
    
    try {
        const hasReposted = await vkService.hasReposted(
            TEST_CONFIG.USER_VK_ID, 
            TEST_CONFIG.POST_OWNER_ID, 
            TEST_CONFIG.POST_ID
        );
        console.log(`Результат: ${hasReposted ? 'РЕПОСТНУЛ' : 'НЕ РЕПОСТИЛ'}`);
        return true;
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        return false;
    }
}

// Запуск всех тестов
async function runAllTests() {
    const tests = [
        { name: 'Подписка на группу', fn: testGroupMembership },
        { name: 'Лайк поста', fn: testPostLike },
        { name: 'Комментарий к посту', fn: testPostComment },
        { name: 'Репост', fn: testPostRepost }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            const result = await test.fn();
            if (result) {
                passed++;
            } else {
                failed++;
            }
        } catch (error) {
            console.error(`❌ Тест "${test.name}" завершился с ошибкой:`, error.message);
            failed++;
        }
    }

    console.log('');
    console.log('📊 === ИТОГОВЫЙ ОТЧЕТ ===');
    console.log(`✅ Успешных тестов: ${passed}`);
    console.log(`❌ Неудачных тестов: ${failed}`);
    console.log(`🎯 Общий результат: ${failed === 0 ? 'ВСЕ ТЕСТЫ ПРОШЛИ!' : 'ЕСТЬ ОШИБКИ'}`);
    
    if (failed === 0) {
        console.log('');
        console.log('🎉 === ОТЛИЧНО! ===');
        console.log('VK интеграция для отслеживания активности работает корректно!');
        console.log('Теперь задача 3.2 должна функционировать.');
    } else {
        console.log('');
        console.log('🔧 === РЕКОМЕНДАЦИИ ===');
        console.log('1. Проверьте права доступа VK_ACCESS_TOKEN');
        console.log('2. Убедитесь что VK_GROUP_ID корректный');
        console.log('3. Проверьте что тестовые USER_VK_ID, POST_ID существуют');
    }
    
    console.log('');
    console.log('💡 === ИНФОРМАЦИЯ ДЛЯ НАСТРОЙКИ ===');
    console.log(`Тестовая конфигурация:`);
    console.log(`- USER_VK_ID: ${TEST_CONFIG.USER_VK_ID}`);
    console.log(`- GROUP_ID: ${TEST_CONFIG.GROUP_ID}`);
    console.log(`- POST_OWNER_ID: ${TEST_CONFIG.POST_OWNER_ID}`);
    console.log(`- POST_ID: ${TEST_CONFIG.POST_ID}`);
    console.log('');
    console.log('Для реального тестирования замените эти значения на:');
    console.log('- Реальный VK ID пользователя');
    console.log('- Реальный ID поста из вашей VK группы');
}

// Проверяем аргументы командной строки для интерактивного режима
if (process.argv.includes('--interactive')) {
    console.log('🔧 === ИНТЕРАКТИВНЫЙ РЕЖИМ ===');
    console.log('Введите реальные данные для тестирования:');
    
    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('VK ID пользователя для тестирования: ', (userId) => {
        rl.question('ID поста для тестирования (без owner_id): ', (postId) => {
            TEST_CONFIG.USER_VK_ID = userId;
            TEST_CONFIG.POST_ID = postId;
            
            rl.close();
            runAllTests().catch(console.error);
        });
    });
} else {
    runAllTests().catch(console.error);
}
