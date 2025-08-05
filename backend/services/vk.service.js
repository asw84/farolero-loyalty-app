// backend/services/vk.service.js

const { findOrCreateUser, addPoints } = require('../database');

const POINTS_FOR_COMMENT = 10;

/**
 * Обрабатывает событие нового комментария из VK.
 * @param {object} eventObject - Объект события от VK Callback API.
 */
async function handleNewWallReply(eventObject) {
    const { from_id, text } = eventObject;
    console.log(`[VK_SERVICE] Новый комментарий от пользователя ${from_id}: "${text}"`);

    try {
        // 1. Находим или создаем пользователя по его VK ID
        const user = await findOrCreateUser(String(from_id), 'vk_user_id');

        // 2. Начисляем баллы и записываем активность
        await addPoints(user.id, POINTS_FOR_COMMENT, 'vk', 'comment');

        console.log(`[VK_SERVICE] ✅ Успешно начислено ${POINTS_FOR_COMMENT} баллов пользователю с VK ID ${from_id}`);

        return { success: true };
    } catch (error) {
        console.error('❌ [VK_SERVICE] Ошибка при обработке комментария из VK:', error);
        // В реальном приложении здесь можно добавить более детальную обработку ошибок
        return { success: false };
    }
}

module.exports = {
    handleNewWallReply,
};
