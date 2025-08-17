// backend/test-activity-calendar-system.js
// Тест системы календаря активности

const activityCalendarService = require('./services/activity-calendar.service');
const { findOrCreateUser, addPointsByTelegramId, addPurchase, dbRun } = require('./database');

async function testActivityCalendarSystem() {
    console.log('📅 Тестирование системы календаря активности...\n');

    try {
        // 1. Создание тестового пользователя
        console.log('1️⃣ Создание тестового пользователя...');
        const testTelegramId = 'test_calendar_user';
        await findOrCreateUser(testTelegramId, 'telegram_user_id');
        console.log(`✅ Пользователь ${testTelegramId} создан\n`);

        // 2. Генерация тестовых данных за последние 30 дней
        console.log('2️⃣ Генерация тестовых данных...');
        await generateTestActivityData(testTelegramId);
        console.log('✅ Тестовые данные созданы\n');

        // 3. Тест календаря за последние 30 дней
        console.log('3️⃣ Тест календаря за последние 30 дней...');
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);
        
        const endDate = end.toISOString().split('T')[0];
        const startDate = start.toISOString().split('T')[0];
        
        const calendar30 = await activityCalendarService.getUserActivityCalendar(testTelegramId, startDate, endDate);
        console.log(`✅ Календарь получен: ${calendar30.data.calendar.length} дней`);
        console.log(`   Активных дней: ${calendar30.data.summary.total_active_days}/${calendar30.data.summary.total_days}`);
        console.log(`   Процент активности: ${calendar30.data.summary.activity_rate}%`);
        console.log(`   Текущий стрик: ${calendar30.data.summary.current_streak} дней`);
        console.log(`   Лучший стрик: ${calendar30.data.summary.longest_streak} дней\n`);

        // Показываем примеры дней
        const activeDays = calendar30.data.calendar.filter(day => day.activity_score > 0).slice(0, 5);
        console.log('📊 Примеры активных дней:');
        activeDays.forEach(day => {
            console.log(`   ${day.date} (${day.day_name}): ${day.activity_level} уровень, ${day.activity_score} баллов`);
            console.log(`      Активности: ${day.summary.activity_types.join(', ')}`);
            console.log(`      Заработано: ${day.summary.total_points_earned} баллов, ${day.summary.total_actions} действий`);
        });
        console.log('');

        // 4. Тест месячной статистики
        console.log('4️⃣ Тест месячной статистики...');
        const now = new Date();
        const monthlyStats = await activityCalendarService.getMonthlyActivitySummary(
            testTelegramId, 
            now.getFullYear(), 
            now.getMonth() + 1
        );
        
        console.log(`✅ Месячная статистика за ${monthlyStats.data.month_name} ${monthlyStats.data.year}:`);
        console.log(`   Недель в месяце: ${monthlyStats.data.weeks.length}`);
        console.log(`   Активных дней: ${monthlyStats.data.stats.active_days}`);
        console.log(`   Высокая активность: ${monthlyStats.data.stats.high_activity_days} дней`);
        console.log(`   Средняя активность: ${monthlyStats.data.stats.medium_activity_days} дней`);
        console.log(`   Низкая активность: ${monthlyStats.data.stats.low_activity_days} дней`);
        console.log(`   Всего баллов: ${monthlyStats.data.stats.total_points}`);
        console.log(`   Всего действий: ${monthlyStats.data.stats.total_actions}`);
        console.log(`   Активность в выходные: ${monthlyStats.data.stats.weekend_activity}%`);
        console.log(`   Активность в будни: ${monthlyStats.data.stats.weekday_activity}%\n`);

        // 5. Тест годовой статистики (heat map)
        console.log('5️⃣ Тест годовой статистики...');
        const yearlyStats = await activityCalendarService.getYearlyActivityHeatmap(testTelegramId, now.getFullYear());
        
        console.log(`✅ Годовая статистика за ${yearlyStats.data.year} год:`);
        console.log(`   Всего дней с данными: ${yearlyStats.data.heatmap.length}`);
        console.log(`   Месяцев с активностью: ${yearlyStats.data.months_summary.length}`);
        console.log('');

        // Показываем статистику по месяцам
        console.log('📊 Статистика по месяцам:');
        yearlyStats.data.months_summary.forEach(month => {
            if (month.stats.active_days > 0) {
                console.log(`   ${month.month_name}: ${month.stats.active_days} активных дней, ${month.stats.total_points} баллов`);
            }
        });
        console.log('');

        // 6. Анализ heat map данных
        console.log('6️⃣ Анализ активности по уровням...');
        const heatmapLevels = {
            none: yearlyStats.data.heatmap.filter(day => day.activity_level === 'none').length,
            low: yearlyStats.data.heatmap.filter(day => day.activity_level === 'low').length,
            medium: yearlyStats.data.heatmap.filter(day => day.activity_level === 'medium').length,
            high: yearlyStats.data.heatmap.filter(day => day.activity_level === 'high').length
        };

        console.log('✅ Распределение по уровням активности:');
        console.log(`   🔴 Нет активности: ${heatmapLevels.none} дней`);
        console.log(`   🟡 Низкая активность: ${heatmapLevels.low} дней`);
        console.log(`   🟠 Средняя активность: ${heatmapLevels.medium} дней`);
        console.log(`   🟢 Высокая активность: ${heatmapLevels.high} дней\n`);

        // 7. Примеры дней с разным уровнем активности
        console.log('7️⃣ Примеры дней по уровням активности...');
        
        const exampleHigh = yearlyStats.data.heatmap.find(day => day.activity_level === 'high');
        const exampleMedium = yearlyStats.data.heatmap.find(day => day.activity_level === 'medium');
        const exampleLow = yearlyStats.data.heatmap.find(day => day.activity_level === 'low');

        if (exampleHigh) {
            console.log(`🟢 Высокая активность (${exampleHigh.date}): ${exampleHigh.activity_score} баллов`);
            console.log(`   ${exampleHigh.tooltip.points} баллов, ${exampleHigh.tooltip.actions} действий`);
            console.log(`   Типы: ${exampleHigh.tooltip.types.join(', ')}`);
        }

        if (exampleMedium) {
            console.log(`🟠 Средняя активность (${exampleMedium.date}): ${exampleMedium.activity_score} баллов`);
        }

        if (exampleLow) {
            console.log(`🟡 Низкая активность (${exampleLow.date}): ${exampleLow.activity_score} баллов`);
        }
        console.log('');

        console.log('🎉 Все тесты системы календаря активности прошли успешно!');
        
        // API endpoints для тестирования
        console.log('\n📋 API endpoints для тестирования:');
        console.log(`GET  /api/activity-calendar/${testTelegramId} - календарь за период`);
        console.log(`GET  /api/activity-calendar/${testTelegramId}/current - текущий месяц`);
        console.log(`GET  /api/activity-calendar/${testTelegramId}/stats - общая статистика`);
        console.log(`GET  /api/activity-calendar/${testTelegramId}/week - недельная активность`);
        console.log(`GET  /api/activity-calendar/${testTelegramId}/month/2025/1 - месячная активность`);
        console.log(`GET  /api/activity-calendar/${testTelegramId}/year/2025 - годовая активность`);

        console.log('\n📝 Примеры запросов:');
        console.log('# Календарь за последние 7 дней');
        console.log(`curl "http://localhost:3001/api/activity-calendar/${testTelegramId}?period=7"`);
        
        console.log('\n# Текущий месяц');
        console.log(`curl http://localhost:3001/api/activity-calendar/${testTelegramId}/current`);
        
        console.log('\n# Недельная активность');
        console.log(`curl "http://localhost:3001/api/activity-calendar/${testTelegramId}/week?weekOffset=0"`);
        
        console.log('\n# Годовая heat map');
        console.log(`curl http://localhost:3001/api/activity-calendar/${testTelegramId}/year/2025`);

        return true;

    } catch (error) {
        console.error('❌ Ошибка тестирования системы календаря:', error);
        throw error;
    }
}

/**
 * Генерирует тестовые данные активности за последние 30 дней
 */
async function generateTestActivityData(telegramId) {
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        // Вероятность активности (выше в будни)
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const activityChance = isWeekend ? 0.6 : 0.8;
        
        if (Math.random() < activityChance) {
            // Генерируем случайную активность
            
            // Покупки (реже)
            if (Math.random() < 0.2) {
                await addPurchase(telegramId, Math.floor(Math.random() * 5000) + 1000, 'qtickets', `test_order_${i}`);
                console.log(`   💳 Покупка ${dateStr}`);
            }
            
            // Начисление баллов (активность)
            if (Math.random() < 0.7) {
                const points = Math.floor(Math.random() * 50) + 10;
                await addPointsByTelegramId(telegramId, points, 'test_activity', `test_action_${i}`);
            }
            
            // Ежедневные задания (симуляция)
            if (Math.random() < 0.8) {
                try {
                    await dbRun(`
                        INSERT OR IGNORE INTO user_daily_tasks 
                        (user_telegram_id, daily_task_id, task_date, current_progress, is_completed, points_earned)
                        VALUES (?, 1, ?, 1, 1, 10)
                    `, [telegramId, dateStr]);
                } catch (error) {
                    // Игнорируем ошибки для тестовых данных
                }
            }
            
            // Дополнительные задания
            if (Math.random() < 0.4) {
                try {
                    await dbRun(`
                        INSERT OR IGNORE INTO user_daily_tasks 
                        (user_telegram_id, daily_task_id, task_date, current_progress, is_completed, points_earned)
                        VALUES (?, 2, ?, 1, 1, 15)
                    `, [telegramId, dateStr]);
                } catch (error) {
                    // Игнорируем ошибки для тестовых данных
                }
            }
        }
    }
    
    console.log(`✅ Сгенерированы тестовые данные за 30 дней`);
}

// Запуск тестирования если файл запущен напрямую
if (require.main === module) {
    testActivityCalendarSystem()
        .then(() => {
            console.log('\n✅ Тестирование завершено успешно!');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Тестирование провалено:', error);
            process.exit(1);
        });
}

module.exports = { testActivityCalendarSystem };
