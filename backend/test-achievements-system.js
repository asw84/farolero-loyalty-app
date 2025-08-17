// backend/test-achievements-system.js
// Тест системы достижений

const { createAchievementsTables } = require('./scripts/create-achievements-tables');
const achievementsService = require('./services/achievements.service');
const { findOrCreateUser, addPointsByTelegramId, addPurchase } = require('./database');

async function testAchievementsSystem() {
    console.log('🎯 Тестирование системы достижений...\n');

    try {
        // 1. Инициализация таблиц
        console.log('1️⃣ Инициализация таблиц достижений...');
        await createAchievementsTables();
        console.log('✅ Таблицы созданы\n');

        // 2. Создание тестового пользователя
        console.log('2️⃣ Создание тестового пользователя...');
        const testTelegramId = 'test_achievements_user';
        await findOrCreateUser(testTelegramId, 'telegram_user_id');
        console.log(`✅ Пользователь ${testTelegramId} создан\n`);

        // 3. Проверка всех достижений
        console.log('3️⃣ Получение всех достижений...');
        const allAchievements = await achievementsService.getAllAchievements();
        console.log(`✅ Найдено ${allAchievements.data.length} достижений:`);
        allAchievements.data.forEach(a => {
            console.log(`   ${a.icon} ${a.name} - ${a.description} (${a.points_reward} баллов)`);
        });
        console.log('');

        // 4. Проверка достижений пользователя (должно быть пусто)
        console.log('4️⃣ Проверка достижений нового пользователя...');
        const userAchievements = await achievementsService.getUserAchievements(testTelegramId);
        const completed = userAchievements.data.filter(a => a.is_completed);
        console.log(`✅ Завершенных достижений: ${completed.length}`);
        console.log('');

        // 5. Тест достижения "Первая покупка"
        console.log('5️⃣ Тест достижения "Первая покупка"...');
        await addPurchase(testTelegramId, 1000, 'qtickets', 'test_order_1');
        const checkResult1 = await achievementsService.checkAndUnlockAchievements(testTelegramId, 'purchase');
        console.log(`✅ Разблокировано достижений: ${checkResult1.totalUnlocked}`);
        if (checkResult1.newlyUnlocked.length > 0) {
            checkResult1.newlyUnlocked.forEach(a => {
                console.log(`   🏆 ${a.name} (+${a.points_reward} баллов)`);
            });
        }
        console.log('');

        // 6. Тест достижений по баллам
        console.log('6️⃣ Тест достижений по баллам...');
        await addPointsByTelegramId(testTelegramId, 900, 'manual', 'test_points');
        const checkResult2 = await achievementsService.checkAndUnlockAchievements(testTelegramId, 'points');
        console.log(`✅ Разблокировано достижений: ${checkResult2.totalUnlocked}`);
        if (checkResult2.newlyUnlocked.length > 0) {
            checkResult2.newlyUnlocked.forEach(a => {
                console.log(`   🏆 ${a.name} (+${a.points_reward} баллов)`);
            });
        }
        console.log('');

        // 7. Добавляем рефералов для тестирования
        console.log('7️⃣ Тест достижений по рефералам...');
        const { dbRun } = require('./database');
        await dbRun(`
            INSERT OR IGNORE INTO referrals 
            (referrer_telegram_id, referee_telegram_id, referral_code, activated_at, bonus_paid)
            VALUES (?, ?, ?, ?, ?)
        `, [testTelegramId, 'referee_1', 'TEST_REF_1', new Date().toISOString(), true]);
        
        const checkResult3 = await achievementsService.checkAndUnlockAchievements(testTelegramId, 'referral');
        console.log(`✅ Разблокировано достижений: ${checkResult3.totalUnlocked}`);
        if (checkResult3.newlyUnlocked.length > 0) {
            checkResult3.newlyUnlocked.forEach(a => {
                console.log(`   🏆 ${a.name} (+${a.points_reward} баллов)`);
            });
        }
        console.log('');

        // 8. Финальная проверка достижений пользователя
        console.log('8️⃣ Финальная проверка достижений пользователя...');
        const finalAchievements = await achievementsService.getUserAchievements(testTelegramId);
        const finalCompleted = finalAchievements.data.filter(a => a.is_completed);
        const inProgress = finalAchievements.data.filter(a => !a.is_completed && a.current_progress > 0);
        
        console.log(`✅ Завершенных достижений: ${finalCompleted.length}`);
        finalCompleted.forEach(a => {
            console.log(`   ✅ ${a.icon} ${a.name} - разблокировано ${new Date(a.unlocked_at).toLocaleString()}`);
        });
        
        console.log(`📊 В процессе: ${inProgress.length}`);
        inProgress.forEach(a => {
            console.log(`   🔄 ${a.icon} ${a.name} - ${a.current_progress}/${a.condition_value} (${a.progress_percentage}%)`);
        });
        console.log('');

        // 9. Тест статистики
        console.log('9️⃣ Тест статистики достижений...');
        const stats = await achievementsService.getUserAchievementsStats(testTelegramId);
        console.log(`✅ Статистика пользователя:`);
        console.log(`   Всего достижений: ${stats.data.total_achievements}`);
        console.log(`   Завершено: ${stats.data.completed_achievements}`);
        console.log(`   Процент завершения: ${stats.data.completion_rate}%`);
        console.log(`   Баллов от достижений: ${stats.data.total_points_from_achievements}`);
        console.log('');

        // 10. Тест топа пользователей
        console.log('🔟 Тест топа пользователей...');
        const leaderboard = await achievementsService.getAchievementsLeaderboard(5);
        console.log(`✅ Топ пользователей по достижениям:`);
        leaderboard.data.forEach((user, index) => {
            console.log(`   ${index + 1}. ${user.user_telegram_id} - ${user.achievements_count} достижений (${user.points_from_achievements} баллов)`);
        });

        console.log('\n🎉 Все тесты системы достижений прошли успешно!');
        
        // API endpoints для тестирования
        console.log('\n📋 API endpoints для тестирования:');
        console.log(`GET  /api/achievements - все достижения`);
        console.log(`GET  /api/achievements/user/${testTelegramId} - достижения пользователя`);
        console.log(`GET  /api/achievements/stats/${testTelegramId} - статистика пользователя`);
        console.log(`POST /api/achievements/check/${testTelegramId} - проверить достижения`);
        console.log(`GET  /api/achievements/leaderboard - топ пользователей`);
        console.log(`GET  /api/achievements/categories - категории достижений`);

        return true;

    } catch (error) {
        console.error('❌ Ошибка тестирования системы достижений:', error);
        throw error;
    }
}

// Запуск тестирования если файл запущен напрямую
if (require.main === module) {
    testAchievementsSystem()
        .then(() => {
            console.log('\n✅ Тестирование завершено успешно!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Тестирование провалено:', error);
            process.exit(1);
        });
}

module.exports = { testAchievementsSystem };
