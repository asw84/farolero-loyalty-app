// backend/services/daily-tasks.service.js
// Сервис для работы с ежедневными заданиями

const { dbRun, dbGet, dbAll, findUserByTelegramId, addPointsByTelegramId } = require('../database');
const achievementsService = require('./achievements.service');

class DailyTasksService {
    /**
     * Получить ежедневные задания для пользователя на сегодня
     */
    async getUserDailyTasks(telegramId) {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Сначала убеждаемся что задания на сегодня сгенерированы
            await this.generateDailyTasksForUser(telegramId, today);
            
            // Получаем задания с прогрессом
            const userTasks = await dbAll(`
                SELECT 
                    dt.*,
                    udt.current_progress,
                    udt.is_completed,
                    udt.completed_at,
                    udt.points_earned
                FROM daily_tasks dt
                JOIN user_daily_tasks udt ON dt.id = udt.daily_task_id
                WHERE udt.user_telegram_id = ? 
                    AND udt.task_date = ?
                    AND dt.is_active = 1
                ORDER BY 
                    udt.is_completed ASC,
                    dt.difficulty ASC,
                    dt.points_reward DESC
            `, [telegramId, today]);

            // Добавляем расчет прогресса в процентах
            const tasksWithProgress = userTasks.map(task => ({
                ...task,
                progress_percentage: Math.min(100, Math.round((task.current_progress / task.target_value) * 100)),
                is_available: !task.is_completed && task.current_progress < task.target_value
            }));

            return {
                success: true,
                data: {
                    date: today,
                    tasks: tasksWithProgress,
                    completed_count: tasksWithProgress.filter(t => t.is_completed).length,
                    total_count: tasksWithProgress.length,
                    total_points_available: tasksWithProgress.reduce((sum, t) => sum + (t.is_completed ? 0 : t.points_reward), 0),
                    total_points_earned: tasksWithProgress.reduce((sum, t) => sum + t.points_earned, 0)
                }
            };
        } catch (error) {
            console.error('❌ [DailyTasksService] Ошибка получения ежедневных заданий:', error);
            throw error;
        }
    }

    /**
     * Генерирует ежедневные задания для пользователя на указанную дату
     */
    async generateDailyTasksForUser(telegramId, date) {
        try {
            // Проверяем, есть ли уже задания на эту дату
            const existingTasks = await dbGet(
                'SELECT COUNT(*) as count FROM user_daily_tasks WHERE user_telegram_id = ? AND task_date = ?',
                [telegramId, date]
            );

            if (existingTasks.count > 0) {
                // Задания уже сгенерированы
                return { success: true, message: 'Задания уже сгенерированы' };
            }

            // Получаем пользователя для проверки его статуса и предпочтений
            const user = await findUserByTelegramId(telegramId);
            if (!user) {
                throw new Error('Пользователь не найден');
            }

            // Выбираем задания с учетом уровня пользователя
            const selectedTasks = await this.selectTasksForUser(user, date);

            // Создаем записи для пользователя
            for (const task of selectedTasks) {
                await dbRun(`
                    INSERT INTO user_daily_tasks 
                    (user_telegram_id, daily_task_id, task_date)
                    VALUES (?, ?, ?)
                `, [telegramId, task.id, date]);
            }

            console.log(`📅 [DailyTasksService] Сгенерировано ${selectedTasks.length} заданий для ${telegramId} на ${date}`);

            return {
                success: true,
                message: `Сгенерировано ${selectedTasks.length} заданий`,
                tasks: selectedTasks
            };

        } catch (error) {
            console.error('❌ [DailyTasksService] Ошибка генерации заданий:', error);
            throw error;
        }
    }

    /**
     * Выбирает подходящие задания для пользователя
     */
    async selectTasksForUser(user, date) {
        try {
            // Получаем все доступные задания
            const allTasks = await dbAll(
                'SELECT * FROM daily_tasks WHERE is_active = 1'
            );

            // Логика выбора заданий
            const selectedTasks = [];
            
            // 1. Всегда добавляем базовые задания
            const basicTasks = allTasks.filter(task => 
                ['DAILY_CHECKIN', 'DAILY_PROFILE_VIEW'].includes(task.code)
            );
            selectedTasks.push(...basicTasks);

            // 2. Добавляем социальные задания (если подключены соцсети)
            if (user.vk_user_id) {
                const vkTask = allTasks.find(task => task.code === 'DAILY_VK_ACTIVITY');
                if (vkTask) selectedTasks.push(vkTask);
            }

            if (user.instagram_user_id) {
                const instagramTask = allTasks.find(task => task.code === 'DAILY_INSTAGRAM_ACTIVITY');
                if (instagramTask) selectedTasks.push(instagramTask);
            }

            // 3. Добавляем одно случайное задание средней сложности
            const mediumTasks = allTasks.filter(task => 
                task.difficulty === 'medium' && 
                !selectedTasks.some(st => st.id === task.id)
            );
            if (mediumTasks.length > 0) {
                const randomMedium = mediumTasks[Math.floor(Math.random() * mediumTasks.length)];
                selectedTasks.push(randomMedium);
            }

            // 4. Добавляем сложные задания с вероятностью (зависит от статуса)
            const statusMultiplier = this.getStatusMultiplier(user.status);
            const hardTasks = allTasks.filter(task => 
                task.difficulty === 'hard' && 
                !selectedTasks.some(st => st.id === task.id)
            );
            
            for (const hardTask of hardTasks) {
                if (Math.random() < 0.3 * statusMultiplier) { // 30% базовая вероятность
                    selectedTasks.push(hardTask);
                }
            }

            // 5. Ограничиваем количество заданий (5-7 максимум)
            const maxTasks = Math.min(7, Math.max(5, selectedTasks.length));
            return selectedTasks.slice(0, maxTasks);

        } catch (error) {
            console.error('❌ [DailyTasksService] Ошибка выбора заданий:', error);
            throw error;
        }
    }

    /**
     * Возвращает множитель вероятности для сложных заданий по статусу
     */
    getStatusMultiplier(status) {
        switch (status) {
            case 'Платина': return 2.0;
            case 'Золото': return 1.5;
            case 'Серебро': return 1.2;
            default: return 1.0;
        }
    }

    /**
     * Отмечает прогресс выполнения задания
     */
    async updateTaskProgress(telegramId, taskCode, increment = 1) {
        try {
            const today = new Date().toISOString().split('T')[0];

            // Находим задание пользователя
            const userTask = await dbGet(`
                SELECT udt.*, dt.target_value, dt.points_reward, dt.name
                FROM user_daily_tasks udt
                JOIN daily_tasks dt ON udt.daily_task_id = dt.id
                WHERE udt.user_telegram_id = ? 
                    AND dt.code = ? 
                    AND udt.task_date = ?
                    AND udt.is_completed = 0
            `, [telegramId, taskCode, today]);

            if (!userTask) {
                return { success: false, message: 'Задание не найдено или уже выполнено' };
            }

            const newProgress = userTask.current_progress + increment;
            const isCompleted = newProgress >= userTask.target_value;

            await dbRun('BEGIN TRANSACTION');

            // Обновляем прогресс
            await dbRun(`
                UPDATE user_daily_tasks 
                SET current_progress = ?, 
                    is_completed = ?, 
                    completed_at = ?,
                    points_earned = ?
                WHERE user_telegram_id = ? 
                    AND daily_task_id = ? 
                    AND task_date = ?
            `, [
                newProgress, 
                isCompleted ? 1 : 0, 
                isCompleted ? new Date().toISOString() : null,
                isCompleted ? userTask.points_reward : 0,
                telegramId, 
                userTask.daily_task_id, 
                today
            ]);

            let result = {
                success: true,
                task_name: userTask.name,
                progress: newProgress,
                target: userTask.target_value,
                is_completed: isCompleted,
                points_earned: 0
            };

            // Если задание выполнено - начисляем баллы
            if (isCompleted) {
                await addPointsByTelegramId(
                    telegramId, 
                    userTask.points_reward, 
                    'daily_task', 
                    `daily_task_${taskCode}`
                );

                result.points_earned = userTask.points_reward;
                console.log(`✅ [DailyTasksService] Задание "${userTask.name}" выполнено! +${userTask.points_reward} баллов`);

                // Обновляем стрик пользователя
                await this.updateUserStreak(telegramId, today);

                // Проверяем достижения
                try {
                    await achievementsService.checkAndUnlockAchievements(telegramId, 'points');
                } catch (achievementError) {
                    console.warn('[DailyTasksService] ⚠️ Ошибка проверки достижений:', achievementError.message);
                }
            }

            await dbRun('COMMIT');
            return result;

        } catch (error) {
            await dbRun('ROLLBACK');
            console.error('❌ [DailyTasksService] Ошибка обновления прогресса:', error);
            throw error;
        }
    }

    /**
     * Обновляет стрик пользователя (дни подряд выполнения заданий)
     */
    async updateUserStreak(telegramId, date) {
        try {
            // Проверяем, все ли базовые задания выполнены сегодня
            const todayCompletedTasks = await dbGet(`
                SELECT COUNT(*) as completed_count
                FROM user_daily_tasks udt
                JOIN daily_tasks dt ON udt.daily_task_id = dt.id
                WHERE udt.user_telegram_id = ? 
                    AND udt.task_date = ?
                    AND udt.is_completed = 1
                    AND dt.difficulty = 'easy'
            `, [telegramId, date]);

            // Нужно выполнить минимум 2 легких задания для засчета дня
            if (todayCompletedTasks.completed_count < 2) {
                return { success: false, message: 'Недостаточно выполненных заданий для стрика' };
            }

            // Получаем текущий стрик
            let streak = await dbGet(
                'SELECT * FROM user_streaks WHERE user_telegram_id = ?',
                [telegramId]
            );

            const yesterday = new Date(date);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            if (!streak) {
                // Создаем новый стрик
                await dbRun(`
                    INSERT INTO user_streaks 
                    (user_telegram_id, current_streak, longest_streak, last_activity_date, total_days_active)
                    VALUES (?, 1, 1, ?, 1)
                `, [telegramId, date]);
                
                console.log(`🔥 [DailyTasksService] Новый стрик начат для ${telegramId}: 1 день`);
                return { success: true, current_streak: 1, is_new_record: true };
            }

            // Проверяем непрерывность стрика
            let newStreak = 1;
            if (streak.last_activity_date === yesterdayStr) {
                // Продолжаем стрик
                newStreak = streak.current_streak + 1;
            } else if (streak.last_activity_date === date) {
                // Сегодня уже засчитан
                return { success: true, current_streak: streak.current_streak, is_new_record: false };
            }

            const newLongest = Math.max(streak.longest_streak, newStreak);
            const isNewRecord = newLongest > streak.longest_streak;

            // Обновляем стрик
            await dbRun(`
                UPDATE user_streaks 
                SET current_streak = ?, 
                    longest_streak = ?, 
                    last_activity_date = ?,
                    total_days_active = total_days_active + 1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_telegram_id = ?
            `, [newStreak, newLongest, date, telegramId]);

            // Бонусы за стрики
            const streakBonuses = this.getStreakBonuses(newStreak);
            if (streakBonuses.length > 0) {
                for (const bonus of streakBonuses) {
                    await addPointsByTelegramId(telegramId, bonus.points, 'streak', `streak_${bonus.days}`);
                    console.log(`🔥 [DailyTasksService] Бонус за стрик ${bonus.days} дней: +${bonus.points} баллов`);
                }
            }

            console.log(`🔥 [DailyTasksService] Стрик обновлен для ${telegramId}: ${newStreak} дней`);
            return { 
                success: true, 
                current_streak: newStreak, 
                longest_streak: newLongest,
                is_new_record: isNewRecord,
                bonuses: streakBonuses
            };

        } catch (error) {
            console.error('❌ [DailyTasksService] Ошибка обновления стрика:', error);
            throw error;
        }
    }

    /**
     * Возвращает бонусы за достижение определенных стриков
     */
    getStreakBonuses(streakDays) {
        const bonuses = [];
        
        // Бонусы за важные вехи
        const milestones = [
            { days: 3, points: 50 },   // 3 дня подряд
            { days: 7, points: 150 },  // неделя
            { days: 14, points: 300 }, // 2 недели
            { days: 30, points: 750 }  // месяц
        ];

        for (const milestone of milestones) {
            if (streakDays === milestone.days) {
                bonuses.push(milestone);
            }
        }

        return bonuses;
    }

    /**
     * Получить статистику стрика пользователя
     */
    async getUserStreak(telegramId) {
        try {
            const streak = await dbGet(
                'SELECT * FROM user_streaks WHERE user_telegram_id = ?',
                [telegramId]
            );

            if (!streak) {
                return {
                    success: true,
                    data: {
                        current_streak: 0,
                        longest_streak: 0,
                        total_days_active: 0,
                        last_activity_date: null
                    }
                };
            }

            return {
                success: true,
                data: streak
            };

        } catch (error) {
            console.error('❌ [DailyTasksService] Ошибка получения стрика:', error);
            throw error;
        }
    }

    /**
     * Сброс ежедневных заданий (cron job)
     */
    async resetDailyTasks() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            console.log(`🔄 [DailyTasksService] Сброс ежедневных заданий на ${today}`);

            // Получаем всех активных пользователей
            const activeUsers = await dbAll(`
                SELECT DISTINCT u.telegram_user_id 
                FROM users u 
                WHERE u.telegram_user_id IS NOT NULL
                    AND EXISTS (
                        SELECT 1 FROM user_daily_tasks udt 
                        WHERE udt.user_telegram_id = u.telegram_user_id 
                        AND udt.task_date >= ?
                    )
            `, [yesterdayStr]);

            let generatedCount = 0;
            for (const user of activeUsers) {
                try {
                    await this.generateDailyTasksForUser(user.telegram_user_id, today);
                    generatedCount++;
                } catch (error) {
                    console.error(`❌ Ошибка генерации заданий для ${user.telegram_user_id}:`, error);
                }
            }

            console.log(`✅ [DailyTasksService] Сгенерированы задания для ${generatedCount} пользователей`);
            
            return {
                success: true,
                generated_count: generatedCount,
                date: today
            };

        } catch (error) {
            console.error('❌ [DailyTasksService] Ошибка сброса заданий:', error);
            throw error;
        }
    }
}

module.exports = new DailyTasksService();
