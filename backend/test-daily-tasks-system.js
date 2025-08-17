// backend/test-daily-tasks-system.js
// Тест системы ежедневных заданий

const { createDailyTasksTables } = require('./scripts/create-daily-tasks-tables');
const dailyTasksService = require('./services/daily-tasks.service');
const { findOrCreateUser } = require('./database');

async function testDailyTasksSystem() {
    console.log('📅 Тестирование системы ежедневных заданий...\n');

    try {
        // 1. Инициализация таблиц
        console.log('1️⃣ Инициализация таблиц ежедневных заданий...');
        await createDailyTasksTables();
        console.log('✅ Таблицы созданы\n');

        // 2. Создание тестового пользователя
        console.log('2️⃣ Создание тестового пользователя...');
        const testTelegramId = 'test_daily_tasks_user';
        await findOrCreateUser(testTelegramId, 'telegram_user_id');
        console.log(`✅ Пользователь ${testTelegramId} создан\n`);

        // 3. Генерация ежедневных заданий
        console.log('3️⃣ Генерация ежедневных заданий...');
        const today = new Date().toISOString().split('T')[0];
        const generateResult = await dailyTasksService.generateDailyTasksForUser(testTelegramId, today);
        console.log(`✅ ${generateResult.message}`);
        console.log(`   Сгенерировано заданий: ${generateResult.tasks?.length || 0}\n`);

        // 4. Получение заданий пользователя
        console.log('4️⃣ Получение ежедневных заданий пользователя...');
        const userTasks = await dailyTasksService.getUserDailyTasks(testTelegramId);
        console.log(`✅ Получено заданий: ${userTasks.data.tasks.length}`);
        console.log(`   Завершено: ${userTasks.data.completed_count}/${userTasks.data.total_count}`);
        console.log(`   Доступно баллов: ${userTasks.data.total_points_available}`);
        
        userTasks.data.tasks.forEach(task => {
            const status = task.is_completed ? '✅' : (task.current_progress > 0 ? '🔄' : '📋');
            console.log(`   ${status} ${task.icon} ${task.name} - ${task.current_progress}/${task.target_value} (${task.points_reward} баллов)`);
        });
        console.log('');

        // 5. Тест выполнения заданий
        console.log('5️⃣ Тест выполнения заданий...');
        
        // Ежедневный вход
        const checkinResult = await dailyTasksService.updateTaskProgress(testTelegramId, 'DAILY_CHECKIN', 1);
        console.log(`✅ Ежедневный вход: ${checkinResult.success ? 'выполнено' : 'ошибка'}`);
        if (checkinResult.is_completed) {
            console.log(`   🏆 Получено ${checkinResult.points_earned} баллов`);
        }

        // Просмотр профиля
        const profileResult = await dailyTasksService.updateTaskProgress(testTelegramId, 'DAILY_PROFILE_VIEW', 1);
        console.log(`✅ Просмотр профиля: ${profileResult.success ? 'выполнено' : 'ошибка'}`);
        if (profileResult.is_completed) {
            console.log(`   🏆 Получено ${profileResult.points_earned} баллов`);
        }

        // Просмотр мероприятий (частично)
        const walkResult = await dailyTasksService.updateTaskProgress(testTelegramId, 'DAILY_WALK_VIEW', 2);
        console.log(`✅ Просмотр мероприятий: ${walkResult.success ? `прогресс ${walkResult.progress}/${walkResult.target}` : 'ошибка'}`);
        
        console.log('');

        // 6. Проверка стрика
        console.log('6️⃣ Проверка стрика пользователя...');
        const streakBefore = await dailyTasksService.getUserStreak(testTelegramId);
        console.log(`✅ Стрик до: ${streakBefore.data.current_streak} дней (рекорд: ${streakBefore.data.longest_streak})`);

        // Завершаем еще одно задание для активации стрика
        const walkCompleteResult = await dailyTasksService.updateTaskProgress(testTelegramId, 'DAILY_WALK_VIEW', 1);
        console.log(`✅ Завершено задание просмотра мероприятий: ${walkCompleteResult.is_completed ? 'да' : 'нет'}`);

        const streakAfter = await dailyTasksService.getUserStreak(testTelegramId);
        console.log(`✅ Стрик после: ${streakAfter.data.current_streak} дней`);
        console.log('');

        // 7. Финальная статистика заданий
        console.log('7️⃣ Финальная статистика заданий...');
        const finalTasks = await dailyTasksService.getUserDailyTasks(testTelegramId);
        console.log(`✅ Итого завершено: ${finalTasks.data.completed_count}/${finalTasks.data.total_count} заданий`);
        console.log(`✅ Заработано баллов: ${finalTasks.data.total_points_earned}`);
        console.log(`✅ Осталось доступно: ${finalTasks.data.total_points_available} баллов\n`);

        // 8. Тест сброса заданий (имитация нового дня)
        console.log('8️⃣ Тест сброса заданий (имитация нового дня)...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];
        
        const tomorrowGenerate = await dailyTasksService.generateDailyTasksForUser(testTelegramId, tomorrowStr);
        console.log(`✅ Задания на завтра: ${tomorrowGenerate.message}`);
        console.log('');

        console.log('🎉 Все тесты системы ежедневных заданий прошли успешно!');
        
        // API endpoints для тестирования
        console.log('\n📋 API endpoints для тестирования:');
        console.log(`GET  /api/daily-tasks/${testTelegramId} - задания пользователя`);
        console.log(`POST /api/daily-tasks/${testTelegramId}/checkin - ежедневный вход`);
        console.log(`POST /api/daily-tasks/${testTelegramId}/progress - обновить прогресс`);
        console.log(`GET  /api/daily-tasks/${testTelegramId}/streak - статистика стрика`);
        console.log(`POST /api/daily-tasks/track - трекинг активности`);
        console.log(`GET  /api/daily-tasks/leaderboard/streaks - топ по стрикам`);
        console.log(`POST /api/daily-tasks/reset - сброс всех заданий (админ)`);

        console.log('\n📝 Примеры запросов:');
        console.log('# Получить задания');
        console.log(`curl http://localhost:3001/api/daily-tasks/${testTelegramId}`);
        
        console.log('\n# Ежедневный вход');
        console.log(`curl -X POST http://localhost:3001/api/daily-tasks/${testTelegramId}/checkin`);
        
        console.log('\n# Обновить прогресс задания');
        console.log(`curl -X POST http://localhost:3001/api/daily-tasks/${testTelegramId}/progress \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -d '{"taskCode":"DAILY_VK_ACTIVITY","increment":1}'`);
        
        console.log('\n# Трекинг активности');
        console.log(`curl -X POST http://localhost:3001/api/daily-tasks/track \\`);
        console.log(`  -H "Content-Type: application/json" \\`);
        console.log(`  -d '{"telegramId":"${testTelegramId}","activityType":"app_visit"}'`);

        return true;

    } catch (error) {
        console.error('❌ Ошибка тестирования системы ежедневных заданий:', error);
        throw error;
    }
}

// Запуск тестирования если файл запущен напрямую
if (require.main === module) {
    testDailyTasksSystem()
        .then(() => {
            console.log('\n✅ Тестирование завершено успешно!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Тестирование провалено:', error);
            process.exit(1);
        });
}

module.exports = { testDailyTasksSystem };
