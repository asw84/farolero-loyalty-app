// backend/controllers/user.controller.js

const userService = require('../services/user.service');

async function getUser(req, res) {
    const { telegramId, referrerId } = req.body;
    try {
        const userData = await userService.getUserData(telegramId, referrerId);
        if (userData) {
            res.json(userData);
        } else {
            res.status(404).json({ message: 'Пользователь не найден' });
        }
    } catch (error) {
        console.error(`❌ [User] Ошибка при получении данных пользователя ${telegramId}:`, error);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
}

module.exports = {
    getUser,
};