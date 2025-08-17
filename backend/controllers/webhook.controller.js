// backend/controllers/webhook.controller.js

const crypto = require('crypto');
const webhookService = require('../services/webhook.service');

const QTICKETS_WEBHOOK_SECRET = process.env.QTICKETS_WEBHOOK_SECRET || 'test_qtickets_secret';
const INSTAGRAM_WEBHOOK_SECRET = process.env.INSTAGRAM_WEBHOOK_SECRET || 'farolero_webhook_secret_2025';

async function handleQticketsWebhook(req, res) {
    console.log('[WebhookController] Получено уведомление от Qtickets!');

    // 1. Проверка подписи (обязательно, даже если секрет не задан в окружении)
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

/**
 * Обрабатывает webhook события от Instagram
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function handleInstagramWebhook(req, res) {
    console.log('[WebhookController] Получено уведомление от Instagram!');
    
    try {
        // 1. Проверка подписи Facebook (X-Hub-Signature)
        const signature = req.headers['x-hub-signature'];
        if (signature) {
            const expectedSignature = 'sha256=' + crypto
                .createHmac('sha256', INSTAGRAM_WEBHOOK_SECRET)
                .update(JSON.stringify(req.body))
                .digest('hex');
            
            if (signature !== expectedSignature) {
                console.error('[WebhookController] ❌ Неверная подпись Instagram webhook!');
                return res.status(403).send('Invalid signature');
            }
        }

        // 2. Обработка webhook challenge (для верификации)
        if (req.query['hub.mode'] === 'subscribe' && req.query['hub.challenge']) {
            console.log('[WebhookController] Instagram webhook challenge получен');
            return res.status(200).send(req.query['hub.challenge']);
        }

        // 3. Обработка событий Instagram
        const events = req.body.entry || [];
        for (const entry of events) {
            if (entry.changes) {
                for (const change of entry.changes) {
                    await handleInstagramEvent(change);
                }
            }
        }

        res.status(200).send('OK');
        
    } catch (error) {
        console.error('❌ [WebhookController] Ошибка обработки Instagram webhook:', error);
        res.status(500).send('Internal Server Error');
    }
}

/**
 * Обрабатывает отдельное событие Instagram
 * @param {Object} change - Объект изменения от Instagram
 */
async function handleInstagramEvent(change) {
    try {
        const { field, value } = change;
        
        switch (field) {
            case 'mentions':
                console.log('[WebhookController] Instagram mention:', value);
                // TODO: Обработка упоминаний
                break;
                
            case 'comments':
                console.log('[WebhookController] Instagram comment:', value);
                // TODO: Обработка комментариев
                break;
                
            case 'likes':
                console.log('[WebhookController] Instagram like:', value);
                // TODO: Обработка лайков
                break;
                
            default:
                console.log(`[WebhookController] Неизвестное Instagram событие: ${field}`);
        }
        
    } catch (error) {
        console.error('[WebhookController] Ошибка обработки Instagram события:', error);
    }
}

module.exports = {
    handleQticketsWebhook,
    handleInstagramWebhook,
};
