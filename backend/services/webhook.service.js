// backend/services/webhook.service.js

const amocrmClient = require('../amocrm/apiClient');
const { findOrCreateUser, addPoints, deductPendingPoints } = require('../database');
const { POINTS_FOR_REFERRAL_PURCHASE } = require('../config');

const POINTS_FOR_PURCHASE = 100;
const PIPELINE_ID = 857311; // Эти значения тоже стоит вынести в .env
const STATUS_ID_PAID = 17268313;

/**
 * Обрабатывает логику после успешной оплаты заказа в Qtickets.
 * @param {object} orderData - Данные заказа из вебхука.
 */
async function handleSuccessfulPayment(orderData) {
    let telegramId = orderData.client?.details?.telegram_user?.id;
    if (!telegramId) {
        const utmCampaign = orderData.utm?.find(tag => tag.campaign)?.campaign;
        if (utmCampaign && utmCampaign.startsWith('tgid_')) {
            telegramId = utmCampaign.replace('tgid_', '');
        }
    }

    if (!telegramId) {
        console.log('[WebhookService] Не удалось извлечь Telegram ID.');
        return { success: true, message: 'OK. No user ID found.' };
    }
    console.log(`[WebhookService] Найден Telegram ID: ${telegramId}`);

    try {
        // Создаем сделку в AmoCRM, как и раньше
        const contact = await amocrmClient.findContactByTelegramId(telegramId);
        if (contact) {
            const leadName = `Покупка билета через Mini App (${orderData.event?.name || ''})`;
            await amocrmClient.createLead(leadName, {
                pipeline_id: PIPELINE_ID,
                status_id: STATUS_ID_PAID,
                contact_id: contact.id,
                sale: orderData.price
            });
            console.log(`[WebhookService] ✅ Новая сделка "${leadName}" создана.`);
        }

        // Начисляем баллы через нашу новую систему
        const user = await findOrCreateUser(String(telegramId), 'telegram_user_id');
        
        // Deduct points if they were used for a discount
        await deductPendingPoints(user.id);

        // Award points to the referrer if exists
        if (user.referrer_id) {
            const referrer = await findOrCreateUser(user.referrer_id, 'id'); // Assuming findOrCreateUser can find by ID
            if (referrer) {
                await addPoints(referrer.id, POINTS_FOR_REFERRAL_PURCHASE, 'referral', 'purchase_referral');
                console.log(`[WebhookService] ✅ Начислено ${POINTS_FOR_REFERRAL_PURCHASE} баллов рефереру ${referrer.telegram_user_id || referrer.id} за покупку.`);
            }
        }

        const DELAY_IN_MILLISECONDS = 5 * 60 * 1000;
        console.log(`[WebhookService] Планирую начисление ${POINTS_FOR_PURCHASE} баллов для ${telegramId} через 5 минут.`);
        
        setTimeout(async () => {
            try {
                await addPoints(user.id, POINTS_FOR_PURCHASE, 'qtickets', 'purchase');
                console.log(`[DelayedTask] ✅ Баллы за покупку успешно начислены пользователю с Telegram ID ${telegramId}.`);
            } catch (e) {
                console.error(`[DelayedTask] ❌ Ошибка при отложенном начислении для ${telegramId}:`, e);
            }
        }, DELAY_IN_MILLISECONDS);

        return { success: true, message: 'OK' };

    } catch (error) {
        console.error('❌ [WebhookService] Критическая ошибка при обработке вебхука:', error);
        return { success: false, message: 'Internal Server Error' };
    }
}

module.exports = {
    handleSuccessfulPayment,
};