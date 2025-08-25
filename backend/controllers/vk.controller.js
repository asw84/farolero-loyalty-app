// backend/controllers/vk.controller.js
const amocrmService = require('../services/amocrm.service');
const userService = require('../services/user.service');

/**
 * Простая привязка VK аккаунта через VK ID SDK
 * POST /api/vk/link
 */
const linkVKAccount = async (req, res) => {
    try {
        const { access_token, user_id, email, telegram_id, vk_code, device_id } = req.body;

        console.log('[VK_CONTROLLER] 🔗 Привязка VK аккаунта:', {
            user_id,
            email: email ? email.substring(0, 3) + '***' : 'нет',
            telegram_id,
            vk_code: vk_code ? vk_code.substring(0, 20) + '...' : 'нет',
            device_id: device_id ? device_id.substring(0, 20) + '...' : 'нет'
        });

        if (!telegram_id) {
            return res.status(400).json({ 
                error: 'Отсутствует обязательный параметр: telegram_id' 
            });
        }

        let vkUser;
        const axios = require('axios');

        // Если есть VK код - обмениваем на токен через VK ID API
        if (vk_code && device_id) {
            console.log('[VK_CONTROLLER] 🔄 Обмениваем VK код на токен...');
            
            try {
                const tokenParams = new URLSearchParams();
                tokenParams.append('grant_type', 'authorization_code');
                tokenParams.append('client_id', process.env.VK_CLIENT_ID);
                tokenParams.append('code', vk_code);
                tokenParams.append('device_id', device_id);
                tokenParams.append('redirect_uri', 'https://app.5425685-au70735.twc1.net/auth/vk/callback.html');

                const tokenResponse = await axios.post('https://id.vk.com/oauth2/auth', tokenParams, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });

                const { access_token: realToken, user_id: realUserId } = tokenResponse.data;
                
                console.log('[VK_CONTROLLER] ✅ VK токен получен, user_id:', realUserId);

                // Получаем данные пользователя с реальным токеном
                const userResponse = await axios.get('https://id.vk.com/oauth2/user_info', {
                    headers: {
                        'Authorization': `Bearer ${realToken}`
                    }
                });

                vkUser = {
                    id: realUserId,
                    first_name: userResponse.data.user.first_name,
                    last_name: userResponse.data.user.last_name,
                    photo_100: userResponse.data.user.avatar || ''
                };

            } catch (tokenError) {
                console.error('[VK_CONTROLLER] ❌ Ошибка обмена кода на токен:', tokenError.response?.data || tokenError.message);
                return res.status(400).json({ error: 'Не удалось обменять код VK на токен' });
            }

        } else if (access_token && user_id && access_token !== 'temp_token') {
            // Если есть готовый токен - проверяем его
            const vkResponse = await axios.get('https://api.vk.com/method/users.get', {
                params: {
                    user_ids: user_id,
                    access_token: access_token,
                    fields: 'first_name,last_name,photo_100',
                    v: '5.199'
                }
            });

            if (vkResponse.data.error) {
                console.error('[VK_CONTROLLER] ❌ Ошибка VK API:', vkResponse.data.error);
                return res.status(400).json({ error: 'Некорректный VK токен' });
            }

            vkUser = vkResponse.data.response[0];
        } else {
            return res.status(400).json({ 
                error: 'Отсутствуют данные для авторизации VK (нужен либо код+device_id, либо токен+user_id)' 
            });
        }
        console.log('[VK_CONTROLLER] ✅ VK пользователь подтвержден:', vkUser.first_name, vkUser.last_name);

        // 2. Найти пользователя в нашей системе
        const user = await userService.findByTelegramId(telegram_id);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден в системе' });
        }

        // 3. Обновить данные в AmoCRM
        try {
            const contact = await amocrmService.findContactByTelegramId(telegram_id);
            if (contact) {
                await amocrmService.updateContact(contact.id, {
                    [process.env.VK_ID_FIELD_ID || 'vk_id']: user_id
                });
                console.log('[VK_CONTROLLER] ✅ Контакт в AmoCRM обновлен');
            }
        } catch (amocrmError) {
            console.error('[VK_CONTROLLER] ⚠️ Ошибка AmoCRM (не критично):', amocrmError.message);
        }

        // 4. Сохранить в локальной БД
        const db = require('../database');
        const stmt = db.prepare(`
            UPDATE users 
            SET vk_id = ?, vk_first_name = ?, vk_last_name = ?, vk_photo = ?
            WHERE telegram_id = ?
        `);
        
        stmt.run(user_id, vkUser.first_name, vkUser.last_name, vkUser.photo_100, telegram_id);

        console.log('[VK_CONTROLLER] ✅ VK аккаунт успешно привязан');
        res.json({ 
            success: true, 
            vk_user: {
                id: user_id,
                first_name: vkUser.first_name,
                last_name: vkUser.last_name,
                photo: vkUser.photo_100
            }
        });

    } catch (error) {
        console.error('[VK_CONTROLLER] ❌ Ошибка привязки VK:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
};

/**
 * Получить статус привязки VK
 * GET /api/vk/status?telegram_id=123
 */
const getVKStatus = async (req, res) => {
    try {
        const { telegram_id } = req.query;
        
        if (!telegram_id) {
            return res.status(400).json({ error: 'Отсутствует telegram_id' });
        }

        const user = await userService.findByTelegramId(telegram_id);
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const isLinked = !!user.vk_id;
        
        res.json({
            linked: isLinked,
            vk_user: isLinked ? {
                id: user.vk_id,
                first_name: user.vk_first_name,
                last_name: user.vk_last_name,
                photo: user.vk_photo
            } : null
        });

    } catch (error) {
        console.error('[VK_CONTROLLER] ❌ Ошибка получения статуса VK:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
};

module.exports = {
    linkVKAccount,
    getVKStatus
};