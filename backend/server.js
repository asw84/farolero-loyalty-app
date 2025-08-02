// backend/server.js
// ПОЛНАЯ ВЕРСИЯ СО ВСЕМИ ИЗМЕНЕНИЯМИ НА ДАННЫЙ МОМЕНТ

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const amocrmClient = require('./amocrm/apiClient');
const qticketsService = require('./qtickets/qticketsService');
const qticketsRestApiClient = require('./qtickets/restApiClient');

const app = express();
const PORT = 3001;

// --- КОНФИГУРАЦИЯ ---
const QTICKETS_DISCOUNT_ID = '51147';
const WALK_URLS = {
    1578: 'https://t.me/QticketsBuyBot/buy?startapp=1578', 17333: 'https://t.me/QticketsBuyBot/buy?startapp=17333',
    16423: 'https://t.me/QticketsBuyBot/buy?startapp=16423', 1562: 'https://t.me/QticketsBuyBot/buy?startapp=1562',
    32248: 'https://t.me/QticketsBuyBot/buy?startapp=32248', 5623: 'https://t.me/QticketsBuyBot/buy?startapp=5623',
    25437: 'https://t.me/QticketsBuyBot/buy?startapp=25437', 18920: 'https://t.me/QticketsBuyBot/buy?startapp=18920',
    2616: 'https://t.me/QticketsBuyBot/buy?startapp=2616',
};
const QTICKETS_WEBHOOK_SECRET = 'this-is-our-super-secret-key-for-qtickets';

// --- НАСТРОЙКА СЕРВЕРА ---
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(cors({ origin: '*' }));

// --- ID ПОЛЕЙ AMO ---
const TELEGRAM_ID_FIELD_ID = 986895; // ID поля "Telegram ID"
const POINTS_FIELD_ID = 986893;      // ID поля "Баллы"

let qticketsEventsCache = [];

async function loadQticketsData() {
    try {
        console.log('[Qtickets] Загрузка списка мероприятий...');
        const response = await qticketsRestApiClient.get('/events');
        if (response.data && response.data.data) {
            qticketsEventsCache = response.data.data.filter(event => event.is_active);
            console.log(`[Qtickets] ✅ Успешно загружено ${qticketsEventsCache.length} активных мероприятий.`);
        } else {
            qticketsEventsCache = [];
        }
    } catch (error) {
        console.error('❌ [Qtickets] Критическая ошибка при загрузке мероприятий:', error.response ? error.response.data : error.message);
        qticketsEventsCache = [];
    }
}

// --- ОСНОВНЫЕ API ЭНДПОИНТЫ ---
app.get('/api/walks', (req, res) => {
    console.log(`[Walks] Отдаю КОРОТКИЙ список из ${qticketsEventsCache.length} прогулок`);
    const walks = qticketsEventsCache.map(event => ({
        id: event.id,
        city: event.city ? event.city.name : 'Город не указан',
        title: event.name,
        price: event.shows[0]?.prices[0]?.default_price || 0,
    }));
    res.json(walks);
});

app.get('/api/walk/:id', (req, res) => {
    const { id } = req.params;
    console.log(`[WalkDetails] Запрошены детали для прогулки ID: ${id}`);
    const event = qticketsEventsCache.find(e => e.id == id);
    if (event) {
        res.json({
            id: event.id,
            city: event.city ? event.city.name : 'Город не указан',
            title: event.name,
            price: event.shows[0]?.prices[0]?.default_price || 0,
            duration: '1.5 часа',
            description: (event.description || '').replace(/<[^>]*>?/gm, ''),
        });
    } else {
        res.status(404).json({ message: 'Прогулка не найдена' });
    }
});

app.get('/api/user/:telegramId', async (req, res) => {
    const { telegramId } = req.params;
    console.log(`[User] Запрошены данные для пользователя с Telegram ID: ${telegramId}`);
    try {
        const contact = await amocrmClient.findContactByTelegramId(telegramId);
        if (!contact) {
            console.log(`[User] ⚠️ Пользователь с Telegram ID ${telegramId} не найден.`);
            return res.status(404).json({ message: 'Пользователь не найден' });
        }
        const points = contact.custom_fields_values?.find(field => field.field_id === POINTS_FIELD_ID)?.values[0]?.value || 0;
        const userData = {
            points: Number(points),
            status: 'Стандарт',
            referralLink: `https://t.me/farolero_bot?start=ref_${telegramId}`
        };
        console.log(`[User] ✅ Пользователь найден. Отправляю данные:`, userData);
        res.json(userData);
    } catch (error) {
        console.error(`❌ [User] Ошибка при получении данных пользователя ${telegramId}:`, error);
        res.status(500).json({ message: 'Ошибка на сервере' });
    }
});

app.post('/api/order', async (req, res) => {
    const { telegramId, walkId } = req.body;
    console.log(`[Order] Получен запрос на создание заказа от telegramId: ${telegramId} для walkId: ${walkId}`);
    if (!telegramId || !walkId) return res.status(400).json({ message: 'Необходимы telegramId и walkId.' });
    const telegramAppUrl = WALK_URLS[walkId];
    if (!telegramAppUrl) return res.status(404).json({ message: `Ссылка для покупки на прогулку ${walkId} не найдена.` });
    try {
        const contact = await amocrmClient.findContactByTelegramId(telegramId);
        if (!contact) return res.status(404).json({ message: 'Пользователь не найден в CRM.' });
        const userPoints = contact.custom_fields_values.find(field => field.field_id === POINTS_FIELD_ID)?.values[0]?.value || 0;
        const walk = qticketsEventsCache.find(e => e.id == walkId);
        const walkPrice = walk.shows[0]?.prices[0]?.default_price || 0;
        const pointsToUse = Math.min(parseInt(userPoints, 10), parseInt(walkPrice, 10));
        let promoCode = null;
        if (pointsToUse > 0) {
            promoCode = await qticketsService.createSinglePromoCode(QTICKETS_DISCOUNT_ID);
        }
        const finalUrl = new URL(telegramAppUrl);
        finalUrl.searchParams.append('utm_source', 'loyalty_app');
        finalUrl.searchParams.append('utm_campaign', `tgid_${telegramId}`);
        if (promoCode) {
            finalUrl.searchParams.append('promo', promoCode);
        }
        console.log(`[Order] ✅ Заказ успешно сформирован. Отправляю ссылку: ${finalUrl.toString()}`);
        res.json({ orderUrl: finalUrl.toString() });
    } catch (error) {
        console.error('❌ [Order] Критическая ошибка при создании заказа:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
});

app.post('/api/webhook/qtickets', async (req, res) => {
    // --- 1. ПРОВЕРКА ЦИФРОВОЙ ПОДПИСИ (ОБЯЗАТЕЛЬНО!) ---
    const signature = req.headers['x-signature'];
    const expectedSignature = crypto
        .createHmac('sha1', QTICKETS_WEBHOOK_SECRET)
        .update(req.rawBody) // Используем "сырое" тело запроса, которое мы заботливо сохранили
        .digest('hex');

    if (signature !== expectedSignature) {
        console.error('[Webhook] ❌ Ошибка: Неверная подпись вебхука!');
        return res.status(403).send('Invalid signature.');
    }
    console.log('[Webhook] ✅ Подпись вебхука верна.');

    // --- 2. ПРОВЕРКА ТИПА СОБЫТИЯ ---
    const eventType = req.headers['x-event-type'];
    if (eventType !== 'payed') {
        console.log(`[Webhook] Пропускаем событие "${eventType}", так как это не оплата.`);
        return res.status(200).send('OK. Event skipped.');
    }
    console.log('[Webhook] Получено событие "Заказ оплачен". Обрабатываем...');
    
    // --- 3. ИЗВЛЕКАЕМ ДАННЫЕ И TELEGRAM ID (НАДЕЖНЫЙ СПОСОБ) ---
    const orderData = req.body;
    let telegramId = null;

    // Приоритетный способ: из данных о пользователе
    if (orderData.client?.details?.telegram_user?.id) {
        telegramId = orderData.client.details.telegram_user.id;
        console.log(`[Webhook] ID пользователя (${telegramId}) получен из данных telegram_user.`);
    } 
    // Запасной способ: из UTM-метки
    else {
        const utmCampaign = orderData.utm?.find(tag => tag.campaign)?.campaign;
        if (utmCampaign && utmCampaign.startsWith('tgid_')) {
            telegramId = utmCampaign.replace('tgid_', '');
            console.log(`[Webhook] ID пользователя (${telegramId}) получен из UTM-метки.`);
        }
    }

    if (!telegramId) {
        console.error('[Webhook] ❌ Не удалось извлечь Telegram ID ни одним из способов.');
        return res.status(200).send('OK. No user ID found.');
    }

    // --- 4. ОСНОВНАЯ ЛОГИКА (остается почти без изменений) ---
    try {
        const contact = await amocrmClient.findContactByTelegramId(telegramId);
        if (!contact) {
            console.error(`[Webhook] ❌ Пользователь с ID ${telegramId} не найден в AmoCRM.`);
            return res.status(200).send('OK. User not found in CRM.');
        }

        // Имитация отложенного начисления
        const DELAY_IN_MILLISECONDS = 5 * 60 * 1000; // 5 минут для теста
        setTimeout(async () => { /* ... код отложенной задачи ... */ }, DELAY_IN_MILLISECONDS);
        
        // Логика создания сделки
        const PIPELINE_ID = 12345; // <-- ЗАМЕНИТЬ
        const STATUS_ID_PAID = 67890; // <-- ЗАМЕНИТЬ
        const leadName = `Покупка билета через Mini App (${orderData.event?.name || ''})`;
        await amocrmClient.createLead(leadName, {
            pipeline_id: PIPELINE_ID, status_id: STATUS_ID_PAID,
            contact_id: contact.id, sale: orderData.price
        });
        console.log(`[Webhook] ✅ Новая сделка "${leadName}" создана.`);

        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ [Webhook] Критическая ошибка при обработке:', error);
        res.status(500).send('Internal Server Error');
    }
});

// --- АДМИНКА И ЗАДАНИЯ ---
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
        const currentPoints = Number(contact.custom_fields_values?.find(f => f.field_id === POINTS_FIELD_ID)?.values[0]?.value || 0);
        const newTotalPoints = currentPoints + Number(points);
        await amocrmClient.updateContact(contact.id, { [POINTS_FIELD_ID]: newTotalPoints });
        console.log(`[Admin] ✅ Баллы для ${telegramId} обновлены. Было: ${currentPoints}, стало: ${newTotalPoints}`);
        res.json({ success: true, newTotalPoints });
    } catch (error) {
        console.error('❌ [Admin] Ошибка при ручной корректировке баллов:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера.' });
    }
});

app.post('/api/social/check-subscription', (req, res) => {
    const { telegramId, socialNetwork } = req.body;
    console.log(`[Social] Запрос на проверку подписки для ${telegramId} в сети ${socialNetwork}`);
    console.log(`[Social] ✅ Подписка для ${telegramId} на ${socialNetwork} подтверждена (заглушка).`);
    res.json({ success: true, message: `Вам начислено 100 бонусных баллов за подписку на ${socialNetwork}!` });
});

// Временный эндпоинт для инициализации AmoCRM
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
    loadQticketsData();
});