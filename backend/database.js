// backend/database.js

const sqlite3 = require('sqlite3').verbose();

// Указываем путь к файлу БД. Он будет создан, если не существует.
const DB_PATH = './database.db';

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('❌ Ошибка при подключении к базе данных:', err.message);
    } else {
        console.log('✅ Успешное подключение к базе данных SQLite.');
        // Включаем поддержку внешних ключей для обеспечения целостности данных
        db.run('PRAGMA foreign_keys = ON;');
    }
});

/**
 * Инициализирует таблицы в базе данных, если они еще не созданы.
 */
function initializeDatabase() {
    const createUserTableSql = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_user_id TEXT UNIQUE, -- ID из Telegram Mini App
            instagram_username TEXT UNIQUE,
            vk_user_id TEXT UNIQUE,
            points INTEGER DEFAULT 0,
            registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    const createActivityTableSql = `
        CREATE TABLE IF NOT EXISTS activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            source TEXT NOT NULL, -- 'instagram', 'vk', 'telegram', 'manual'
            activity_type TEXT NOT NULL, -- 'comment', 'codeword', 'join', etc.
            points_awarded INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        );
    `;

    db.serialize(() => {
        db.run(createUserTableSql, (err) => {
            if (err) console.error("Ошибка при создании таблицы 'users':", err.message);
            else console.log("Таблица 'users' готова.");
        });
        db.run(createActivityTableSql, (err) => {
            if (err) console.error("Ошибка при создании таблицы 'activity':", err.message);
            else console.log("Таблица 'activity' готова.");
        });
    });
}

/**
 * Находит или создает пользователя по идентификатору из соцсети.
 * @param {string} identifier - Уникальный идентификатор (например, vk_user_id или instagram_username).
 * @param {'vk_user_id' | 'instagram_username' | 'telegram_user_id'} source_field - Поле, по которому ищем.
 * @returns {Promise<object>} Данные пользователя.
 */
function findOrCreateUser(identifier, source_field) {
    return new Promise((resolve, reject) => {
        const findSql = `SELECT * FROM users WHERE ${source_field} = ?`;
        db.get(findSql, [identifier], (err, user) => {
            if (err) return reject(err);
            if (user) return resolve(user);

            // Если пользователь не найден, создаем нового
            const insertSql = `INSERT INTO users (${source_field}) VALUES (?)`;
            db.run(insertSql, [identifier], function (err) {
                if (err) return reject(err);
                // Возвращаем только что созданного пользователя
                db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, newUser) => {
                    if (err) return reject(err);
                    resolve(newUser);
                });
            });
        });
    });
}

/**
 * Добавляет баллы пользователю и записывает активность.
 * @param {number} user_id - Внутренний ID пользователя.
 * @param {number} points - Количество баллов для начисления.
 * @param {string} source - Источник активности ('vk', 'instagram', etc.).
 * @param {string} activity_type - Тип активности ('comment', etc.).
 * @returns {Promise<void>}
 */
function addPoints(user_id, points, source, activity_type) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run('BEGIN TRANSACTION;');

            const updateUserSql = 'UPDATE users SET points = points + ? WHERE id = ?';
            db.run(updateUserSql, [points, user_id], function (err) {
                if (err) {
                    db.run('ROLLBACK;');
                    return reject(err);
                }
            });

            const insertActivitySql = 'INSERT INTO activity (user_id, points_awarded, source, activity_type) VALUES (?, ?, ?, ?)';
            db.run(insertActivitySql, [user_id, points, source, activity_type], function (err) {
                if (err) {
                    db.run('ROLLBACK;');
                    return reject(err);
                }
            });

            db.run('COMMIT;', (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
    });
}

module.exports = {
    db,
    initializeDatabase,
    findOrCreateUser,
    addPoints,
};
