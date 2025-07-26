// backend/server.js
// ПОЛНАЯ, АКТУАЛЬНАЯ И РАБОЧАЯ ВЕРСИЯ

const express = require('express');
const cors = require('cors');
const crypto = require('crypto'); // Модуль для проверки подписи вебхука
const amocrmClient = require('./amocrm/apiClient');
const qticketsClient = require('./qtickets/apiClient');

const app = express();
const PORT = 3001;

// --- Секретный ключ для проверки подписи вебхука Qtickets ---
// !!! ВАЖНО: Этот ключ должен совпадать с тем, что вы укажете в ЛК Qtickets !!!
const QTICKETS_WEBHOOK_SECRET = 'this-is-our-super-secret-key-for-qtickets';

// Middlewares
// Настраиваем express.json() так, чтобы он сохранял сырое тело запроса для вебхуков
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(cors());

// --- Константы для ID полей из вашего AmoCRM ---
const TELEGRAM_ID_FIELD_ID = 896821;
const POINTS_FIELD_ID = 896871;
const STATUS_FIELD_ID = 896873;

// --- ВРЕМЕННЫЕ ЗАГЛУШКИ ДАННЫХ, ПОКА НЕТ ИНТЕГРАЦИИ С QTICKETS ---
// Сопоставление наших прогулок с ID из Qtickets
const walksMapping = {
    '1': { eventId: 12, showId: 20, seatId: '3-1;1' },
    '2': { eventId: 12, showId: 21, seatId: '3-1;1' },
    '3': { eventId: 33, showId: 41, seatId: '3-1;1' },
};
// Данные о прогулках (наш внутренний справочник)
const allWalks = [
    { id: 1, city: 'Москва', title: 'Тайны Ивановской горки', price: 1200, duration: '1.5 часа', description: 'Это таинственное путешествие по самым загадочным переулкам старой Москвы. Вы услышите истории о призраках, кладах и тайных обществах...' },
    { id: 2, city: 'Санкт-Петербург', title: 'Призраки Петроградской стороны', price: 1300, duration: '2 часа', description: 'Откройте для себя мистическую сторону северной столицы, где каждый дом хранит свою легенду.' },
    { id: 3, city: 'Москва', title: 'Ведьмы с Патриарших', price: 1250, duration: '1 час 45 минут', description: 'Погрузитесь в мир булгаковской Москвы, полный загадок, мистики и литературных тайн.' },
];
// ----------------------------------------------------------------------

// --- Эндпоинт для вебхука Qtickets ---
app.post('/api/webhook/qtickets', (req, res) => {
    console.log('[Webhook] Получен новый вебхук от Qtickets!');
    const signature = req.get('X-Signature');
    const eventType = req.get('X-Event-Type');
    if (!signature) {
        console.error('[Webhook] Ошибка: отсутствует заголовок X-Signature.');
        return res.status(400).send('Signature header is required.');
    }
    const hmac = crypto.createHmac('sha1', QTICKETS_WEBHOOK_SECRET);
    hmac.update(req.rawBody);
    const calculatedSignature = hmac.digest('hex');
    if (calculatedSignature !== signature) {
        console.error(`[Webhook] Ошибка: неверная подпись! Ожидалась: ${calculatedSignature}, Получена: ${signature}`);
        return res.status(403).send('Invalid signature.');
    }
    console.log('[Webhook] ✅ Подпись верна!');
    const data = req.body;
    if (eventType === 'payed') {
        console.log('[Webhook] Заказ успешно оплачен! Данные:', JSON.stringify(data, null, 2));
        console.log(`[Webhook] TODO: Начислить баллы пользователю с Telegram ID: ${data?.client?.telegram_user?.id}`);
    } else {
        console.log(`[Webhook] Получено событие типа "${eventType}", которое мы пока не обрабатываем.`);
    }
    res.status(200).send('Webhook received successfully.');
});

// --- Эндпоинт для получения данных пользователя из AmoCRM ---
app.get('/api/user/:telegramId', async (req, res) => {
    const { telegramId } = req.params;
    console.log(`[AmoCRM] Поиск пользователя с Telegram ID: ${telegramId}`);
    try {
        const response = await amocrmClient.get(`/contacts`, { params: { query: String(telegramId), 'with': 'leads,contacts' } });
        const contact = response.data?._embedded?.contacts?.[0];
        if (!contact) {
            return res.status(404).json({ message: "Контакт не найден" });
        }
        const customFields = contact.custom_fields_values || [];
        const pointsField = customFields.find(f => f.field_id === POINTS_FIELD_ID);
        const statusField = customFields.find(f => f.field_id === STATUS_FIELD_ID);
        const userData = {
            telegramId: telegramId, name: contact.name,
            points: pointsField ? parseInt(pointsField.values[0].value, 10) : 0,
            status: statusField ? statusField.values[0].value : 'Не определен',
            referralLink: `https://t.me/FaroleroMVP_bot?start=${telegramId}`,
        };
        res.json(userData);
    } catch (error) {
        const errorDetails = error.response ? error.response.data : { message: error.message };
        console.error('[AmoCRM] Ошибка при получении данных контакта:', JSON.stringify(errorDetails, null, 2));
        res.status(500).json({ message: 'Ошибка сервера при работе с CRM' });
    }
});

// --- Эндпоинт: Создание заказа на покупку ---
app.post('/api/order', async (req, res) => {
    const { telegramId, walkId } = req.body;
    console.log(`[Qtickets] Получен запрос на создание заказа для пользователя ${telegramId} на прогулку ${walkId}`);
    if (!telegramId || !walkId || !walksMapping[walkId]) {
        return res.status(400).json({ message: 'Некорректный ID пользователя или прогулки' });
    }
    try {
        const amoResponse = await amocrmClient.get(`/contacts`, { params: { query: String(telegramId) } });
        const contact = amoResponse.data?._embedded?.contacts?.[0];
        if (!contact) {
            return res.status(404).json({ message: `Контакт с Telegram ID ${telegramId} не найден в AmoCRM` });
        }
        const customFields = contact.custom_fields_values || [];
        const pointsField = customFields.find(f => f.field_id === POINTS_FIELD_ID);
        const userPoints = pointsField ? parseInt(pointsField.values[0].value, 10) : 0;
        const walkData = allWalks.find(w => w.id == walkId);
        const originalPrice = walkData.price;
        const discountAmount = Math.min(userPoints, originalPrice);
        const finalPrice = originalPrice - discountAmount;
        const { eventId, showId, seatId } = walksMapping[walkId];
        const qticketsResponse = await qticketsClient.post(`/tickets/add/${eventId}/${showId}`, {
            seat_id: seatId, paid: 0, price: finalPrice, user_session: String(telegramId), client_name: contact.name,
        });
        if (qticketsResponse.data.status === 'success' && qticketsResponse.data.result) {
            const ticket = qticketsResponse.data.result;
            console.log(`[Qtickets] Билет забронирован, ID билета: ${ticket.id}`);
            const paymentUrl = `https://qtickets.ru/pay/${ticket.id}`;
            res.json({ status: 'success', paymentUrl: paymentUrl });
        } else {
            console.error('[Qtickets] API бронирования вернуло ошибку:', qticketsResponse.data);
            res.status(502).json({ message: 'Платежный сервис вернул ошибку при бронировании.' });
        }
    } catch (error) {
        const errorDetails = error.response ? error.response.data : { message: error.message };
        console.error('[Qtickets] Ошибка при создании заказа:', JSON.stringify(errorDetails, null, 2));
        res.status(500).json({ message: 'Ошибка на стороне сервера при создании заказа' });
    }
});

// --- Эндпоинты для Прогулок (используют заглушки) ---
app.get('/api/walks', (req, res) => {
    console.log('Отдаю КОРОТКИЙ список прогулок из заглушки');
    const shortWalks = allWalks.map(walk => ({
        id: walk.id,
        city: walk.city,
        title: walk.title,
        price: walk.price
    }));
    res.json(shortWalks);
});

app.get('/api/walk/:id', (req, res) => {
    const { id } = req.params;
    console.log(`Отдаю детали прогулки с ID: ${id} из заглушки`);
    const walk = allWalks.find(w => w.id === parseInt(id));
    if (walk) {
        res.json(walk);
    } else {
        res.status(404).json({ message: 'Прогулка не найдена' });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`✅ Основной бэкенд-сервер запущен на http://localhost:${PORT}`);
});