// backend/services/walk.service.js

const qticketsRestApiClient = require('../qtickets/restApiClient');

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

function getAllWalks() {
    console.log(`[Walks] Отдаю КОРОТКИЙ список из ${qticketsEventsCache.length} прогулок`);
    return qticketsEventsCache.map(event => ({
        id: event.id,
        city: event.city ? event.city.name : 'Город не указан',
        title: event.name,
        price: event.shows[0]?.prices[0]?.default_price || 0,
    }));
}

function getWalkById(id) {
    console.log(`[WalkDetails] Запрошены детали для прогулки ID: ${id}`);
    const event = qticketsEventsCache.find(e => e.id == id);
    if (event) {
        return {
            id: event.id,
            city: event.city ? event.city.name : 'Город не указан',
            title: event.name,
            price: event.shows[0]?.prices[0]?.default_price || 0,
            duration: '1.5 часа',
            description: (event.description || '').replace(/<[^>]*>?/gm, ''),
        };
    }
    return null;
}

module.exports = {
    loadQticketsData,
    getAllWalks,
    getWalkById,
};
