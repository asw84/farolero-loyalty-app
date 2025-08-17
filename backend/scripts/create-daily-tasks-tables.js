// backend/scripts/create-daily-tasks-tables.js
// Создание таблиц для системы ежедневных заданий

const { getDbConnection, dbRun } = require('../database');

async function createDailyTasksTables() {
    console.log('📅 Создание таблиц для системы ежедневных заданий...');
    
    // Таблица типов ежедневных заданий
    const createDailyTasksTableSql = `
        CREATE TABLE IF NOT EXISTS daily_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            icon TEXT NOT NULL,
            points_reward INTEGER DEFAULT 0,
            task_type TEXT NOT NULL, -- 'social', 'purchase', 'visit', 'checkin'
            target_value INTEGER DEFAULT 1,
            difficulty TEXT DEFAULT 'easy', -- 'easy', 'medium', 'hard'
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;

    // Таблица пользовательских ежедневных заданий
    const createUserDailyTasksTableSql = `
        CREATE TABLE IF NOT EXISTS user_daily_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_telegram_id TEXT NOT NULL,
            daily_task_id INTEGER NOT NULL,
            task_date DATE NOT NULL, -- Дата когда было выдано задание
            current_progress INTEGER DEFAULT 0,
            is_completed BOOLEAN DEFAULT 0,
            completed_at DATETIME,
            points_earned INTEGER DEFAULT 0,
            FOREIGN KEY (user_telegram_id) REFERENCES users (telegram_user_id),
            FOREIGN KEY (daily_task_id) REFERENCES daily_tasks (id),
            UNIQUE(user_telegram_id, daily_task_id, task_date)
        );
    `;

    // Таблица стрики (подряд дней выполнения заданий)
    const createUserStreaksTableSql = `
        CREATE TABLE IF NOT EXISTS user_streaks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_telegram_id TEXT UNIQUE NOT NULL,
            current_streak INTEGER DEFAULT 0,
            longest_streak INTEGER DEFAULT 0,
            last_activity_date DATE,
            total_days_active INTEGER DEFAULT 0,
            streak_bonus_earned INTEGER DEFAULT 0,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_telegram_id) REFERENCES users (telegram_user_id)
        );
    `;

    try {
        await dbRun(createDailyTasksTableSql);
        console.log("✅ Таблица 'daily_tasks' создана");
        
        await dbRun(createUserDailyTasksTableSql);
        console.log("✅ Таблица 'user_daily_tasks' создана");
        
        await dbRun(createUserStreaksTableSql);
        console.log("✅ Таблица 'user_streaks' создана");
        
        // Создаем индексы для быстрого поиска
        await dbRun('CREATE INDEX IF NOT EXISTS idx_daily_tasks_code ON daily_tasks(code);');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_daily_tasks_type ON daily_tasks(task_type);');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_user_daily_tasks_user_date ON user_daily_tasks(user_telegram_id, task_date);');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_user_daily_tasks_completed ON user_daily_tasks(is_completed);');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON user_streaks(user_telegram_id);');
        
        console.log("✅ Индексы созданы");
        
        // Заполняем базовые ежедневные задания
        await seedDailyTasks();
        
        console.log("🎉 Система ежедневных заданий успешно инициализирована!");
        return true;
        
    } catch (error) {
        console.error("❌ Ошибка создания таблиц ежедневных заданий:", error);
        throw error;
    }
}

async function seedDailyTasks() {
    console.log('🌱 Заполнение базовых ежедневных заданий...');
    
    const dailyTasks = [
        // Простые задания (каждый день)
        {
            code: 'DAILY_CHECKIN',
            name: 'Ежедневный вход',
            description: 'Зайдите в приложение',
            icon: '📱',
            points_reward: 10,
            task_type: 'visit',
            target_value: 1,
            difficulty: 'easy'
        },
        {
            code: 'DAILY_PROFILE_VIEW',
            name: 'Проверьте профиль',
            description: 'Посмотрите свой профиль и статистику',
            icon: '👤',
            points_reward: 5,
            task_type: 'visit',
            target_value: 1,
            difficulty: 'easy'
        },
        
        // Социальные задания
        {
            code: 'DAILY_VK_ACTIVITY',
            name: 'VK активность',
            description: 'Поставьте лайк посту в VK',
            icon: '💙',
            points_reward: 15,
            task_type: 'social',
            target_value: 1,
            difficulty: 'easy'
        },
        {
            code: 'DAILY_INSTAGRAM_ACTIVITY',
            name: 'Instagram активность',
            description: 'Опубликуйте story в Instagram',
            icon: '📷',
            points_reward: 20,
            task_type: 'social',
            target_value: 1,
            difficulty: 'medium'
        },
        
        // Задания средней сложности
        {
            code: 'DAILY_REFERRAL_SHARE',
            name: 'Поделитесь с друзьями',
            description: 'Поделитесь реферальным кодом в соцсетях',
            icon: '🔗',
            points_reward: 25,
            task_type: 'social',
            target_value: 1,
            difficulty: 'medium'
        },
        {
            code: 'DAILY_WALK_VIEW',
            name: 'Изучите мероприятия',
            description: 'Посмотрите 3 доступных мероприятия',
            icon: '🎭',
            points_reward: 15,
            task_type: 'visit',
            target_value: 3,
            difficulty: 'easy'
        },
        
        // Сложные задания (реже)
        {
            code: 'DAILY_PURCHASE_TASK',
            name: 'Совершите покупку',
            description: 'Купите билет на любое мероприятие',
            icon: '🎫',
            points_reward: 50,
            task_type: 'purchase',
            target_value: 1,
            difficulty: 'hard'
        },
        {
            code: 'DAILY_POINTS_SPEND',
            name: 'Потратьте баллы',
            description: 'Используйте баллы для скидки',
            icon: '💰',
            points_reward: 30,
            task_type: 'purchase',
            target_value: 1,
            difficulty: 'medium'
        },
        
        // Еженедельные "ежедневные" задания (появляются реже)
        {
            code: 'WEEKLY_ACHIEVEMENT_HUNT',
            name: 'Охота за достижениями',
            description: 'Разблокируйте новое достижение',
            icon: '🏆',
            points_reward: 100,
            task_type: 'visit',
            target_value: 1,
            difficulty: 'hard'
        },
        {
            code: 'WEEKLY_STATUS_BOOST',
            name: 'Повысьте статус',
            description: 'Накопите баллы для следующего статуса',
            icon: '⭐',
            points_reward: 75,
            task_type: 'visit',
            target_value: 1,
            difficulty: 'hard'
        }
    ];
    
    for (const task of dailyTasks) {
        try {
            await dbRun(`
                INSERT OR IGNORE INTO daily_tasks 
                (code, name, description, icon, points_reward, task_type, target_value, difficulty)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                task.code,
                task.name, 
                task.description,
                task.icon,
                task.points_reward,
                task.task_type,
                task.target_value,
                task.difficulty
            ]);
            
            console.log(`✅ Ежедневное задание "${task.name}" добавлено`);
        } catch (error) {
            console.log(`⚠️ Ежедневное задание "${task.name}" уже существует`);
        }
    }
}

if (require.main === module) {
    createDailyTasksTables()
        .then(() => {
            console.log('📅 Система ежедневных заданий готова!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Ошибка:', error);
            process.exit(1);
        });
}

module.exports = { createDailyTasksTables, seedDailyTasks };
