// backend/test-referral-system.js
// Тест реферальной системы

const referralService = require('./services/referral.service');
const { dbRun, dbGet, getDbConnection } = require('./database');

// Тестовые данные
const TEST_USERS = {
    referrer: '123456789',
    referee: '987654321',
    invalidUser: '000000000'
};

// Очистка тестовых данных
async function cleanupTestData() {
    try {
        const db = getDbConnection();
        // Отключаем foreign key constraints для очистки
        await dbRun('PRAGMA foreign_keys = OFF');
        
        // Удаляем в правильном порядке
        await dbRun('DELETE FROM activity WHERE user_id IN (SELECT id FROM users WHERE telegram_user_id IN (?, ?))', [TEST_USERS.referrer, TEST_USERS.referee]);
        await dbRun('DELETE FROM referrals WHERE referrer_telegram_id IN (?, ?) OR referee_telegram_id IN (?, ?)', [TEST_USERS.referrer, TEST_USERS.referee, TEST_USERS.referrer, TEST_USERS.referee]);
        await dbRun('DELETE FROM users WHERE telegram_user_id IN (?, ?)', [TEST_USERS.referrer, TEST_USERS.referee]);
        
        // Включаем foreign key constraints обратно
        await dbRun('PRAGMA foreign_keys = ON');
        console.log('🧹 Тестовые данные очищены');
    } catch (error) {
        console.error('❌ Ошибка очистки:', error.message);
    }
}

// Создание тестовых пользователей
async function createTestUsers() {
    try {
        await dbRun('INSERT OR REPLACE INTO users (telegram_user_id, points, status) VALUES (?, ?, ?)', [TEST_USERS.referrer, 100, 'Бронза']);
        await dbRun('INSERT OR REPLACE INTO users (telegram_user_id, points, status) VALUES (?, ?, ?)', [TEST_USERS.referee, 0, 'Бронза']);
        console.log('👥 Тестовые пользователи созданы');
    } catch (error) {
        console.error('❌ Ошибка создания пользователей:', error.message);
    }
}

// Тест 1: Генерация реферального кода
async function testGenerateReferralCode() {
    console.log('\n🧪 Тест 1: Генерация реферального кода');
    
    try {
        const code = await referralService.createReferralCode(TEST_USERS.referrer);
        
        if (code && code.startsWith('FAR') && code.length === 11) {
            console.log('✅ Реферальный код создан:', code);
            return code;
        } else {
            console.log('❌ Неверный формат кода:', code);
            return null;
        }
    } catch (error) {
        console.log('❌ Ошибка генерации кода:', error.message);
        return null;
    }
}

// Тест 2: Валидация реферального кода
async function testValidateReferralCode(referralCode) {
    console.log('\n🧪 Тест 2: Валидация реферального кода');
    
    if (!referralCode) {
        console.log('⚠️ Пропущен - нет кода для валидации');
        return false;
    }
    
    try {
        const validation = await referralService.validateReferralCode(referralCode);
        
        if (validation.valid && validation.referrerTelegramId === TEST_USERS.referrer) {
            console.log('✅ Код валиден, реферер:', validation.referrerTelegramId);
            return true;
        } else {
            console.log('❌ Код невалиден:', validation);
            return false;
        }
    } catch (error) {
        console.log('❌ Ошибка валидации:', error.message);
        return false;
    }
}

// Тест 3: Активация реферального кода
async function testActivateReferralCode(referralCode) {
    console.log('\n🧪 Тест 3: Активация реферального кода');
    
    if (!referralCode) {
        console.log('⚠️ Пропущен - нет кода для активации');
        return false;
    }
    
    try {
        const result = await referralService.activateReferralCode(referralCode, TEST_USERS.referee);
        
        if (result.success && result.referrerBonus === 50 && result.refereeBonus === 20) {
            console.log('✅ Код активирован успешно');
            console.log('💰 Бонус рефереру:', result.referrerBonus);
            console.log('💰 Бонус рефири:', result.refereeBonus);
            return true;
        } else {
            console.log('❌ Неверный результат активации:', result);
            return false;
        }
    } catch (error) {
        console.log('❌ Ошибка активации:', error.message);
        return false;
    }
}

// Тест 4: Статистика рефералов
async function testReferralStats() {
    console.log('\n🧪 Тест 4: Статистика рефералов');
    
    try {
        const stats = await referralService.getReferralStats(TEST_USERS.referrer);
        
        if (stats.totalReferrals === 1 && stats.totalEarned === 50) {
            console.log('✅ Статистика корректна');
            console.log('📊 Всего рефералов:', stats.totalReferrals);
            console.log('💰 Заработано:', stats.totalEarned);
            return true;
        } else {
            console.log('❌ Неверная статистика:', stats);
            return false;
        }
    } catch (error) {
        console.log('❌ Ошибка получения статистики:', error.message);
        return false;
    }
}

// Тест 5: Проверка начисления баллов
async function testPointsAward() {
    console.log('\n🧪 Тест 5: Проверка начисления баллов');
    
    try {
        const referrer = await dbGet('SELECT points FROM users WHERE telegram_user_id = ?', [TEST_USERS.referrer]);
        const referee = await dbGet('SELECT points FROM users WHERE telegram_user_id = ?', [TEST_USERS.referee]);
        
        if (referrer.points === 150 && referee.points === 20) {
            console.log('✅ Баллы начислены корректно');
            console.log('💰 Реферер:', referrer.points, 'баллов');
            console.log('💰 Рефири:', referee.points, 'баллов');
            return true;
        } else {
            console.log('❌ Неверное количество баллов');
            console.log('💰 Реферер:', referrer.points, 'баллов');
            console.log('💰 Рефири:', referee.points, 'баллов');
            return false;
        }
    } catch (error) {
        console.log('❌ Ошибка проверки баллов:', error.message);
        return false;
    }
}

// Тест 6: Проверка повторной активации
async function testDuplicateActivation(referralCode) {
    console.log('\n🧪 Тест 6: Проверка повторной активации');
    
    if (!referralCode) {
        console.log('⚠️ Пропущен - нет кода для теста');
        return false;
    }
    
    try {
        await referralService.activateReferralCode(referralCode, TEST_USERS.invalidUser);
        console.log('❌ Код активирован повторно (не должно быть)');
        return false;
    } catch (error) {
        if (error.message.includes('уже использован')) {
            console.log('✅ Повторная активация заблокирована');
            return true;
        } else {
            console.log('❌ Неожиданная ошибка:', error.message);
            return false;
        }
    }
}

// Главная функция тестирования
async function runReferralTests() {
    console.log('🚀 Запуск тестов реферальной системы\n');
    
    let passedTests = 0;
    let totalTests = 6;
    
    try {
        // Подготовка
        await cleanupTestData();
        await createTestUsers();
        
        // Тесты
        const referralCode = await testGenerateReferralCode();
        if (referralCode) passedTests++;
        
        if (await testValidateReferralCode(referralCode)) passedTests++;
        if (await testActivateReferralCode(referralCode)) passedTests++;
        if (await testReferralStats()) passedTests++;
        if (await testPointsAward()) passedTests++;
        if (await testDuplicateActivation(referralCode)) passedTests++;
        
        // Результаты
        console.log('\n📊 Результаты тестирования:');
        console.log(`✅ Пройдено: ${passedTests}/${totalTests}`);
        console.log(`❌ Провалено: ${totalTests - passedTests}/${totalTests}`);
        
        if (passedTests === totalTests) {
            console.log('🎉 Все тесты пройдены! Реферальная система работает корректно.');
        } else {
            console.log('⚠️ Некоторые тесты провалены. Проверьте логи выше.');
        }
        
    } catch (error) {
        console.error('💥 Критическая ошибка тестирования:', error.message);
    } finally {
        // Очистка
        await cleanupTestData();
        console.log('\n🏁 Тестирование завершено');
        process.exit(0);
    }
}

// Запуск тестов
if (require.main === module) {
    runReferralTests();
}

module.exports = {
    runReferralTests,
    testGenerateReferralCode,
    testValidateReferralCode,
    testActivateReferralCode,
    testReferralStats,
    testPointsAward,
    testDuplicateActivation
};
