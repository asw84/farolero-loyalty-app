// backend/controllers/activity-calendar.controller.js
// Контроллер для API календаря активности

const activityCalendarService = require('../services/activity-calendar.service');

class ActivityCalendarController {
    /**
     * GET /api/activity-calendar/:telegramId - Получить календарь активности пользователя
     */
    async getUserActivityCalendar(req, res) {
        try {
            const { telegramId } = req.params;
            const { startDate, endDate, period = '30' } = req.query;

            if (!telegramId) {
                return res.status(400).json({
                    success: false,
                    error: 'Telegram ID обязателен'
                });
            }

            let start = startDate;
            let end = endDate;

            // Если даты не указаны, используем период
            if (!start || !end) {
                const endDate = new Date();
                const startDate = new Date();
                startDate.setDate(endDate.getDate() - parseInt(period));
                
                start = startDate.toISOString().split('T')[0];
                end = endDate.toISOString().split('T')[0];
            }

            const result = await activityCalendarService.getUserActivityCalendar(telegramId, start, end);
            res.json(result);

        } catch (error) {
            console.error('❌ [ActivityCalendarController] Ошибка получения календаря:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * GET /api/activity-calendar/:telegramId/month/:year/:month - Получить месячную статистику
     */
    async getMonthlyActivity(req, res) {
        try {
            const { telegramId, year, month } = req.params;

            if (!telegramId) {
                return res.status(400).json({
                    success: false,
                    error: 'Telegram ID обязателен'
                });
            }

            const yearNum = parseInt(year);
            const monthNum = parseInt(month);

            if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
                return res.status(400).json({
                    success: false,
                    error: 'Некорректные год или месяц'
                });
            }

            // Проверяем, не запрашивают ли слишком далекое будущее
            const now = new Date();
            const requestedDate = new Date(yearNum, monthNum - 1);
            if (requestedDate > now) {
                return res.status(400).json({
                    success: false,
                    error: 'Нельзя запросить данные из будущего'
                });
            }

            const result = await activityCalendarService.getMonthlyActivitySummary(telegramId, yearNum, monthNum);
            res.json(result);

        } catch (error) {
            console.error('❌ [ActivityCalendarController] Ошибка получения месячной статистики:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * GET /api/activity-calendar/:telegramId/year/:year - Получить годовую статистику (heat map)
     */
    async getYearlyActivity(req, res) {
        try {
            const { telegramId, year } = req.params;

            if (!telegramId) {
                return res.status(400).json({
                    success: false,
                    error: 'Telegram ID обязателен'
                });
            }

            const yearNum = parseInt(year);
            if (isNaN(yearNum) || yearNum < 2020 || yearNum > new Date().getFullYear()) {
                return res.status(400).json({
                    success: false,
                    error: 'Некорректный год'
                });
            }

            const result = await activityCalendarService.getYearlyActivityHeatmap(telegramId, yearNum);
            res.json(result);

        } catch (error) {
            console.error('❌ [ActivityCalendarController] Ошибка получения годовой статистики:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * GET /api/activity-calendar/:telegramId/current - Получить текущую статистику (этот месяц)
     */
    async getCurrentActivity(req, res) {
        try {
            const { telegramId } = req.params;

            if (!telegramId) {
                return res.status(400).json({
                    success: false,
                    error: 'Telegram ID обязателен'
                });
            }

            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;

            const result = await activityCalendarService.getMonthlyActivitySummary(telegramId, year, month);
            res.json(result);

        } catch (error) {
            console.error('❌ [ActivityCalendarController] Ошибка получения текущей статистики:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * GET /api/activity-calendar/:telegramId/week - Получить статистику за неделю
     */
    async getWeeklyActivity(req, res) {
        try {
            const { telegramId } = req.params;
            const { weekOffset = 0 } = req.query;

            if (!telegramId) {
                return res.status(400).json({
                    success: false,
                    error: 'Telegram ID обязателен'
                });
            }

            // Рассчитываем даты недели
            const now = new Date();
            const offset = parseInt(weekOffset);
            
            // Находим понедельник текущей недели
            const monday = new Date(now);
            monday.setDate(now.getDate() - now.getDay() + 1 - (offset * 7));
            
            // Находим воскресенье
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            const startDate = monday.toISOString().split('T')[0];
            const endDate = sunday.toISOString().split('T')[0];

            const result = await activityCalendarService.getUserActivityCalendar(telegramId, startDate, endDate);
            
            if (result.success) {
                // Добавляем информацию о неделе
                result.data.week_info = {
                    week_number: this.getWeekNumber(monday),
                    start_date: startDate,
                    end_date: endDate,
                    is_current_week: offset === 0
                };
            }

            res.json(result);

        } catch (error) {
            console.error('❌ [ActivityCalendarController] Ошибка получения недельной статистики:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * GET /api/activity-calendar/:telegramId/stats - Получить общую статистику активности
     */
    async getActivityStats(req, res) {
        try {
            const { telegramId } = req.params;

            if (!telegramId) {
                return res.status(400).json({
                    success: false,
                    error: 'Telegram ID обязателен'
                });
            }

            // Получаем статистику за разные периоды
            const [week, month, year] = await Promise.all([
                this.getActivityForPeriod(telegramId, 7),
                this.getActivityForPeriod(telegramId, 30),
                this.getActivityForPeriod(telegramId, 365)
            ]);

            res.json({
                success: true,
                data: {
                    periods: {
                        last_7_days: week,
                        last_30_days: month,
                        last_365_days: year
                    },
                    trends: {
                        weekly_trend: this.calculateTrend(week.calendar),
                        monthly_trend: this.calculateTrend(month.calendar)
                    }
                }
            });

        } catch (error) {
            console.error('❌ [ActivityCalendarController] Ошибка получения общей статистики:', error);
            res.status(500).json({
                success: false,
                error: 'Ошибка сервера',
                details: error.message
            });
        }
    }

    /**
     * Вспомогательный метод для получения активности за период
     */
    async getActivityForPeriod(telegramId, days) {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);

        const endDate = end.toISOString().split('T')[0];
        const startDate = start.toISOString().split('T')[0];

        const result = await activityCalendarService.getUserActivityCalendar(telegramId, startDate, endDate);
        return result.success ? result.data : null;
    }

    /**
     * Рассчитывает тренд активности (растет/падает)
     */
    calculateTrend(calendar) {
        if (!calendar || calendar.length < 2) return 'stable';

        const halfLength = Math.floor(calendar.length / 2);
        const firstHalf = calendar.slice(0, halfLength);
        const secondHalf = calendar.slice(halfLength);

        const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.activity_score, 0) / firstHalf.length;
        const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.activity_score, 0) / secondHalf.length;

        const difference = secondHalfAvg - firstHalfAvg;

        if (difference > 1) return 'growing';
        if (difference < -1) return 'declining';
        return 'stable';
    }

    /**
     * Получает номер недели в году
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }
}

module.exports = new ActivityCalendarController();
