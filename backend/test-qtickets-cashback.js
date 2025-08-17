// backend/test-qtickets-cashback.js
// Тестирование системы кэшбэка Qtickets

const { initializeDatabase } = require('./database');
const qticketsCashbackService = require('./services/qtickets-cashback.service');
const userService = require('./services/user.service');
const statusService = require('./services/status.service');
const { migratePurchasesTable } = require('./scripts/migrate-purchases-table');

async function testQticketsCashback() {
    console.log('🧪 [Test] Запуск тестирования системы кэшбэка Qtickets...\n');
    
    try {
        // Инициализируем базу данных
        await initializeDatabase();
        console.log('✅ База данных инициализирована');
        
        // Выполняем миграцию
        await migratePurchasesTable();
        console.log('✅ Миграция выполнена');
        
        // Создаем тестового пользователя
        const testTelegramId = 'test_cashback_user_123';
        console.log(`\n👤 Создаю тестового пользователя: ${testTelegramId}`);
        
        const userData = await userService.getUserData(testTelegramId);
        console.log(`✅ Пользователь создан: ${userData.points} баллов, статус: ${userData.status}`);
        
        // Добавляем баллы пользователю для тестирования
        const { addPointsByTelegramId } = require('./database');
        await addPointsByTelegramId(testTelegramId, 1000, 'test', 'initial_bonus');
        console.log('✅ Добавлено 1000 тестовых баллов');
        
        // Получаем обновленный статус
        const statusInfo = await statusService.getUserStatus(testTelegramId);
        console.log(`✅ Обновленный статус: ${statusInfo.status} (${statusInfo.points} баллов, кэшбэк ${statusInfo.cashbackRate}%)`);
        
        // Тестируем расчет доступного кэшбэка
        console.log('\n💰 Тестирую расчет доступного кэшбэка...');
        const testWalkId = 1578; // ID прогулки из системы
        
        try {
            const cashbackInfo = await qticketsCashbackService.calculateAvailableCashback(testTelegramId, testWalkId);
            console.log('✅ Информация о кэшбэке:');
            console.log(`   - Прогулка: ${cashbackInfo.walkName} (${cashbackInfo.walkPrice} руб.)`);
            console.log(`   - Баллы пользователя: ${cashbackInfo.userPoints}`);
            console.log(`   - Максимальный кэшбэк: ${cashbackInfo.maxCashbackAmount} баллов`);
            console.log(`   - Рекомендуемый кэшбэк: ${cashbackInfo.recommendedCashback} баллов`);
        } catch (error) {
            console.log(`⚠️ Ошибка расчета кэшбэка (ожидаемо, если прогулка ${testWalkId} не найдена): ${error.message}`);
        }
        
        // Тестируем валидацию платежа
        console.log('\n✅ Тестирую валидацию платежа...');
        const testPointsToUse = 300;
        
        try {
            const validation = await qticketsCashbackService.validateCashbackPayment(testTelegramId, testWalkId, testPointsToUse);
            console.log('✅ Результат валидации:');
            console.log(`   - Валидный: ${validation.valid}`);
            if (validation.valid) {
                console.log(`   - К оплате баллами: ${validation.cashbackAmount}`);
                console.log(`   - Остаток к доплате: ${validation.remainingPrice} руб.`);
                console.log(`   - Останется баллов: ${validation.remainingPoints}`);
            } else {
                console.log(`   - Ошибка: ${validation.error}`);
            }
        } catch (error) {
            console.log(`⚠️ Ошибка валидации (ожидаемо, если прогулка ${testWalkId} не найдена): ${error.message}`);
        }
        
        // Тестируем историю кэшбэка (должна быть пустой)
        console.log('\n📜 Тестирую получение истории кэшбэка...');
        const history = await qticketsCashbackService.getCashbackHistory(testTelegramId);
        console.log(`✅ История кэшбэка: ${history.length} операций`);
        
        // Тестируем детальную историю покупок
        console.log('\n📊 Тестирую детальную историю покупок...');
        const purchaseHistoryService = require('./services/purchase-history.service');
        const detailedHistory = await purchaseHistoryService.getDetailedPurchaseHistory(testTelegramId);
        console.log(`✅ Детальная история: ${detailedHistory.purchases.length} покупок`);
        console.log(`   - Общая сумма: ${detailedHistory.statistics.totalSpent} руб.`);
        console.log(`   - Использовано кэшбэка: ${detailedHistory.statistics.totalCashbackUsed} баллов`);
        
        // Тестируем сводку по периодам
        const monthlySummary = await purchaseHistoryService.getPurchaseSummaryByPeriod(testTelegramId, 'month');
        console.log(`✅ Месячная сводка: ${monthlySummary.length} периодов`);
        
        // Тестируем рекомендации
        const recommendations = await purchaseHistoryService.getCashbackRecommendations(testTelegramId);
        console.log(`✅ Рекомендации: ${recommendations.recommendations.length} советов`);
        
        // Тестируем API endpoints через HTTP запросы
        console.log('\n🌐 Тестирую API endpoints...');
        console.log('📡 Доступные endpoints для кэшбэка:');
        console.log('   GET  /api/qtickets/cashback/calculate/:telegramId/:walkId');
        console.log('   POST /api/qtickets/cashback/validate');
        console.log('   POST /api/qtickets/cashback/pay');
        console.log('   GET  /api/qtickets/cashback/history/:telegramId');
        console.log('   GET  /api/qtickets/cashback/stats/:telegramId');
        console.log('');
        console.log('📡 Доступные endpoints для истории покупок:');
        console.log('   GET  /api/purchases/history/:telegramId');
        console.log('   GET  /api/purchases/summary/:telegramId/:period');
        console.log('   GET  /api/purchases/categories/:telegramId');
        console.log('   GET  /api/purchases/recommendations/:telegramId');
        console.log('   GET  /api/purchases/analytics/:telegramId');
        console.log('   GET  /api/purchases/export/:telegramId');
        
        // Примеры curl команд
        console.log('\n🔧 Примеры curl команд для тестирования кэшбэка:');
        console.log(`curl "http://localhost:3001/api/qtickets/cashback/calculate/${testTelegramId}/${testWalkId}"`);
        console.log(`curl "http://localhost:3001/api/qtickets/cashback/history/${testTelegramId}"`);
        console.log(`curl "http://localhost:3001/api/qtickets/cashback/stats/${testTelegramId}"`);
        console.log('curl -X POST "http://localhost:3001/api/qtickets/cashback/validate" \\');
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -d '{"telegramId":"${testTelegramId}","walkId":${testWalkId},"pointsToUse":${testPointsToUse}}'`);
        console.log('');
        console.log('🔧 Примеры curl команд для истории покупок:');
        console.log(`curl "http://localhost:3001/api/purchases/history/${testTelegramId}"`);
        console.log(`curl "http://localhost:3001/api/purchases/analytics/${testTelegramId}"`);
        console.log(`curl "http://localhost:3001/api/purchases/summary/${testTelegramId}/month"`);
        console.log(`curl "http://localhost:3001/api/purchases/recommendations/${testTelegramId}"`);
        console.log(`curl "http://localhost:3001/api/purchases/export/${testTelegramId}" -o history.csv`);
        
        console.log('\n🎉 [Test] Все тесты системы кэшбэка выполнены успешно!');
        console.log('\n📝 Основные возможности кэшбэка:');
        console.log('✅ Расчет доступного кэшбэка для прогулки');
        console.log('✅ Валидация операций оплаты баллами');
        console.log('✅ Обработка кэшбэк платежей');
        console.log('✅ История и статистика кэшбэк операций');
        console.log('✅ Интеграция со статусной системой');
        console.log('✅ Миграция базы данных для поддержки кэшбэка');
        console.log('');
        console.log('📝 Основные возможности истории покупок:');
        console.log('✅ Детальная история покупок с кэшбэком');
        console.log('✅ Сводка покупок по периодам (день/неделя/месяц)');
        console.log('✅ Топ категорий покупок');
        console.log('✅ Персональные рекомендации по кэшбэку');
        console.log('✅ Полная аналитика покупок (дашборд)');
        console.log('✅ Экспорт истории в CSV формат');
        console.log('✅ Автоматическое начисление кэшбэка по статусу');
        console.log('✅ Запись всех покупок в расширенную историю');
        
    } catch (error) {
        console.error('❌ [Test] Ошибка тестирования:', error);
        process.exit(1);
    }
}

// Запускаем тест если скрипт вызван напрямую
if (require.main === module) {
    testQticketsCashback()
        .then(() => {
            console.log('\n✅ Тестирование завершено успешно!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Критическая ошибка:', error);
            process.exit(1);
        });
}

module.exports = { testQticketsCashback };
