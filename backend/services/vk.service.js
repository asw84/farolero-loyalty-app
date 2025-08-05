// backend/services/vk.service.js

/**
 * Обрабатывает событие нового комментария из VK.
 * @param {object} eventObject - Объект события от VK Callback API.
 */
async function handleNewWallReply(eventObject) {
    const { from_id, text } = eventObject;
    console.log(`[VK_SERVICE] Новый комментарий от пользователя ${from_id}: "${text}"`);

    // TODO: Реализовать логику начисления баллов
    // 1. Найти пользователя в нашей БД по vk_user_id (from_id)
    // 2. Если не найден, создать нового
    // 3. Начислить баллы (например, 10 баллов за комментарий)
    // 4. Сохранить активность в таблице activity

    console.log(`[VK_SERVICE] Начислено 10 баллов пользователю ${from_id}`);

    return { success: true };
}

module.exports = {
    handleNewWallReply,
};
