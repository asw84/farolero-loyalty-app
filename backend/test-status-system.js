// backend/test-status-system.js
// Тест системы статусов и кэшбэка

const { initializeDatabase } = require('./database');
const statusService = require('./services/status.service');
const userService = require('./services/user.service');
const adminService = require('./services/admin.service');

async function testStatusSystem() {
    console.log('🚀 Начинаем тестирование системы статусов...\n');

    try {
        // Инициализируем БД
        await initializeDatabase();
        console.log('✅ База данных инициализирована\n');

        const testTelegramId = 'test_status_' + Date.now();

        // 1. Тест создания пользователя с 0 баллов (Бронзовый статус)
        console.log('📋 Тест 1: Создание пользователя');
        const newUser = await userService.getUserData(testTelegramId);
        console.log(`   Баллы: ${newUser.points}, Статус: ${newUser.status}`);
        console.log(`   ✅ Ожидаемый статус: Бронза\n`);

        // 2. Тест расчета статуса по баллам
        console.log('📋 Тест 2: Расчет статуса');
        const statusLevels = statusService.getStatusLevels();
        console.log('   Уровни статусов:');
        statusLevels.forEach(level => {
            console.log(`   - ${level.name}: ${level.minPoints}+ баллов, кэшбэк ${level.cashbackRate}%`);
        });
        console.log();

        // 3. Тест повышения до Серебряного статуса
        console.log('📋 Тест 3: Повышение до Серебра (500 баллов)');
        const silverResult = await adminService.adjustPoints(testTelegramId, 500, 'Тест повышения до Серебра');
        console.log(`   Новый баланс: ${silverResult.newTotalPoints} баллов`);
        console.log(`   Статус изменен: ${silverResult.statusUpdate.statusChanged}`);
        if (silverResult.statusUpdate.statusChanged) {
            console.log(`   ${silverResult.statusUpdate.oldStatus} → ${silverResult.statusUpdate.newStatus}`);
        }
        console.log();

        // 4. Тест кэшбэка для Серебряного статуса
        console.log('📋 Тест 4: Расчет кэшбэка для покупки 1000 руб');
        const cashback = await statusService.calculateCashback(testTelegramId, 1000);
        console.log(`   Сумма покупки: ${cashback.purchaseAmount} руб`);
        console.log(`   Статус: ${cashback.userStatus}`);
        console.log(`   Кэшбэк: ${cashback.cashbackRate}% = ${cashback.cashbackAmount} баллов`);
        console.log();

        // 5. Тест повышения до Золотого статуса
        console.log('📋 Тест 5: Повышение до Золота (1500 баллов)');
        const goldResult = await adminService.adjustPoints(testTelegramId, 1000, 'Тест повышения до Золота');
        console.log(`   Новый баланс: ${goldResult.newTotalPoints} баллов`);
        if (goldResult.statusUpdate.statusChanged) {
            console.log(`   🎉 Статус повышен: ${goldResult.statusUpdate.oldStatus} → ${goldResult.statusUpdate.newStatus}`);
        }
        console.log();

        // 6. Тест кэшбэка для Золотого статуса
        console.log('📋 Тест 6: Расчет кэшбэка для Золотого статуса');
        const goldCashback = await statusService.calculateCashback(testTelegramId, 2000);
        console.log(`   Сумма покупки: ${goldCashback.purchaseAmount} руб`);
        console.log(`   Статус: ${goldCashback.userStatus}`);
        console.log(`   Кэшбэк: ${goldCashback.cashbackRate}% = ${goldCashback.cashbackAmount} баллов`);
        console.log();

        // 7. Тест повышения до Платинового статуса
        console.log('📋 Тест 7: Повышение до Платины (3000+ баллов)');
        const platinumResult = await adminService.adjustPoints(testTelegramId, 1500, 'Тест повышения до Платины');
        console.log(`   Новый баланс: ${platinumResult.newTotalPoints} баллов`);
        if (platinumResult.statusUpdate.statusChanged) {
            console.log(`   🎉 Статус повышен: ${platinumResult.statusUpdate.oldStatus} → ${platinumResult.statusUpdate.newStatus}`);
        }
        console.log();

        // 8. Тест максимального кэшбэка
        console.log('📋 Тест 8: Максимальный кэшбэк для Платинового статуса');
        const platinumCashback = await statusService.calculateCashback(testTelegramId, 5000);
        console.log(`   Сумма покупки: ${platinumCashback.purchaseAmount} руб`);
        console.log(`   Статус: ${platinumCashback.userStatus}`);
        console.log(`   Кэшбэк: ${platinumCashback.cashbackRate}% = ${platinumCashback.cashbackAmount} баллов`);
        console.log();

        // 9. Тест информации о прогрессе
        console.log('📋 Тест 9: Информация о прогрессе');
        const statusInfo = await statusService.getUserStatus(testTelegramId);
        console.log(`   Текущие баллы: ${statusInfo.points}`);
        console.log(`   Статус: ${statusInfo.status}`);
        console.log(`   Кэшбэк: ${statusInfo.cashbackRate}%`);
        console.log(`   До следующего уровня: ${statusInfo.pointsToNextLevel || 'Максимальный уровень'} баллов`);
        console.log();

        console.log('🎉 Все тесты системы статусов прошли успешно!');

    } catch (error) {
        console.error('❌ Ошибка при тестировании:', error);
        process.exit(1);
    }
}

// Запускаем тест если файл вызван напрямую
if (require.main === module) {
    testStatusSystem().then(() => {
        console.log('\n✅ Тестирование завершено');
        process.exit(0);
    });
}

module.exports = { testStatusSystem };
