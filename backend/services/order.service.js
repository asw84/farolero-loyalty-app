// backend/services/order.service.js

const amocrmClient = require('../amocrm/apiClient');
const qticketsService = require('../qtickets/qticketsService');
const walkService = require('./walk.service');

const POINTS_FIELD_ID = process.env.AMO_POINTS_FIELD_ID;
const QTICKETS_DISCOUNT_ID = process.env.QTICKETS_DISCOUNT_ID;

async function createOrder(telegramId, walkId, walkUrls) {
    console.log(`[Order] Получен запрос на создание заказа от telegramId: ${telegramId} для walkId: ${walkId}`);

    const telegramAppUrl = walkUrls[walkId];
    if (!telegramAppUrl) {
        throw new Error(`Ссылка для покупки на прогулку ${walkId} не найдена.`);
    }

    const contact = await amocrmClient.findContactByTelegramId(telegramId);
    if (!contact) {
        throw new Error('Пользователь не найден в CRM.');
    }

    const userPoints = contact.custom_fields_values.find(field => field.field_id == POINTS_FIELD_ID)?.values[0]?.value || 0;
    const walk = walkService.getWalkById(walkId);
    if (!walk) {
        throw new Error('Прогулка не найдена');
    }

    const walkPrice = walk.price || 0;
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
    return { orderUrl: finalUrl.toString() };
}

module.exports = {
    createOrder,
};
