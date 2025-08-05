// backend/controllers/admin.controller.js

const adminService = require('../services/admin.service');

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

module.exports = {
    getStats,
    adjustPoints,
};
