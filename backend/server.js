// backend/server.js
// РЕФАКТОРИНГ: Логика заказов вынесена в routes/controllers/services

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const amocrmClient = require('./amocrm/apiClient');
const qticketsService = require('./qtickets/qticketsService');
const telegramService = require('./telegram/telegramService');
const walkService = require('./services/walk.service'); // Импортируем сервис
const walkRoutes = require('./routes/walk.routes'); // Импортируем роуты
const userRoutes = require('./routes/user.routes'); // Импортируем роуты
const orderRoutes = require('./routes/order.routes'); // Импортируем роуты
const orderController = require('./controllers/order.controller'); // Импортируем контроллер

const app = express();
const PORT = process.env.PORT || 3001;

// --- КОНФИГУРАЦИЯ ---
const QTICKETS_DISCOUNT_ID = process.env.QTICKETS_DISCOUNT_ID;
const WALK_URLS = {
    1578: 'https://t.me/QticketsBuyBot/buy?startapp=1578', 17333: 'https://t.me/QticketsBuyBot/buy?startapp=17333',
    16423: 'https://t.me/QticketsBuyBot/buy?startapp=16423', 1562: 'https://t.me/QticketsBuyBot/buy?startapp=1562',
    32248: 'https://t.me/QticketsBuyBot/buy?startapp=32248', 5623: 'https://t.me/QticketsBuyBot/buy?startapp=5623',
    25437: 'https://t.me/QticketsBuyBot/buy?startapp=25437', 18920: 'https://t.me/QticketsBuyBot/buy?startapp=18920',
    2616: 'https://t.me/QticketsBuyBot/buy?startapp=2616',
};
const QTICKETS_WEBHOOK_SECRET = process.env.QTICKETS_WEBHOOK_SECRET;

// --- НАСТРОЙКА СЕРВЕРА ---
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(cors({ origin: '*' }));

// Инициализация контроллера заказов
orderController.init(WALK_URLS);

// --- РЕГИСТРАЦИЯ МАРШРУТОВ ---
app.use('/api', walkRoutes);
app.use('/api', userRoutes);
app.use('/api', orderRoutes);

// --- ID ПОЛЕЙ AMO ---
const TELEGRAM_ID_FIELD_ID = process.env.AMO_TELEGRAM_ID_FIELD;
const POINTS_FIELD_ID = process.env.AMO_POINTS_FIELD_ID;

// --- ОСНОВНЫЕ API ЭНДПОИНТЫ (оставшиеся) ---

app.post('/api/webhook/qtickets', async (req, res) => {
    console.log('[Webhook] Получено уведомление от Qtickets!');
    const signature = req.headers['x-signature'];
    const expectedSignature = crypto.createHmac('sha1', QTICKETS_WEBHOOK_SECRET).update(req.rawBody).digest('hex');
    if (signature !== expectedSignature) {
        console.error('[Webhook] ❌ Ошибка: Неверная подпись вебхука!');
        return res.status(403).send('Invalid signature.');
    }
    
    const eventType = req.headers['x-event-type'];
    if (eventType !== 'payed') {
        console.log(`[Webhook] Пропускаем событие "${eventType}", так как это не оплата.`);
        return res.status(200).send('OK. Event skipped.');
    }

    const orderData = req.body;
    let telegramId = orderData.client?.details?.telegram_user?.id;
    if (!telegramId) {
        const utmCampaign = orderData.utm?.find(tag => tag.campaign)?.campaign;
        if (utmCampaign && utmCampaign.startsWith('tgid_')) {
            telegramId = utmCampaign.replace('tgid_', '');
        }
    }

    if (!telegramId) {
        console.log('[Webhook] Не удалось извлечь Telegram ID.');
        return res.status(200).send('OK. No user ID found.');
    }
    console.log(`[Webhook] Найден Telegram ID: ${telegramId}`);

    try {
        const contact = await amocrmClient.findContactByTelegramId(telegramId);
        if (!contact) {
            console.error(`[Webhook] ❌ Пользователь с ID ${telegramId} не найден в AmoCRM.`);
            return res.status(200).send('OK. User not found in CRM.');
        }

        const DELAY_IN_MILLISECONDS = 5 * 60 * 1000;
        console.log(`[Webhook] Планирую начисление 100 баллов для ${telegramId} через 5 минут.`);
        setTimeout(async () => {
            try {
                console.log(`[DelayedTask] ВРЕМЯ ПРИШЛО! Начисляю 100 баллов для ${telegramId}.`);
                const freshContact = await amocrmClient.findContactByTelegramId(telegramId);
                if (freshContact) {
                    const currentPoints = Number(freshContact.custom_fields_values?.find(f => f.field_id == POINTS_FIELD_ID)?.values[0]?.value || 0);
                    const newTotalPoints = currentPoints + 100;
                    await amocrmClient.updateContact(freshContact.id, { [POINTS_FIELD_ID]: newTotalPoints });
                    console.log(`[DelayedTask] ✅ Баллы успешно начислены. Новый баланс: ${newTotalPoints}`);
                }
            } catch(e) { console.error(`[DelayedTask] ❌ Ошибка при отложенном начислении для ${telegramId}:`, e); }
        }, DELAY_IN_MILLISECONDS);

        const PIPELINE_ID = 857311;
        const STATUS_ID_PAID = 17268313;
        const leadName = `Покупка билета через Mini App (${orderData.event?.name || ''})`;
        await amocrmClient.createLead(leadName, {
            pipeline_id: PIPELINE_ID,
            status_id: STATUS_ID_PAID,
            contact_id: contact.id,
            sale: orderData.price
        });
        console.log(`[Webhook] ✅ Новая сделка "${leadName}" создана в воронке ${PIPELINE_ID}, статус ${STATUS_ID_PAID}.`);

        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ [Webhook] Критическая ошибка:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/api/admin/stats', (req, res) => {
    console.log('[Admin] Запрошена статистика');
    res.json({ totalUsers: 150, ticketsSold: 75, pointsSpent: 12500 });
});

app.post('/api/admin/adjust-points', async (req, res) => {
    const { telegramId, points, reason } = req.body;
    console.log(`[Admin] Ручная корректировка баллов для ${telegramId}. Сумма: ${points}. Причина: ${reason}`);
    if (!telegramId || points === undefined) {
        return res.status(400).json({ message: 'Необходимы telegramId и points.' });
    }
    try {
        const contact = await amocrmClient.findContactByTelegramId(telegramId);
        if (!contact) {
            return res.status(404).json({ message: 'Пользователь не найден в AmoCRM.' });
        }
        const currentPoints = Number(contact.custom_fields_values?.find(f => f.field_id == POINTS_FIELD_ID)?.values[0]?.value || 0);
        const newTotalPoints = currentPoints + Number(points);
        await amocrmClient.updateContact(contact.id, { [POINTS_FIELD_ID]: newTotalPoints });
        console.log(`[Admin] ✅ Баллы для ${telegramId} обновлены. Было: ${currentPoints}, стало: ${newTotalPoints}`);
        res.json({ success: true, newTotalPoints });
    } catch (error) {
        console.error('❌ [Admin] Ошибка при ручной корректировке баллов:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера.' });
    }
});

app.post('/api/social/check-subscription', async (req, res) => {
    const { telegramId, socialNetwork } = req.body;
    console.log(`[Social] Запрос на проверку подписки для ${telegramId} в сети ${socialNetwork}`);
    if (socialNetwork !== 'telegram') {
        return res.status(400).json({ success: false, message: `Проверка для ${socialNetwork} пока не реализована.` });
    }
    try {
        const isSubscribed = await telegramService.isUserSubscribed(telegramId);
        if (isSubscribed) {
            console.log(`[Social] ✅ Подписка для ${telegramId} на Telegram подтверждена.`);
            res.json({ success: true, message: `Спасибо за подписку! Вам будет начислено 100 бонусных баллов.` });
        } else {
            console.log(`[Social] ⚠️ Подписка для ${telegramId} на Telegram НЕ подтверждена.`);
            res.json({ success: false, message: `Мы не смогли подтвердить вашу подписку.` });
        }
    } catch (error) {
        console.error('❌ [Social] Критическая ошибка при проверке подписки:', error);
        res.status(500).json({ success: false, message: 'Внутренняя ошибка сервера.' });
    }
});

app.get('/api/amocrm/init', async (req, res) => {
    try {
        await amocrmClient.getInitialToken();
        res.send('Токены AmoCRM успешно получены и сохранены. Эндпоинт можно удалить.');
    } catch (error) {
        res.status(500).send('Ошибка при получении токенов. Проверь консоль бэкенда.');
    }
});

app.listen(PORT, () => {
    console.log(`✅ Основной бэкенд-сервер запущен на http://localhost:${PORT}`);
    walkService.loadQticketsData(); // Используем сервис для загрузки данных
});
