// backend/services/webhook.service.js

const amocrmClient = require('../amocrm/apiClient');

const POINTS_FIELD_ID = process.env.AMO_POINTS_FIELD_ID;
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
        // Возвращаем true, чтобы контроллер знал, что обработка прошла штатно (без ID).
        return { success: true, message: 'OK. No user ID found.' };
    }
    console.log(`[WebhookService] Найден Telegram ID: ${telegramId}`);

    const contact = await amocrmClient.findContactByTelegramId(telegramId);
    if (!contact) {
        console.error(`[WebhookService] ❌ Пользователь с ID ${telegramId} не найден в AmoCRM.`);
        return { success: true, message: 'OK. User not found in CRM.' };
    }

    // 1. Создание сделки
    const leadName = `Покупка билета через Mini App (${orderData.event?.name || ''})`;
    await amocrmClient.createLead(leadName, {
        pipeline_id: PIPELINE_ID,
        status_id: STATUS_ID_PAID,
        contact_id: contact.id,
        sale: orderData.price
    });
    console.log(`[WebhookService] ✅ Новая сделка "${leadName}" создана.`);

    // 2. Отложенное начисление баллов
    const DELAY_IN_MILLISECONDS = 5 * 60 * 1000;
    console.log(`[WebhookService] Планирую начисление 100 баллов для ${telegramId} через 5 минут.`);
    setTimeout(async () => {
        try {
            console.log(`[DelayedTask] ВРЕМЯ ПРИШЛО! Начисляю 100 баллов для ${telegramId}.`);
            // Важно! Получаем свежие данные о контакте перед обновлением.
            const freshContact = await amocrmClient.findContactByTelegramId(telegramId);
            if (freshContact) {
                const currentPoints = Number(freshContact.custom_fields_values?.find(f => f.field_id == POINTS_FIELD_ID)?.values[0]?.value || 0);
                const newTotalPoints = currentPoints + 100;
                await amocrmClient.updateContact(freshContact.id, { [POINTS_FIELD_ID]: newTotalPoints });
                console.log(`[DelayedTask] ✅ Баллы успешно начислены. Новый баланс: ${newTotalPoints}`);
            }
        } catch (e) {
            console.error(`[DelayedTask] ❌ Ошибка при отложенном начислении для ${telegramId}:`, e);
        }
    }, DELAY_IN_MILLISECONDS);

    return { success: true, message: 'OK' };
}

module.exports = {
    handleSuccessfulPayment,
};
