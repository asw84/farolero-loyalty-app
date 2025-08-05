// backend/controllers/webhook.controller.js

const crypto = require('crypto');
const webhookService = require('../services/webhook.service');

const QTICKETS_WEBHOOK_SECRET = process.env.QTICKETS_WEBHOOK_SECRET;

async function handleQticketsWebhook(req, res) {
    console.log('[WebhookController] Получено уведомление от Qtickets!');

    // 1. Проверка подписи
    const signature = req.headers['x-signature'];
    const expectedSignature = crypto.createHmac('sha1', QTICKETS_WEBHOOK_SECRET).update(req.rawBody).digest('hex');

    if (signature !== expectedSignature) {
        console.error('[WebhookController] ❌ Ошибка: Неверная подпись вебхука!');
        return res.status(403).send('Invalid signature.');
    }

    // 2. Проверка типа события
    const eventType = req.headers['x-event-type'];
    if (eventType !== 'payed') {
        console.log(`[WebhookController] Пропускаем событие "${eventType}", так как это не оплата.`);
        return res.status(200).send('OK. Event skipped.');
    }

    // 3. Передача данных в сервис для обработки бизнес-логики
    try {
        const result = await webhookService.handleSuccessfulPayment(req.body);
        // Сервис сам решает, какой статус отдать, но для вебхука qtickets всегда ожидает 200 OK
        res.status(200).send(result.message);
    } catch (error) {
        console.error('❌ [WebhookController] Критическая ошибка при обработке вебхука:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    handleQticketsWebhook,
};
