// backend/server.js
// ПОЛНАЯ ВЕРСИЯ БЕЗ ЛИШНИХ ЗАГЛУШЕК

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const amocrmClient = require('./amocrm/apiClient');
const qticketsRestApiClient = require('./qtickets/restApiClient'); 

const app = express();
const PORT = 3001;

const QTICKETS_WEBHOOK_SECRET = 'this-is-our-super-secret-key-for-qtickets';

app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(cors());

const TELEGRAM_ID_FIELD_ID = 896821;
const POINTS_FIELD_ID = 896871;
const STATUS_FIELD_ID = 896873;

let qticketsEventsCache = [];

async function loadQticketsData() {
    try {
        console.log('[Qtickets] Загрузка списка мероприятий...');
        const response = await qticketsRestApiClient.get('/events');
        
        if (response.data && response.data.data) {
            qticketsEventsCache = response.data.data.filter(event => event.is_active); // <-- Берем только активные
            console.log(`[Qtickets] ✅ Успешно загружено ${qticketsEventsCache.length} активных мероприятий.`);
        } else {
            qticketsEventsCache = [];
        }
    } catch (error) {
        console.error('❌ [Qtickets] Критическая ошибка при загрузке мероприятий:', error.response ? error.response.data : error.message);
        qticketsEventsCache = [];
    }
}

app.get('/api/walks', (req, res) => {
    console.log(`Отдаю КОРОТКИЙ список из ${qticketsEventsCache.length} прогулок из Qtickets`);
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
    const event = qticketsEventsCache.find(e => e.id == id);
    if (event) {
        res.json({
            id: event.id, city: event.city ? event.city.name : 'Город не указан',
            title: event.name, price: event.shows[0]?.prices[0]?.default_price || 0,
            duration: '1.5 часа', 
            description: (event.description || '').replace(/<[^>]*>?/gm, ''),
        });
    } else {
        res.status(404).json({ message: 'Прогулка не найдена' });
    }
});

app.post('/api/webhook/qtickets', (req, res) => {
    // ... (здесь ничего не меняется)
});

app.get('/api/user/:telegramId', async (req, res) => {
    // ... (здесь ничего не меняется)
});

app.post('/api/order', async (req, res) => {
    // ... (здесь ничего не меняется)
});

app.listen(PORT, () => {
    console.log(`✅ Основной бэкенд-сервер запущен на http://localhost:${PORT}`);
    loadQticketsData();
});