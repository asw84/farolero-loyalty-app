// backend/controllers/activity.controller.js

const { getDbConnection } = require('../database');

/**
 * Получить активность пользователя по ID
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getUserActivity(req, res) {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).json({ 
                error: 'Missing userId parameter',
                message: 'Необходимо указать ID пользователя' 
            });
        }

        const db = getDbConnection();
        const query = `
            SELECT 
                id,
                user_id,
                points_awarded,
                source,
                activity_type,
                created_at
            FROM activity 
            WHERE user_id = ? 
            ORDER BY created_at DESC
        `;

        db.all(query, [userId], (err, activities) => {
            if (err) {
                console.error('[ACTIVITY_CONTROLLER] ❌ Database error:', err);
                return res.status(500).json({ 
                    error: 'Database error',
                    message: 'Ошибка базы данных' 
                });
            }

            res.json({
                success: true,
                userId: userId,
                activities: activities || [],
                total: activities ? activities.length : 0
            });
        });

    } catch (error) {
        console.error('[ACTIVITY_CONTROLLER] ❌ Unexpected error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Внутренняя ошибка сервера' 
        });
    }
}

/**
 * Получить активность всех пользователей (для админов)
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getAllActivity(req, res) {
    try {
        const db = getDbConnection();
        const query = `
            SELECT 
                a.id,
                a.user_id,
                u.telegram_id,
                a.points_awarded,
                a.source,
                a.activity_type,
                a.created_at
            FROM activity a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC
            LIMIT 100
        `;

        db.all(query, [], (err, activities) => {
            if (err) {
                console.error('[ACTIVITY_CONTROLLER] ❌ Database error:', err);
                return res.status(500).json({ 
                    error: 'Database error',
                    message: 'Ошибка базы данных' 
                });
            }

            res.json({
                success: true,
                activities: activities || [],
                total: activities ? activities.length : 0
            });
        });

    } catch (error) {
        console.error('[ACTIVITY_CONTROLLER] ❌ Unexpected error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            message: 'Внутренняя ошибка сервера' 
        });
    }
}

module.exports = {
    getUserActivity,
    getAllActivity
};
