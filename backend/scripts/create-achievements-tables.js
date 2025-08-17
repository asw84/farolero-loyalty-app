// backend/scripts/create-achievements-tables.js
// Создание таблиц для системы достижений

const { getDbConnection, dbRun } = require('../database');

async function createAchievementsTables() {
    console.log('🎯 Создание таблиц для системы достижений...');
    
    // Таблица типов достижений
    const createAchievementsTableSql = `
        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            icon TEXT NOT NULL,
            points_reward INTEGER DEFAULT 0,
            category TEXT NOT NULL,
            condition_type TEXT NOT NULL, -- 'count', 'threshold', 'milestone'
            condition_value INTEGER NOT NULL,
            condition_field TEXT, -- 'purchases', 'referrals', 'activity', 'points'
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `;

    // Таблица пользовательских достижений
    const createUserAchievementsTableSql = `
        CREATE TABLE IF NOT EXISTS user_achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_telegram_id TEXT NOT NULL,
            achievement_id INTEGER NOT NULL,
            unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            current_progress INTEGER DEFAULT 0,
            is_completed BOOLEAN DEFAULT 0,
            notified BOOLEAN DEFAULT 0,
            FOREIGN KEY (user_telegram_id) REFERENCES users (telegram_user_id),
            FOREIGN KEY (achievement_id) REFERENCES achievements (id),
            UNIQUE(user_telegram_id, achievement_id)
        );
    `;

    try {
        await dbRun(createAchievementsTableSql);
        console.log("✅ Таблица 'achievements' создана");
        
        await dbRun(createUserAchievementsTableSql);
        console.log("✅ Таблица 'user_achievements' создана");
        
        // Создаем индексы для быстрого поиска
        await dbRun('CREATE INDEX IF NOT EXISTS idx_achievements_code ON achievements(code);');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(category);');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_telegram_id);');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_user_achievements_completed ON user_achievements(is_completed);');
        
        console.log("✅ Индексы созданы");
        
        // Заполняем базовые достижения
        await seedAchievements();
        
        console.log("🎉 Система достижений успешно инициализирована!");
        return true;
        
    } catch (error) {
        console.error("❌ Ошибка создания таблиц достижений:", error);
        throw error;
    }
}

async function seedAchievements() {
    console.log('🌱 Заполнение базовых достижений...');
    
    const achievements = [
        // Достижения по покупкам
        {
            code: 'FIRST_PURCHASE',
            name: 'Первая покупка',
            description: 'Поздравляем с первой покупкой!',
            icon: '🛍️',
            points_reward: 100,
            category: 'purchases',
            condition_type: 'count',
            condition_value: 1,
            condition_field: 'purchases'
        },
        {
            code: 'PURCHASE_5',
            name: 'Частый покупатель',
            description: 'Совершите 5 покупок',
            icon: '🛒',
            points_reward: 200,
            category: 'purchases',
            condition_type: 'count',
            condition_value: 5,
            condition_field: 'purchases'
        },
        {
            code: 'PURCHASE_10',
            name: 'Постоянный клиент',
            description: 'Совершите 10 покупок',
            icon: '🏪',
            points_reward: 500,
            category: 'purchases',
            condition_type: 'count',
            condition_value: 10,
            condition_field: 'purchases'
        },
        
        // Достижения по рефералам
        {
            code: 'FIRST_REFERRAL',
            name: 'Первый друг',
            description: 'Пригласите первого друга',
            icon: '👥',
            points_reward: 150,
            category: 'referrals',
            condition_type: 'count',
            condition_value: 1,
            condition_field: 'referrals'
        },
        {
            code: 'REFERRAL_5',
            name: 'Популярный',
            description: 'Пригласите 5 друзей',
            icon: '🌟',
            points_reward: 300,
            category: 'referrals',
            condition_type: 'count',
            condition_value: 5,
            condition_field: 'referrals'
        },
        {
            code: 'REFERRAL_10',
            name: 'Амбассадор',
            description: 'Пригласите 10 друзей',
            icon: '👑',
            points_reward: 1000,
            category: 'referrals',
            condition_type: 'count',
            condition_value: 10,
            condition_field: 'referrals'
        },
        
        // Достижения по баллам
        {
            code: 'POINTS_1000',
            name: 'Коллекционер',
            description: 'Накопите 1000 баллов',
            icon: '💎',
            points_reward: 100,
            category: 'points',
            condition_type: 'threshold',
            condition_value: 1000,
            condition_field: 'points'
        },
        {
            code: 'POINTS_5000',
            name: 'Накопитель',
            description: 'Накопите 5000 баллов',
            icon: '💰',
            points_reward: 500,
            category: 'points',
            condition_type: 'threshold',
            condition_value: 5000,
            condition_field: 'points'
        },
        
        // Достижения по статусам
        {
            code: 'STATUS_SILVER',
            name: 'Серебряный статус',
            description: 'Достигните серебряного статуса',
            icon: '🥈',
            points_reward: 250,
            category: 'status',
            condition_type: 'milestone',
            condition_value: 1,
            condition_field: 'status_silver'
        },
        {
            code: 'STATUS_GOLD',
            name: 'Золотой статус',
            description: 'Достигните золотого статуса',
            icon: '🥇',
            points_reward: 500,
            category: 'status',
            condition_type: 'milestone',
            condition_value: 1,
            condition_field: 'status_gold'
        },
        {
            code: 'STATUS_PLATINUM',
            name: 'Платиновый статус',
            description: 'Достигните платинового статуса',
            icon: '💎',
            points_reward: 1000,
            category: 'status',
            condition_type: 'milestone',
            condition_value: 1,
            condition_field: 'status_platinum'
        },
        
        // Достижения по социальной активности
        {
            code: 'SOCIAL_VK_CONNECT',
            name: 'VK подключение',
            description: 'Подключите VK аккаунт',
            icon: '🔗',
            points_reward: 50,
            category: 'social',
            condition_type: 'milestone',
            condition_value: 1,
            condition_field: 'vk_connected'
        },
        {
            code: 'SOCIAL_INSTAGRAM_CONNECT',
            name: 'Instagram подключение',
            description: 'Подключите Instagram аккаунт',
            icon: '📷',
            points_reward: 50,
            category: 'social',
            condition_type: 'milestone',
            condition_value: 1,
            condition_field: 'instagram_connected'
        }
    ];
    
    for (const achievement of achievements) {
        try {
            await dbRun(`
                INSERT OR IGNORE INTO achievements 
                (code, name, description, icon, points_reward, category, condition_type, condition_value, condition_field)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                achievement.code,
                achievement.name, 
                achievement.description,
                achievement.icon,
                achievement.points_reward,
                achievement.category,
                achievement.condition_type,
                achievement.condition_value,
                achievement.condition_field
            ]);
            
            console.log(`✅ Достижение "${achievement.name}" добавлено`);
        } catch (error) {
            console.log(`⚠️ Достижение "${achievement.name}" уже существует`);
        }
    }
}

if (require.main === module) {
    createAchievementsTables()
        .then(() => {
            console.log('🎯 Система достижений готова!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Ошибка:', error);
            process.exit(1);
        });
}

module.exports = { createAchievementsTables, seedAchievements };
