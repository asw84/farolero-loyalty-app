// backend/database.js
// NEW ROBUST VERSION

const sqlite3 = require('sqlite3').verbose();
const DB_PATH = './farolero.db'; // Using a more specific name

let dbInstance = null;

/**
 * Gets the singleton database connection instance.
 * @returns {sqlite3.Database} The database instance.
 */
function getDbConnection() {
    if (!dbInstance) {
        dbInstance = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('❌ Database connection error:', err.message);
                throw err;
            }
            console.log('✅ Successfully connected to the SQLite database.');
            dbInstance.run('PRAGMA foreign_keys = ON;');
        });
    }
    return dbInstance;
}

/**
 * Initializes the database tables if they don't exist.
 */
async function initializeDatabase() {
    const createUserTableSql = `
        CREATE TABLE IF NOT EXISTS users (
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
        );
    `;
    const createActivityTableSql = `
        CREATE TABLE IF NOT EXISTS activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            source TEXT NOT NULL,
            activity_type TEXT NOT NULL,
            points_awarded INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
    `;

    const createReferralsTableSql = `
        CREATE TABLE IF NOT EXISTS referrals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            referrer_telegram_id TEXT NOT NULL,
            referee_telegram_id TEXT,
            referral_code TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            activated_at DATETIME,
            bonus_paid BOOLEAN DEFAULT FALSE,
            bonus_amount INTEGER DEFAULT 0,
            FOREIGN KEY (referrer_telegram_id) REFERENCES users (telegram_user_id),
            FOREIGN KEY (referee_telegram_id) REFERENCES users (telegram_user_id)
        );
    `;

    const createPurchasesTableSql = `
        CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_telegram_id TEXT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            source TEXT DEFAULT 'qtickets',
            order_id TEXT,
            FOREIGN KEY (user_telegram_id) REFERENCES users (telegram_user_id)
        );
    `;

    const createRfmSegmentsTableSql = `
        CREATE TABLE IF NOT EXISTS rfm_segments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_telegram_id TEXT UNIQUE NOT NULL,
            recency_score INTEGER CHECK(recency_score >= 1 AND recency_score <= 5),
            frequency_score INTEGER CHECK(frequency_score >= 1 AND frequency_score <= 5),
            monetary_score INTEGER CHECK(monetary_score >= 1 AND monetary_score <= 5),
            segment_name TEXT NOT NULL,
            calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_telegram_id) REFERENCES users (telegram_user_id)
        );
    `;

    try {
        await dbRun(createUserTableSql);
        console.log("'users' table is ready.");
        
        await dbRun(createActivityTableSql);
        console.log("'activity' table is ready.");
        
        await dbRun(createReferralsTableSql);
        console.log("'referrals' table is ready.");
        
        await dbRun(createPurchasesTableSql);
        console.log("'purchases' table is ready.");
        
        await dbRun(createRfmSegmentsTableSql);
        console.log("'rfm_segments' table is ready.");

        // Создаем индексы для быстрого поиска
        await dbRun('CREATE INDEX IF NOT EXISTS idx_referral_code ON referrals(referral_code);');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_referrer ON referrals(referrer_telegram_id);');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_user_purchases ON purchases(user_telegram_id);');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_purchase_date ON purchases(purchase_date);');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_rfm_user ON rfm_segments(user_telegram_id);');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_rfm_segment ON rfm_segments(segment_name);');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_rfm_calculated ON rfm_segments(calculated_at);');
        
        console.log("✅ Все таблицы и индексы созданы успешно!");
        return true;
    } catch (error) {
        console.error("❌ Ошибка создания таблиц:", error);
        throw error;
    }
}

// Helper function to make db operations Promises
function dbRun(sql, params = []) {
    const db = getDbConnection();
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) return reject(err);
            resolve(this);
        });
    });
}

function dbGet(sql, params = []) {
    const db = getDbConnection();
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

async function setPendingPointsDeduction(userId, points) {
    return await dbRun('UPDATE users SET pending_points_deduction = ? WHERE id = ?', [points, userId]);
}

async function deductPendingPoints(userId) {
    const db = getDbConnection();
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            try {
                await dbRun('BEGIN TRANSACTION;');
                const user = await dbGet('SELECT * FROM users WHERE id = ?', [userId]);
                if (user && user.pending_points_deduction > 0) {
                    const pointsToDeduct = user.pending_points_deduction;
                    await dbRun('UPDATE users SET points = points - ?, pending_points_deduction = 0 WHERE id = ?', [pointsToDeduct, userId]);
                    await dbRun('INSERT INTO activity (user_id, points_awarded, source, activity_type) VALUES (?, ?, ?, ?)', [userId, -pointsToDeduct, 'qtickets', 'purchase_discount']);
                }
                await dbRun('COMMIT;');
                resolve();
            } catch (err) {
                await dbRun('ROLLBACK;');
                reject(err);
            }
        });
    });
}

// All subsequent functions should use the Promise helpers
async function findUserByTelegramId(telegramId) {
    return await dbGet(`SELECT * FROM users WHERE telegram_user_id = ?`, [telegramId]);
}

async function findUserById(userId) {
    return await dbGet(`SELECT * FROM users WHERE id = ?`, [userId]);
}

async function findOrCreateUser(identifier, source_field, referrerId = null) {
    let user = await dbGet(`SELECT * FROM users WHERE ${source_field} = ?`, [identifier]);
    if (user) {
        return user;
    }
    const result = await dbRun(`INSERT INTO users (${source_field}, referrer_id) VALUES (?, ?)`, [identifier, referrerId]);
    return await dbGet('SELECT * FROM users WHERE id = ?', [result.lastID]);
}

async function updateUser(telegramId, data) {
    const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
    const values = Object.values(data);
    const result = await dbRun(`UPDATE users SET ${fields} WHERE telegram_user_id = ?`, [...values, telegramId]);
    return { changes: result.changes };
}

async function addPoints(user_id, points, source, activity_type) {
    // This function requires a transaction, which is more complex with Promises.
    // Let's keep it as is for now, but use getDbConnection().
    const db = getDbConnection();
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION;');
            db.run('UPDATE users SET points = points + ? WHERE id = ?', [points, user_id], (err) => { if(err) db.run('ROLLBACK;', () => reject(err)) });
            db.run('INSERT INTO activity (user_id, points_awarded, source, activity_type) VALUES (?, ?, ?, ?)', [user_id, points, source, activity_type], (err) => { if(err) db.run('ROLLBACK;', () => reject(err)) });
            db.run('COMMIT;', (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

/**
 * Добавляет баллы пользователю по Telegram ID
 * @param {string} telegramId - Telegram ID пользователя
 * @param {number} points - Количество баллов для добавления
 * @param {string} source - Источник баллов
 * @param {string} activity_type - Тип активности
 * @returns {Promise<Object>} - Результат операции
 */
async function addPointsByTelegramId(telegramId, points, source, activity_type) {
    const db = getDbConnection();
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            try {
                await dbRun('BEGIN TRANSACTION;');
                
                // Получаем пользователя
                const user = await dbGet('SELECT id FROM users WHERE telegram_user_id = ?', [telegramId]);
                if (!user) {
                    await dbRun('ROLLBACK;');
                    return reject(new Error(`Пользователь с Telegram ID ${telegramId} не найден`));
                }
                
                // Обновляем баллы
                await dbRun('UPDATE users SET points = points + ? WHERE telegram_user_id = ?', [points, telegramId]);
                
                // Записываем активность
                await dbRun('INSERT INTO activity (user_id, points_awarded, source, activity_type) VALUES (?, ?, ?, ?)', 
                    [user.id, points, source, activity_type]);
                
                await dbRun('COMMIT;');
                
                resolve({
                    success: true,
                    userId: user.id,
                    telegramId: telegramId,
                    pointsAdded: points,
                    newTotal: await dbGet('SELECT points FROM users WHERE telegram_user_id = ?', [telegramId])
                });
                
            } catch (error) {
                await dbRun('ROLLBACK;');
                reject(error);
            }
        });
    });
}

async function dbAll(sql, params = []) {
    const db = getDbConnection();
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

/**
 * Списать баллы у пользователя
 * @param {number} userId - ID пользователя
 * @param {number} points - Количество баллов для списания
 * @param {string} source - Источник списания
 * @param {string} activity_type - Тип активности
 * @returns {Promise<void>}
 */
async function deductPoints(userId, points, source, activity_type) {
    const db = getDbConnection();
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            try {
                await dbRun('BEGIN TRANSACTION;');
                
                // Проверяем достаточность баллов
                const user = await dbGet('SELECT points FROM users WHERE id = ?', [userId]);
                if (!user) {
                    await dbRun('ROLLBACK;');
                    return reject(new Error(`Пользователь с ID ${userId} не найден`));
                }
                
                if (user.points < points) {
                    await dbRun('ROLLBACK;');
                    return reject(new Error(`Недостаточно баллов. Есть: ${user.points}, требуется: ${points}`));
                }
                
                // Списываем баллы
                await dbRun('UPDATE users SET points = points - ? WHERE id = ?', [points, userId]);
                
                // Записываем активность (отрицательное значение)
                await dbRun('INSERT INTO activity (user_id, points_awarded, source, activity_type) VALUES (?, ?, ?, ?)', 
                    [userId, -points, source, activity_type]);
                
                await dbRun('COMMIT;');
                console.log(`✅ [Database] Списано ${points} баллов у пользователя ${userId}`);
                resolve();
            } catch (err) {
                await dbRun('ROLLBACK;');
                reject(err);
            }
        });
    });
}

async function addPurchase(purchaseData) {
    // Поддерживаем как старый формат (telegramId, amount, source, orderId), так и новый объект
    if (typeof purchaseData === 'string') {
        // Старый формат для совместимости
        const [telegramId, amount, source = 'qtickets', orderId = null] = arguments;
        return await dbRun(
            'INSERT INTO purchases (user_telegram_id, amount, source, order_id) VALUES (?, ?, ?, ?)',
            [telegramId, amount, source, orderId]
        );
    }
    
    // Новый формат с расширенными данными
    const {
        user_id,
        event_id,
        event_name,
        total_price,
        cashback_used = 0,
        final_price,
        purchase_date = new Date().toISOString(),
        source = 'qtickets'
    } = purchaseData;
    
    // Получаем telegram_user_id по user_id
    const user = await dbGet('SELECT telegram_user_id FROM users WHERE id = ?', [user_id]);
    if (!user) {
        throw new Error(`Пользователь с ID ${user_id} не найден`);
    }
    
    return await dbRun(
        `INSERT INTO purchases (user_telegram_id, amount, source, event_id, event_name, cashback_used, final_price, purchase_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.telegram_user_id, total_price, source, event_id, event_name, cashback_used, final_price, purchase_date]
    );
}

async function getUserPurchases(telegramId) {
    return await dbAll(
        'SELECT * FROM purchases WHERE user_telegram_id = ? ORDER BY purchase_date DESC',
        [telegramId]
    );
}

module.exports = {
    initializeDatabase,
    getDbConnection,
    dbRun,
    dbGet,
    dbAll,
    findUserByTelegramId,
    findUserById,
    findOrCreateUser,
    updateUser,
    addPoints,
    addPointsByTelegramId,
    deductPoints,
    addPurchase,
    getUserPurchases,
    setPendingPointsDeduction,
    deductPendingPoints
};