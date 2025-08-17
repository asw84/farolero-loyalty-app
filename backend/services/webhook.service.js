// backend/services/webhook.service.js

const amocrmClient = require('../amocrm/apiClient');
const { findOrCreateUser, addPoints, deductPendingPoints, addPurchase } = require('../database');
const { POINTS_FOR_REFERRAL_PURCHASE } = require('../config');
const statusService = require('./status.service');
const achievementsService = require('./achievements.service');

const BASE_POINTS_FOR_PURCHASE = 100;
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

        // Записываем покупку в историю
        const purchaseData = {
            user_id: user.id,
            event_id: orderData.event?.id || null,
            event_name: orderData.event?.name || 'Покупка билета',
            total_price: orderData.price || 0,
            cashback_used: 0, // Для обычных покупок (не кэшбэк)
            final_price: orderData.price || 0,
            purchase_date: new Date().toISOString(),
            source: 'qtickets_webhook'
        };
        
        await addPurchase(purchaseData);
        console.log(`[WebhookService] ✅ Покупка записана в историю: ${purchaseData.event_name}`);

        // Проверяем достижения связанные с покупками
        try {
            const achievementResult = await achievementsService.checkAndUnlockAchievements(telegramId, 'purchase');
            if (achievementResult.totalUnlocked > 0) {
                console.log(`[WebhookService] 🏆 Разблокировано ${achievementResult.totalUnlocked} достижений за покупку`);
                achievementResult.newlyUnlocked.forEach(achievement => {
                    console.log(`[WebhookService] 🏆 Достижение: ${achievement.name} (+${achievement.points_reward} баллов)`);
                });
            }
        } catch (achievementError) {
            console.warn('[WebhookService] ⚠️ Ошибка проверки достижений:', achievementError.message);
        }

        // Планируем начисление баллов с учетом статуса пользователя
        const DELAY_IN_MILLISECONDS = 5 * 60 * 1000;
        console.log(`[WebhookService] Планирую начисление баллов для ${telegramId} через 5 минут.`);
        
        setTimeout(async () => {
            try {
                // Получаем актуальный статус пользователя для расчета кэшбэка
                const userStatus = await statusService.getUserStatus(telegramId);
                const purchaseAmount = orderData.price || 0;
                
                // Рассчитываем кэшбэк согласно статусу
                const cashbackCalculation = await statusService.calculateCashback(telegramId, purchaseAmount);
                const cashbackPoints = cashbackCalculation.cashbackAmount;
                
                // Начисляем базовые баллы за покупку
                await addPoints(user.id, BASE_POINTS_FOR_PURCHASE, 'qtickets', 'purchase_base');
                console.log(`[DelayedTask] ✅ Начислено ${BASE_POINTS_FOR_PURCHASE} базовых баллов за покупку`);
                
                // Начисляем кэшбэк согласно статусу
                if (cashbackPoints > 0) {
                    await addPoints(user.id, cashbackPoints, 'qtickets', 'purchase_cashback');
                    console.log(`[DelayedTask] ✅ Начислен кэшбэк ${cashbackPoints} баллов (${cashbackCalculation.cashbackRate}% от ${purchaseAmount} руб.)`);
                }
                
                // Обновляем статус пользователя (баллы могли измениться)
                const statusUpdate = await statusService.updateUserStatus(telegramId);
                if (statusUpdate.statusChanged) {
                    console.log(`[DelayedTask] 🎉 Статус повышен: ${statusUpdate.oldStatus} → ${statusUpdate.newStatus}`);
                }
                
                const totalPoints = BASE_POINTS_FOR_PURCHASE + cashbackPoints;
                console.log(`[DelayedTask] ✅ Итого начислено ${totalPoints} баллов пользователю ${telegramId}`);
                
                // Проверяем достижения после начисления баллов и изменения статуса
                try {
                    const achievementResult = await achievementsService.checkAndUnlockAchievements(telegramId, 'points');
                    if (achievementResult.totalUnlocked > 0) {
                        console.log(`[DelayedTask] 🏆 Разблокировано ${achievementResult.totalUnlocked} достижений за баллы`);
                    }
                    
                    const statusAchievementResult = await achievementsService.checkAndUnlockAchievements(telegramId, 'status');
                    if (statusAchievementResult.totalUnlocked > 0) {
                        console.log(`[DelayedTask] 🏆 Разблокировано ${statusAchievementResult.totalUnlocked} достижений за статус`);
                    }
                } catch (achievementError) {
                    console.warn('[DelayedTask] ⚠️ Ошибка проверки достижений:', achievementError.message);
                }
                
            } catch (e) {
                console.error(`[DelayedTask] ❌ Ошибка при отложенном начислении для ${telegramId}:`, e);
                // Fallback - начисляем только базовые баллы
                try {
                    await addPoints(user.id, BASE_POINTS_FOR_PURCHASE, 'qtickets', 'purchase_fallback');
                    console.log(`[DelayedTask] ⚠️ Начислены только базовые баллы (fallback): ${BASE_POINTS_FOR_PURCHASE}`);
                } catch (fallbackError) {
                    console.error(`[DelayedTask] ❌ Критическая ошибка fallback:`, fallbackError);
                }
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