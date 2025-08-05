// backend/services/admin.service.js

const { db, findOrCreateUser, addPoints } = require('../database');

/**
 * Возвращает статистику из базы данных.
 * @returns {Promise<object>} Статистика.
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
 * Корректирует количество баллов пользователя.
 * @param {string} telegramId - ID пользователя в Telegram.
 * @param {number} points - Количество баллов для добавления (может быть отрицательным).
 * @param {string} reason - Причина корректировки.
 * @returns {Promise<object>} Новый баланс пользователя.
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

        const updatedUser = await findOrCreateUser(String(telegramId), 'telegram_user_id');

        console.log(`[AdminService] ✅ Баллы для ${telegramId} обновлены. Новый баланс: ${updatedUser.points}`);
        return { success: true, newTotalPoints: updatedUser.points };

    } catch (error) {
        console.error('❌ [AdminService] Ошибка при ручной корректировке баллов:', error);
        throw error;
    }
}

module.exports = {
    getStats,
    adjustPoints,
};
