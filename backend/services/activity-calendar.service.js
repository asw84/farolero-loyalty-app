// backend/services/activity-calendar.service.js
// Сервис для календаря активности пользователей

const { dbGet, dbAll } = require('../database');

class ActivityCalendarService {
    /**
     * Получить календарь активности пользователя за указанный период
     */
    async getUserActivityCalendar(telegramId, startDate, endDate) {
        try {
            // Если даты не указаны, берем последние 30 дней
            if (!startDate || !endDate) {
                const end = new Date();
                const start = new Date();
                start.setDate(end.getDate() - 30);
                
                endDate = end.toISOString().split('T')[0];
                startDate = start.toISOString().split('T')[0];
            }

            console.log(`📅 [ActivityCalendarService] Получение календаря для ${telegramId} с ${startDate} по ${endDate}`);

            // Собираем данные из разных источников
            const [purchases, dailyTasks, achievements, activities, streaks] = await Promise.all([
                this.getPurchaseActivity(telegramId, startDate, endDate),
                this.getDailyTasksActivity(telegramId, startDate, endDate),
                this.getAchievementsActivity(telegramId, startDate, endDate),
                this.getGeneralActivity(telegramId, startDate, endDate),
                this.getStreakActivity(telegramId, startDate, endDate)
            ]);

            // Создаем календарную сетку
            const calendar = this.buildCalendarGrid(startDate, endDate);
            
            // Заполняем календарь данными
            this.populateCalendarWithData(calendar, {
                purchases,
                dailyTasks,
                achievements,
                activities,
                streaks
            });

            // Рассчитываем статистику
            const stats = this.calculateActivityStats(calendar);

            return {
                success: true,
                data: {
                    period: { startDate, endDate },
                    calendar,
                    stats,
                    summary: {
                        total_active_days: calendar.filter(day => day.activity_score > 0).length,
                        total_days: calendar.length,
                        activity_rate: Math.round((calendar.filter(day => day.activity_score > 0).length / calendar.length) * 100),
                        longest_streak: stats.longest_streak,
                        current_streak: stats.current_streak
                    }
                }
            };

        } catch (error) {
            console.error('❌ [ActivityCalendarService] Ошибка получения календаря:', error);
            throw error;
        }
    }

    /**
     * Получить активность покупок
     */
    async getPurchaseActivity(telegramId, startDate, endDate) {
        try {
            const purchases = await dbAll(`
                SELECT 
                    DATE(purchase_date) as date,
                    COUNT(*) as count,
                    SUM(amount) as total_amount
                FROM purchases 
                WHERE user_telegram_id = ? 
                    AND DATE(purchase_date) BETWEEN ? AND ?
                GROUP BY DATE(purchase_date)
                ORDER BY date
            `, [telegramId, startDate, endDate]);

            return purchases.reduce((acc, purchase) => {
                acc[purchase.date] = {
                    count: purchase.count,
                    total_amount: purchase.total_amount
                };
                return acc;
            }, {});

        } catch (error) {
            console.error('❌ Ошибка получения данных покупок:', error);
            return {};
        }
    }

    /**
     * Получить активность ежедневных заданий
     */
    async getDailyTasksActivity(telegramId, startDate, endDate) {
        try {
            const tasks = await dbAll(`
                SELECT 
                    task_date as date,
                    COUNT(*) as total_tasks,
                    COUNT(CASE WHEN is_completed = 1 THEN 1 END) as completed_tasks,
                    SUM(points_earned) as points_earned
                FROM user_daily_tasks
                WHERE user_telegram_id = ? 
                    AND task_date BETWEEN ? AND ?
                GROUP BY task_date
                ORDER BY task_date
            `, [telegramId, startDate, endDate]);

            return tasks.reduce((acc, task) => {
                acc[task.date] = {
                    total_tasks: task.total_tasks,
                    completed_tasks: task.completed_tasks,
                    completion_rate: Math.round((task.completed_tasks / task.total_tasks) * 100),
                    points_earned: task.points_earned || 0
                };
                return acc;
            }, {});

        } catch (error) {
            console.error('❌ Ошибка получения данных заданий:', error);
            return {};
        }
    }

    /**
     * Получить активность достижений
     */
    async getAchievementsActivity(telegramId, startDate, endDate) {
        try {
            const achievements = await dbAll(`
                SELECT 
                    DATE(unlocked_at) as date,
                    COUNT(*) as count,
                    GROUP_CONCAT(a.name) as achievement_names
                FROM user_achievements ua
                JOIN achievements a ON ua.achievement_id = a.id
                WHERE ua.user_telegram_id = ? 
                    AND ua.is_completed = 1
                    AND DATE(ua.unlocked_at) BETWEEN ? AND ?
                GROUP BY DATE(unlocked_at)
                ORDER BY date
            `, [telegramId, startDate, endDate]);

            return achievements.reduce((acc, achievement) => {
                acc[achievement.date] = {
                    count: achievement.count,
                    names: achievement.achievement_names ? achievement.achievement_names.split(',') : []
                };
                return acc;
            }, {});

        } catch (error) {
            console.error('❌ Ошибка получения данных достижений:', error);
            return {};
        }
    }

    /**
     * Получить общую активность (лайки, комментарии и т.д.)
     */
    async getGeneralActivity(telegramId, startDate, endDate) {
        try {
            const activities = await dbAll(`
                SELECT 
                    DATE(created_at) as date,
                    activity_type,
                    COUNT(*) as count,
                    SUM(points_awarded) as points_awarded
                FROM activity a
                JOIN users u ON a.user_id = u.id
                WHERE u.telegram_user_id = ? 
                    AND DATE(a.created_at) BETWEEN ? AND ?
                GROUP BY DATE(created_at), activity_type
                ORDER BY date, activity_type
            `, [telegramId, startDate, endDate]);

            const groupedActivities = {};
            
            activities.forEach(activity => {
                if (!groupedActivities[activity.date]) {
                    groupedActivities[activity.date] = {
                        types: {},
                        total_points: 0,
                        total_actions: 0
                    };
                }
                
                groupedActivities[activity.date].types[activity.activity_type] = {
                    count: activity.count,
                    points: activity.points_awarded || 0
                };
                
                groupedActivities[activity.date].total_points += activity.points_awarded || 0;
                groupedActivities[activity.date].total_actions += activity.count;
            });

            return groupedActivities;

        } catch (error) {
            console.error('❌ Ошибка получения общей активности:', error);
            return {};
        }
    }

    /**
     * Получить данные стриков
     */
    async getStreakActivity(telegramId, startDate, endDate) {
        try {
            // Получаем информацию о стрике пользователя
            const streak = await dbGet(
                'SELECT * FROM user_streaks WHERE user_telegram_id = ?',
                [telegramId]
            );

            if (!streak) {
                return {};
            }

            // Симулируем историю стрика (в реальной версии нужна отдельная таблица истории)
            const streakHistory = {};
            
            if (streak.last_activity_date) {
                const lastActivity = new Date(streak.last_activity_date);
                const start = new Date(startDate);
                const end = new Date(endDate);

                // Заполняем дни стрика (упрощенная логика)
                for (let d = new Date(Math.max(lastActivity.getTime() - (streak.current_streak - 1) * 24 * 60 * 60 * 1000, start.getTime())); 
                     d <= Math.min(lastActivity.getTime(), end.getTime()); 
                     d.setDate(d.getDate() + 1)) {
                    
                    const dateStr = d.toISOString().split('T')[0];
                    if (dateStr >= startDate && dateStr <= endDate) {
                        streakHistory[dateStr] = {
                            is_streak_day: true,
                            streak_number: Math.floor((d.getTime() - (lastActivity.getTime() - (streak.current_streak - 1) * 24 * 60 * 60 * 1000)) / (24 * 60 * 60 * 1000)) + 1
                        };
                    }
                }
            }

            return streakHistory;

        } catch (error) {
            console.error('❌ Ошибка получения данных стрика:', error);
            return {};
        }
    }

    /**
     * Создает календарную сетку для указанного периода
     */
    buildCalendarGrid(startDate, endDate) {
        const calendar = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            const dayOfWeek = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
            
            calendar.push({
                date: dateStr,
                day_of_week: dayOfWeek,
                day_name: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][dayOfWeek],
                is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
                is_today: dateStr === new Date().toISOString().split('T')[0],
                activity_score: 0,
                activities: {
                    purchases: null,
                    daily_tasks: null,
                    achievements: null,
                    general: null,
                    streak: null
                },
                summary: {
                    total_points_earned: 0,
                    total_actions: 0,
                    activity_types: []
                }
            });
        }

        return calendar;
    }

    /**
     * Заполняет календарь данными активности
     */
    populateCalendarWithData(calendar, data) {
        calendar.forEach(day => {
            const date = day.date;
            
            // Покупки
            if (data.purchases[date]) {
                day.activities.purchases = data.purchases[date];
                day.activity_score += data.purchases[date].count * 3; // Покупки весят больше
                day.summary.total_actions += data.purchases[date].count;
                day.summary.activity_types.push('Покупки');
            }

            // Ежедневные задания
            if (data.dailyTasks[date]) {
                day.activities.daily_tasks = data.dailyTasks[date];
                day.activity_score += data.dailyTasks[date].completed_tasks;
                day.summary.total_points_earned += data.dailyTasks[date].points_earned;
                day.summary.total_actions += data.dailyTasks[date].completed_tasks;
                if (data.dailyTasks[date].completed_tasks > 0) {
                    day.summary.activity_types.push('Задания');
                }
            }

            // Достижения
            if (data.achievements[date]) {
                day.activities.achievements = data.achievements[date];
                day.activity_score += data.achievements[date].count * 5; // Достижения весят много
                day.summary.total_actions += data.achievements[date].count;
                day.summary.activity_types.push('Достижения');
            }

            // Общая активность
            if (data.activities[date]) {
                day.activities.general = data.activities[date];
                day.activity_score += Math.min(data.activities[date].total_actions, 10); // Ограничиваем влияние
                day.summary.total_points_earned += data.activities[date].total_points;
                day.summary.total_actions += data.activities[date].total_actions;
                if (data.activities[date].total_actions > 0) {
                    day.summary.activity_types.push('Активность');
                }
            }

            // Стрик
            if (data.streaks[date]) {
                day.activities.streak = data.streaks[date];
                day.activity_score += 2; // Бонус за стрик
                day.summary.activity_types.push('Стрик');
            }

            // Определяем уровень активности
            if (day.activity_score >= 10) {
                day.activity_level = 'high';
            } else if (day.activity_score >= 5) {
                day.activity_level = 'medium';
            } else if (day.activity_score > 0) {
                day.activity_level = 'low';
            } else {
                day.activity_level = 'none';
            }
        });
    }

    /**
     * Рассчитывает статистику активности
     */
    calculateActivityStats(calendar) {
        const stats = {
            total_days: calendar.length,
            active_days: calendar.filter(day => day.activity_score > 0).length,
            high_activity_days: calendar.filter(day => day.activity_level === 'high').length,
            medium_activity_days: calendar.filter(day => day.activity_level === 'medium').length,
            low_activity_days: calendar.filter(day => day.activity_level === 'low').length,
            total_points: calendar.reduce((sum, day) => sum + day.summary.total_points_earned, 0),
            total_actions: calendar.reduce((sum, day) => sum + day.summary.total_actions, 0),
            average_activity_score: 0,
            current_streak: 0,
            longest_streak: 0,
            weekend_activity: 0,
            weekday_activity: 0
        };

        // Средний балл активности
        stats.average_activity_score = stats.active_days > 0 
            ? Math.round(calendar.reduce((sum, day) => sum + day.activity_score, 0) / stats.active_days * 10) / 10
            : 0;

        // Подсчет стриков
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        // Проходим с конца для текущего стрика
        for (let i = calendar.length - 1; i >= 0; i--) {
            if (calendar[i].activity_score > 0) {
                if (i === calendar.length - 1 || (i === calendar.length - 2 && calendar[calendar.length - 1].is_today && calendar[calendar.length - 1].activity_score === 0)) {
                    currentStreak++;
                } else if (currentStreak > 0) {
                    currentStreak++;
                } else {
                    break;
                }
            } else if (currentStreak > 0) {
                break;
            }
        }

        // Находим самый длинный стрик
        for (const day of calendar) {
            if (day.activity_score > 0) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }

        stats.current_streak = currentStreak;
        stats.longest_streak = longestStreak;

        // Активность в выходные vs будни
        const weekendDays = calendar.filter(day => day.is_weekend);
        const weekdayDays = calendar.filter(day => !day.is_weekend);

        stats.weekend_activity = weekendDays.length > 0 
            ? Math.round((weekendDays.filter(day => day.activity_score > 0).length / weekendDays.length) * 100)
            : 0;

        stats.weekday_activity = weekdayDays.length > 0 
            ? Math.round((weekdayDays.filter(day => day.activity_score > 0).length / weekdayDays.length) * 100)
            : 0;

        return stats;
    }

    /**
     * Получить месячную статистику активности
     */
    async getMonthlyActivitySummary(telegramId, year, month) {
        try {
            // Определяем первый и последний день месяца
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0); // Последний день месяца

            const startDateStr = startDate.toISOString().split('T')[0];
            const endDateStr = endDate.toISOString().split('T')[0];

            // Получаем календарь активности
            const calendarResult = await this.getUserActivityCalendar(telegramId, startDateStr, endDateStr);

            if (!calendarResult.success) {
                throw new Error('Ошибка получения календаря активности');
            }

            const calendar = calendarResult.data.calendar;
            const stats = calendarResult.data.stats;

            // Создаем недельную разбивку
            const weeks = [];
            let currentWeek = [];

            // Добавляем пустые дни в начале месяца до понедельника
            const firstDayOfWeek = startDate.getDay();
            const mondayOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Понедельник = 0

            for (let i = 0; i < mondayOffset; i++) {
                currentWeek.push(null);
            }

            // Добавляем дни месяца
            calendar.forEach((day, index) => {
                currentWeek.push(day);

                if (currentWeek.length === 7) {
                    weeks.push([...currentWeek]);
                    currentWeek = [];
                }
            });

            // Дополняем последнюю неделю
            while (currentWeek.length > 0 && currentWeek.length < 7) {
                currentWeek.push(null);
            }
            if (currentWeek.length > 0) {
                weeks.push(currentWeek);
            }

            return {
                success: true,
                data: {
                    year,
                    month,
                    month_name: new Date(year, month - 1).toLocaleDateString('ru-RU', { month: 'long' }),
                    weeks,
                    stats,
                    summary: calendarResult.data.summary
                }
            };

        } catch (error) {
            console.error('❌ [ActivityCalendarService] Ошибка получения месячной статистики:', error);
            throw error;
        }
    }

    /**
     * Получить годовую статистику активности (heat map)
     */
    async getYearlyActivityHeatmap(telegramId, year) {
        try {
            const startDate = `${year}-01-01`;
            const endDate = `${year}-12-31`;

            console.log(`📅 [ActivityCalendarService] Получение годовой статистики для ${telegramId} за ${year} год`);

            const calendarResult = await this.getUserActivityCalendar(telegramId, startDate, endDate);

            if (!calendarResult.success) {
                throw new Error('Ошибка получения календаря активности');
            }

            const calendar = calendarResult.data.calendar;

            // Группируем по месяцам
            const months = {};
            calendar.forEach(day => {
                const monthKey = day.date.substring(0, 7); // YYYY-MM
                if (!months[monthKey]) {
                    months[monthKey] = [];
                }
                months[monthKey].push(day);
            });

            // Создаем heat map данные
            const heatmapData = calendar.map(day => ({
                date: day.date,
                activity_level: day.activity_level,
                activity_score: day.activity_score,
                tooltip: {
                    date: new Date(day.date).toLocaleDateString('ru-RU'),
                    points: day.summary.total_points_earned,
                    actions: day.summary.total_actions,
                    types: day.summary.activity_types
                }
            }));

            return {
                success: true,
                data: {
                    year,
                    heatmap: heatmapData,
                    months_summary: Object.keys(months).map(monthKey => {
                        const monthDays = months[monthKey];
                        const monthStats = this.calculateActivityStats(monthDays);
                        return {
                            month: monthKey,
                            month_name: new Date(monthKey + '-01').toLocaleDateString('ru-RU', { month: 'long' }),
                            stats: monthStats
                        };
                    }),
                    yearly_stats: calendarResult.data.stats
                }
            };

        } catch (error) {
            console.error('❌ [ActivityCalendarService] Ошибка получения годовой статистики:', error);
            throw error;
        }
    }
}

module.exports = new ActivityCalendarService();
