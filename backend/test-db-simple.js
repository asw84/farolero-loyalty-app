// backend/test-db-simple.js
// Простое тестирование создания базы данных

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('🗄️  Создание простой тестовой базы данных...');

// Определяем путь к БД
const dbPath = process.env.STORAGE_PATH 
    ? path.join(process.env.STORAGE_PATH, 'farolero_loyalty.db')
    : path.join(__dirname, 'farolero_loyalty.db');

console.log('📍 Путь к БД:', dbPath);

// Создаем подключение
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Ошибка подключения к БД:', err.message);
        process.exit(1);
    }
    console.log('✅ Подключение к SQLite успешно');
});

// Создаем только базовые таблицы
const tables = [
    {
        name: 'users',
        sql: `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_user_id TEXT UNIQUE,
            instagram_user_id TEXT UNIQUE,
            instagram_username TEXT UNIQUE,
            vk_user_id TEXT UNIQUE,
            points INTEGER DEFAULT 0,
            status TEXT DEFAULT 'Бронза',
            pending_points_deduction INTEGER DEFAULT 0,
            referrer_id INTEGER,
            synced_with_amo BOOLEAN DEFAULT 0,
            registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (referrer_id) REFERENCES users (id)
        )`
    },
    {
        name: 'activity',
        sql: `CREATE TABLE IF NOT EXISTS activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            source TEXT NOT NULL,
            activity_type TEXT NOT NULL,
            points_awarded INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`
    },
    {
        name: 'referrals',
        sql: `CREATE TABLE IF NOT EXISTS referrals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            referrer_telegram_id TEXT NOT NULL,
            referee_telegram_id TEXT NOT NULL,
            referral_code TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            activated_at DATETIME,
            bonus_paid BOOLEAN DEFAULT FALSE,
            bonus_amount INTEGER DEFAULT 0,
            FOREIGN KEY (referrer_telegram_id) REFERENCES users (telegram_user_id),
            FOREIGN KEY (referee_telegram_id) REFERENCES users (telegram_user_id)
        )`
    },
    {
        name: 'purchases',
        sql: `CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_telegram_id TEXT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            source TEXT DEFAULT 'qtickets',
            order_id TEXT,
            FOREIGN KEY (user_telegram_id) REFERENCES users (telegram_user_id)
        )`
    },
    {
        name: 'rfm_segments',
        sql: `CREATE TABLE IF NOT EXISTS rfm_segments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_telegram_id TEXT UNIQUE NOT NULL,
            recency_score INTEGER CHECK(recency_score >= 1 AND recency_score <= 5),
            frequency_score INTEGER CHECK(frequency_score >= 1 AND frequency_score <= 5),
            monetary_score INTEGER CHECK(monetary_score >= 1 AND monetary_score <= 5),
            segment_name TEXT,
            calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_telegram_id) REFERENCES users (telegram_user_id)
        )`
    }
];

let tablesCreated = 0;

// Создаем таблицы последовательно
function createNextTable() {
    if (tablesCreated >= tables.length) {
        console.log('');
        console.log('📊 Создание индексов...');
        createIndexes();
        return;
    }

    const table = tables[tablesCreated];
    console.log(`📝 Создание таблицы: ${table.name}`);
    
    db.run(table.sql, (err) => {
        if (err) {
            console.error(`❌ Ошибка создания таблицы ${table.name}:`, err.message);
            process.exit(1);
        } else {
            console.log(`✅ Таблица ${table.name} готова`);
            tablesCreated++;
            createNextTable();
        }
    });
}

function createIndexes() {
    const indexes = [
        'CREATE INDEX IF NOT EXISTS idx_referral_code ON referrals(referral_code)',
        'CREATE INDEX IF NOT EXISTS idx_referrer ON referrals(referrer_telegram_id)',
        'CREATE INDEX IF NOT EXISTS idx_user_purchases ON purchases(user_telegram_id)',
        'CREATE INDEX IF NOT EXISTS idx_purchase_date ON purchases(purchase_date)'
    ];

    let indexesCreated = 0;

    function createNextIndex() {
        if (indexesCreated >= indexes.length) {
            console.log('');
            console.log('🎉 База данных успешно инициализирована!');
            console.log('📊 Созданные таблицы:');
            tables.forEach(table => {
                console.log(`   ✅ ${table.name}`);
            });
            console.log('');
            console.log('🚀 Теперь можно запускать сервер: node server.js');
            
            db.close((err) => {
                if (err) {
                    console.error('❌ Ошибка закрытия БД:', err.message);
                } else {
                    console.log('✅ Подключение к БД закрыто');
                }
                process.exit(0);
            });
            return;
        }

        const indexSql = indexes[indexesCreated];
        console.log(`📝 Создание индекса ${indexesCreated + 1}/${indexes.length}`);
        
        db.run(indexSql, (err) => {
            if (err) {
                console.error(`❌ Ошибка создания индекса:`, err.message);
            } else {
                console.log(`✅ Индекс создан`);
            }
            indexesCreated++;
            createNextIndex();
        });
    }

    createNextIndex();
}

// Запускаем создание таблиц
createNextTable();
