// backend/controllers/vk.controller.js
const vkService = require('../services/vk.service');
const VK_CONFIRMATION_TOKEN = process.env.VK_CONFIRMATION_TOKEN;
const VK_SECRET_KEY = process.env.VK_SECRET_KEY;

async function handleVkCallback(req, res) {
    const { type, object, secret } = req.body;

    // 1. Проверка секретного ключа (если он установлен в настройках VK)
    if (VK_SECRET_KEY && secret !== VK_SECRET_KEY) {
        console.warn('[VK_CONTROLLER] Отклонен запрос с неверным секретным ключом.');
        return res.status(403).send('Forbidden');
    }

    // 2. Обработка разных типов событий
    switch (type) {
        // VK присылает этот тип, чтобы убедиться, что сервер доступен
        case 'confirmation':
            console.log('[VK_CONTROLLER] Получен запрос на подтверждение сервера.');
            // Отправляем специальный токен подтверждения
            res.send(VK_CONFIRMATION_TOKEN);
            break;

        // Событие нового комментария на стене
        case 'wall_reply_new':
            console.log('[VK_CONTROLLER] Получено событие нового комментария.');
            await vkService.handleNewWallReply(object);
            // Отвечаем 'ok', чтобы VK понял, что событие принято
            res.status(200).send('ok');
            break;

        // Событие нового лайка
        case 'like_add':
            console.log('[VK_CONTROLLER] Получено событие нового лайка.');
            await vkService.handleLikeAdd(object);
            // Отвечаем 'ok', чтобы VK понял, что событие принято
            res.status(200).send('ok');
            break;

        // Можно добавить обработку других событий (вступление в группу, лайки и т.д.)
        // case 'group_join':
        //     ...

        default:
            console.log(`[VK_CONTROLLER] Получено неизвестное событие: ${type}`);
            res.status(200).send('ok'); // Всегда отвечаем 'ok' на неизвестные события
            break;
    }
}

module.exports = {
    handleVkCallback,
};