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
function initializeDatabase() {
    const db = getDbConnection();

    const createUserTableSql = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_user_id TEXT UNIQUE,
            instagram_user_id TEXT UNIQUE,
            instagram_username TEXT UNIQUE,
            vk_user_id TEXT UNIQUE,
            points INTEGER DEFAULT 0,
            synced_with_amo BOOLEAN DEFAULT 0,
            registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    db.run(createUserTableSql, (err) => {
        if (err) console.error("Error creating 'users' table:", err.message);
        else console.log("'users' table is ready.");
    });

    db.run(createActivityTableSql, (err) => {
        if (err) console.error("Error creating 'activity' table:", err.message);
        else console.log("'activity' table is ready.");
    });
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

// All subsequent functions should use the Promise helpers
async function findUserByTelegramId(telegramId) {
    return await dbGet(`SELECT * FROM users WHERE telegram_user_id = ?`, [telegramId]);
}

async function findOrCreateUser(identifier, source_field) {
    let user = await dbGet(`SELECT * FROM users WHERE ${source_field} = ?`, [identifier]);
    if (user) {
        return user;
    }
    const result = await dbRun(`INSERT INTO users (${source_field}) VALUES (?)`, [identifier]);
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

// ... (other db functions like linkInstagramAccount, linkVkAccount should be refactored similarly if they exist)

module.exports = {
    initializeDatabase,
    findUserByTelegramId,
    findOrCreateUser,
    updateUser,
    addPoints,
    // ... other exports
};