// backend/services/admin.service.js

const { db, findOrCreateUser, addPoints } = require('../database');
const statusService = require('./status.service');

/**
 * Gets the top users by points.
 * @returns {Promise<Array>} A list of top users.
 */
function getTopUsers() {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM users ORDER BY points DESC LIMIT 10';
        db.all(query, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

/**
 * Gets user details and activity history.
 * @param {number} userId - The user's ID.
 * @returns {Promise<object>} An object with user details and activity history.
 */
function getUserDetails(userId) {
    return new Promise((resolve, reject) => {
        const userQuery = 'SELECT * FROM users WHERE id = ?';
        const activityQuery = 'SELECT * FROM activity WHERE user_id = ? ORDER BY created_at DESC';

        db.get(userQuery, [userId], (err, user) => {
            if (err) return reject(err);
            if (!user) return resolve(null);

            db.all(activityQuery, [userId], (err, activities) => {
                if (err) return reject(err);
                resolve({ user, activities });
            });
        });
    });
}

/**
 * Searches for users by username.
 * @param {string} username - The username to search for.
 * @returns {Promise<Array>} A list of users.
 */
function searchUsers(username) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT id, telegram_user_id, instagram_username, vk_user_id, points 
            FROM users 
            WHERE 
                telegram_user_id LIKE ? OR 
                instagram_username LIKE ? OR 
                vk_user_id LIKE ?
        `;
        const searchTerm = `%${username}%`;
        db.all(query, [searchTerm, searchTerm, searchTerm], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

/**
 * Returns statistics from the database.
 * @returns {Promise<object>} Statistics.
 */
function getStats() {
    return new Promise((resolve, reject) => {
        const totalUsersQuery = 'SELECT COUNT(*) as totalUsers FROM users';
        const ticketsSoldQuery = "SELECT COUNT(*) as ticketsSold FROM activity WHERE activity_type = 'purchase'";
        const pointsSpentQuery = "SELECT SUM(points_awarded) as pointsSpent FROM activity WHERE points_awarded < 0"; // Пример, как можно считать потраченные баллы

        db.get(totalUsersQuery, [], (err, usersRow) => {
            if (err) return reject(err);
            db.get(ticketsSoldQuery, [], (err, ticketsRow) => {
                if (err) return reject(err);
                db.get(pointsSpentQuery, [], (err, pointsRow) => {
                    if (err) return reject(err);
                    resolve({
                        totalUsers: usersRow.totalUsers,
                        ticketsSold: ticketsRow.ticketsSold,
                        pointsSpent: Math.abs(pointsRow.pointsSpent || 0)
                    });
                });
            });
        });
    });
}

/**
 * Adjusts the user's points.
 * @param {string} telegramId - The user's Telegram ID.
 * @param {number} points - The number of points to add (can be negative).
 * @param {string} reason - The reason for the adjustment.
 * @returns {Promise<object>} The user's new point balance.
 */
async function adjustPoints(telegramId, points, reason) {
    console.log(`[AdminService] Ручная корректировка баллов для ${telegramId}. Сумма: ${points}. Причина: ${reason}`);

    try {
        const user = await findOrCreateUser(String(telegramId), 'telegram_user_id');
        
        if (!user) {
            const error = new Error('Пользователь не найден и не может быть создан.');
            error.statusCode = 404;
            throw error;
        }

        await addPoints(user.id, points, 'manual', reason);

        // Автоматически обновляем статус пользователя
        const statusUpdate = await statusService.updateUserStatus(telegramId);
        
        const updatedUser = await findOrCreateUser(String(telegramId), 'telegram_user_id');

        console.log(`[AdminService] ✅ Баллы для ${telegramId} обновлены. Новый баланс: ${updatedUser.points}`);
        
        if (statusUpdate.statusChanged) {
            console.log(`[AdminService] 🎉 Статус пользователя изменен: ${statusUpdate.oldStatus} → ${statusUpdate.newStatus}`);
        }
        
        return { 
            success: true, 
            newTotalPoints: updatedUser.points,
            statusUpdate: statusUpdate
        };

    } catch (error) {
        console.error('❌ [AdminService] Ошибка при ручной корректировке баллов:', error);
        throw error;
    }
}

/**
 * Gets user registration statistics by day for the last 30 days.
 * @returns {Promise<Array>} Array of daily registration counts.
 */
function getUserRegistrationStats() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT
                DATE(created_at) as date,
                COUNT(*) as count
            FROM users
            WHERE created_at >= datetime('now', '-30 days')
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `;
        db.all(query, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

/**
 * Gets points distribution statistics.
 * @returns {Promise<Array>} Array of points distribution data.
 */
function getPointsDistribution() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT
                CASE
                    WHEN points < 1000 THEN '0-1000'
                    WHEN points BETWEEN 1000 AND 5000 THEN '1000-5000'
                    WHEN points BETWEEN 5000 AND 10000 THEN '5000-10000'
                    WHEN points BETWEEN 10000 AND 20000 THEN '10000-20000'
                    ELSE '20000+'
                END as range,
                COUNT(*) as count
            FROM users
            GROUP BY range
            ORDER BY range
        `;
        db.all(query, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

/**
 * Gets activity statistics by type for the last 30 days.
 * @returns {Promise<Array>} Array of activity statistics.
 */
function getActivityStats() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT
                activity_type,
                COUNT(*) as count,
                SUM(CASE WHEN points_awarded > 0 THEN points_awarded ELSE 0 END) as total_points_earned,
                SUM(CASE WHEN points_awarded < 0 THEN ABS(points_awarded) ELSE 0 END) as total_points_spent
            FROM activity
            WHERE created_at >= datetime('now', '-30 days')
            GROUP BY activity_type
            ORDER BY count DESC
        `;
        db.all(query, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

/**
 * Gets daily activity statistics for the last 7 days.
 * @returns {Promise<Array>} Array of daily activity data.
 */
function getDailyActivityStats() {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT
                DATE(created_at) as date,
                COUNT(*) as activity_count,
                SUM(CASE WHEN points_awarded > 0 THEN points_awarded ELSE 0 END) as points_earned,
                SUM(CASE WHEN points_awarded < 0 THEN ABS(points_awarded) ELSE 0 END) as points_spent
            FROM activity
            WHERE created_at >= datetime('now', '-7 days')
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `;
        db.all(query, [], (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

module.exports = {
    getTopUsers,
    getUserDetails,
    searchUsers,
    getStats,
    adjustPoints,
    getUserRegistrationStats,
    getPointsDistribution,
    getActivityStats,
    getDailyActivityStats,
};