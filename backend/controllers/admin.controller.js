// backend/controllers/admin.controller.js

const adminService = require('../services/admin.service');

async function getTopUsers(req, res) {
    try {
        const users = await adminService.getTopUsers();
        res.json(users);
    } catch (error) {
        console.error('❌ [AdminController] Error getting top users:', error);
        res.status(500).json({ message: error.message || 'Internal server error.' });
    }
}

async function getUserDetails(req, res) {
    const { id } = req.params;
    try {
        const details = await adminService.getUserDetails(id);
        if (details) {
            res.json(details);
        } else {
            res.status(404).json({ message: 'User not found.' });
        }
    } catch (error) {
        console.error('❌ [AdminController] Error getting user details:', error);
        res.status(500).json({ message: error.message || 'Internal server error.' });
    }
}

async function searchUsers(req, res) {
    const { username } = req.query;
    if (!username) {
        return res.status(400).json({ message: 'Username is required.' });
    }

    try {
        const users = await adminService.searchUsers(username);
        res.json(users);
    } catch (error) {
        console.error('❌ [AdminController] Error searching users:', error);
        res.status(500).json({ message: error.message || 'Internal server error.' });
    }
}

function getStats(req, res) {
    const stats = adminService.getStats();
    res.json(stats);
}

async function adjustPoints(req, res) {
    const { telegramId, points, reason } = req.body;
    if (!telegramId || points === undefined) {
        return res.status(400).json({ message: 'Необходимы telegramId и points.' });
    }

    try {
        const result = await adminService.adjustPoints(telegramId, points, reason);
        res.json(result);
    } catch (error) {
        console.error('❌ [AdminController] Ошибка при ручной корректировке баллов:', error);
        // Отправляем статус-код из ошибки, если он есть, иначе 500
        res.status(error.statusCode || 500).json({ message: error.message || 'Внутренняя ошибка сервера.' });
    }
}

async function getUserRegistrationStats(req, res) {
    try {
        const stats = await adminService.getUserRegistrationStats();
        res.json(stats);
    } catch (error) {
        console.error('❌ [AdminController] Error getting user registration stats:', error);
        res.status(500).json({ message: error.message || 'Internal server error.' });
    }
}

async function getPointsDistribution(req, res) {
    try {
        const distribution = await adminService.getPointsDistribution();
        res.json(distribution);
    } catch (error) {
        console.error('❌ [AdminController] Error getting points distribution:', error);
        res.status(500).json({ message: error.message || 'Internal server error.' });
    }
}

async function getActivityStats(req, res) {
    try {
        const stats = await adminService.getActivityStats();
        res.json(stats);
    } catch (error) {
        console.error('❌ [AdminController] Error getting activity stats:', error);
        res.status(500).json({ message: error.message || 'Internal server error.' });
    }
}

async function getDailyActivityStats(req, res) {
    try {
        const stats = await adminService.getDailyActivityStats();
        res.json(stats);
    } catch (error) {
        console.error('❌ [AdminController] Error getting daily activity stats:', error);
        res.status(500).json({ message: error.message || 'Internal server error.' });
    }
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