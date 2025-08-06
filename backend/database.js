// backend/database.js
// ПОЛНАЯ ВЕРСИЯ С НОВЫМИ ФУНКЦИЯМИ

const sqlite3 = require('sqlite3').verbose();
const DB_PATH = './database.db';

const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error('❌ Ошибка при подключении к базе данных:', err.message);
    else {
        console.log('✅ Успешное подключение к базе данных SQLite.');
        db.run('PRAGMA foreign_keys = ON;');
    }
});

function initializeDatabase() {
    const createUserTableSql = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_user_id TEXT UNIQUE,
            instagram_username TEXT UNIQUE,
            vk_user_id TEXT UNIQUE,
            points INTEGER DEFAULT 0,
            synced_with_amo BOOLEAN DEFAULT 0, -- Флаг, что мы уже синхронизировали баллы
            registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;
    const createActivityTableSql = `/* ... без изменений ... */`;
    db.serialize(() => {
        db.run(createUserTableSql, (err) => {
            if (err) console.error("Ошибка 'users':", err.message);
            else console.log("Таблица 'users' готова.");
        });
        db.run(createActivityTableSql, (err) => {
            if (err) console.error("Ошибка 'activity':", err.message);
            else console.log("Таблица 'activity' готова.");
        });
    });
}

// --- НОВАЯ ФУНКЦИЯ ---
function findUserByTelegramId(telegramId) {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM users WHERE telegram_user_id = ?`;
        db.get(sql, [telegramId], (err, user) => {
            if (err) return reject(err);
            resolve(user);
        });
    });
}

function findOrCreateUser(identifier, source_field) {
    return new Promise((resolve, reject) => {
        const findSql = `SELECT * FROM users WHERE ${source_field} = ?`;
        db.get(findSql, [identifier], (err, user) => {
            if (err) return reject(err);
            if (user) return resolve(user);
            
            const insertSql = `INSERT INTO users (${source_field}) VALUES (?)`;
            db.run(insertSql, [identifier], function (err) {
                if (err) return reject(err);
                db.get('SELECT * FROM users WHERE id = ?', [this.lastID], (err, newUser) => {
                    if (err) return reject(err);
                    resolve(newUser);
                });
            });
        });
    });
}

// --- НОВАЯ ФУНКЦИЯ ---
function updateUser(telegramId, data) {
    return new Promise((resolve, reject) => {
        const fields = Object.keys(data).map(k => `${k} = ?`).join(', ');
        const values = Object.values(data);
        const sql = `UPDATE users SET ${fields} WHERE telegram_user_id = ?`;
        db.run(sql, [...values, telegramId], function (err) {
            if (err) return reject(err);
            resolve({ changes: this.changes });
        });
    });
}

function addPoints(user_id, points, source, activity_type) { /* ... без изменений ... */ }
function linkInstagramAccount(telegram_user_id, instagram_user_id, instagram_username) { /* ... без изменений ... */ }
function linkVkAccount(telegram_user_id, vk_user_id) { /* ... без изменений ... */ }

module.exports = {
    db,
    initializeDatabase,
    findOrCreateUser,
    findUserByTelegramId, // <-- экспортируем
    updateUser,           // <-- экспортируем
    addPoints,
    linkInstagramAccount,
    linkVkAccount,
};