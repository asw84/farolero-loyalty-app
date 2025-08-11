// backend/services/order.service.js

const qticketsService = require('../qtickets/qticketsService');
const walkService = require('./walk.service');
const { findUserByTelegramId, setPendingPointsDeduction } = require('../database');
const { QTICKETS_DISCOUNTS } = require('../config');

async function createOrder(telegramId, walkId, walkUrls, usePoints) {
    console.log(`[Order] Получен запрос на создание заказа от telegramId: ${telegramId} для walkId: ${walkId}`);

    const telegramAppUrl = walkUrls[walkId];
    if (!telegramAppUrl) {
        throw new Error(`Ссылка для покупки на прогулку ${walkId} не найдена.`);
    }

    const user = await findUserByTelegramId(telegramId);
    if (!user) {
        throw new Error('Пользователь не найден в базе данных.');
    }

    let promoCode = null;
    let pointsToUse = 0;

    if (usePoints) {
        const userPoints = user.points || 0;
        const walk = walkService.getWalkById(walkId);
        if (!walk) {
            throw new Error('Прогулка не найдена');
        }

        const walkPrice = walk.price || 0;
        
        // Find the best discount the user can afford
        const affordableDiscounts = QTICKETS_DISCOUNTS
            .filter(d => userPoints >= d.points && walkPrice >= d.value)
            .sort((a, b) => b.points - a.points); // Sort by points descending

        if (affordableDiscounts.length > 0) {
            const bestDiscount = affordableDiscounts[0];
            promoCode = await qticketsService.createSinglePromoCode(bestDiscount.discountId);
            pointsToUse = bestDiscount.points;
            await setPendingPointsDeduction(user.id, pointsToUse);
        }
    }

    const finalUrl = new URL(telegramAppUrl);
    finalUrl.searchParams.append('utm_source', 'loyalty_app');
    finalUrl.searchParams.append('utm_campaign', `tgid_${telegramId}`);
    if (promoCode) {
        finalUrl.searchParams.append('promo', promoCode);
    }

    console.log(`[Order] ✅ Заказ успешно сформирован. Отправляю ссылку: ${finalUrl.toString()}`);
    return { orderUrl: finalUrl.toString(), pointsToUse };
}

module.exports = {
    createOrder,
};