// backend/controllers/user.controller.js

const userService = require('../services/user.service');

async function getUser(req, res) {
    const { telegramId, referrerId } = req.body;

    // Validate required fields
    if (!telegramId) {
        return res.status(400).json({ message: 'telegramId обязателен' });
    }

    try {
        const userData = await userService.getUserData(telegramId, referrerId);
        if (userData) {
            return res.json(userData);
        } else {
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
    } catch (error) {
        console.error(`❌ [User] Ошибка при получении данных пользователя ${telegramId}:`, error);
        return res.status(500).json({ message: 'Ошибка на сервере' });
    }
}

module.exports = {
    getUser,
};