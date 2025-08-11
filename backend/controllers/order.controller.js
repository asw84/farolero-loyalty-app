// backend/controllers/order.controller.js

const orderService = require('../services/order.service');

// Этот объект будет передан из server.js
let walkUrls = {};

function init(urls) {
    walkUrls = urls;
}

async function create(req, res) {
    const { telegramId, walkId, usePoints } = req.body;
    if (!telegramId || !walkId) {
        return res.status(400).json({ message: 'Необходимы telegramId и walkId.' });
    }

    try {
        const result = await orderService.createOrder(telegramId, walkId, walkUrls, usePoints);
        res.json(result);
    } catch (error) {
        console.error('❌ [Order] Критическая ошибка при создании заказа:', error);
        res.status(500).json({ message: error.message || 'Внутренняя ошибка сервера' });
    }
}

module.exports = {
    init,
    create,
};