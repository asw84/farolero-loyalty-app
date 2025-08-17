// backend/services/vk.service.js

const axios = require('axios');
const { findOrCreateUser, addPoints } = require('../database');

// Константы для баллов
const POINTS_FOR_COMMENT = 10;

// Конфигурация VK API
const VK_API_VERSION = '5.199';
const VK_ACCESS_TOKEN = process.env.VK_ACCESS_TOKEN;      // Универсальный токен
const VK_GROUP_TOKEN = process.env.VK_GROUP_TOKEN;       // Групповой токен
const VK_SERVICE_KEY = process.env.VK_SERVICE_KEY;       // Сервисный ключ
const VK_GROUP_ID = process.env.VK_GROUP_ID;

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

/**
 * Проверяет, является ли пользователь членом VK группы
 * @param {string|number} userId - ID пользователя VK
 * @returns {Promise<boolean>} - true если пользователь подписан
 */
async function isMember(userId) {
    try {
        // Приоритет токенов: SERVICE_KEY > GROUP_TOKEN > ACCESS_TOKEN
        const token = VK_SERVICE_KEY || VK_GROUP_TOKEN || VK_ACCESS_TOKEN;
        
        if (!VK_GROUP_ID || !token) {
            console.error('[VK_SERVICE] ❌ VK_GROUP_ID или токен доступа не настроены');
            return false;
        }

        console.log(`[VK_SERVICE] 🔍 Проверяем подписку пользователя ${userId} на группу ${VK_GROUP_ID}`);
        
        const response = await axios.get('https://api.vk.com/method/groups.isMember', {
            params: {
                group_id: VK_GROUP_ID,
                user_id: userId,
                access_token: token,
                v: VK_API_VERSION
            }
        });

        if (response.data.error) {
            console.error('[VK_SERVICE] ❌ Ошибка VK API при проверке подписки:', response.data.error.error_msg);
            return false;
        }

        const isMember = response.data.response === 1;
        console.log(`[VK_SERVICE] ${isMember ? '✅' : '❌'} Пользователь ${userId} ${isMember ? 'подписан' : 'не подписан'} на группу`);
        
        return isMember;
    } catch (error) {
        console.error('[VK_SERVICE] ❌ Ошибка при проверке подписки:', error.message);
        return false;
    }
}

/**
 * Проверяет, лайкнул ли пользователь пост
 * @param {string|number} userId - ID пользователя VK
 * @param {string|number} ownerId - ID владельца поста (отрицательный для групп)
 * @param {string|number} postId - ID поста
 * @returns {Promise<boolean>} - true если пользователь лайкнул пост
 */
async function hasLikedPost(userId, ownerId, postId) {
    try {
        // Для проверки лайков ОБЯЗАТЕЛЬНО нужен пользовательский ACCESS_TOKEN
        if (!VK_ACCESS_TOKEN || VK_ACCESS_TOKEN.includes('YOUR_') || VK_ACCESS_TOKEN.includes('REQUIRED')) {
            console.log('[VK_SERVICE] ⚠️  VK_ACCESS_TOKEN не настроен - используем альтернативный метод проверки лайков');
            return await hasLikedPostAlternative(userId, ownerId, postId);
        }

        console.log(`[VK_SERVICE] 👍 Проверяем лайк пользователя ${userId} на пост ${ownerId}_${postId}`);
        
        const response = await axios.get('https://api.vk.com/method/likes.isLiked', {
            params: {
                user_id: userId,
                type: 'post',
                owner_id: ownerId,
                item_id: postId,
                access_token: VK_ACCESS_TOKEN,
                v: VK_API_VERSION
            }
        });

        if (response.data.error) {
            console.error('[VK_SERVICE] ❌ Ошибка VK API при проверке лайка:', response.data.error.error_msg);
            console.log('[VK_SERVICE] 🔄 Пробуем альтернативный метод...');
            return await hasLikedPostAlternative(userId, ownerId, postId);
        }

        const hasLiked = response.data.response.liked === 1;
        console.log(`[VK_SERVICE] ${hasLiked ? '✅' : '❌'} Пользователь ${userId} ${hasLiked ? 'лайкнул' : 'не лайкал'} пост`);
        
        return hasLiked;
    } catch (error) {
        console.error('[VK_SERVICE] ❌ Ошибка при проверке лайка:', error.message);
        console.log('[VK_SERVICE] 🔄 Пробуем альтернативный метод...');
        return await hasLikedPostAlternative(userId, ownerId, postId);
    }
}

/**
 * Альтернативный метод проверки лайков через likes.getList
 */
async function hasLikedPostAlternative(userId, ownerId, postId) {
    try {
        const token = VK_SERVICE_KEY || VK_GROUP_TOKEN || VK_ACCESS_TOKEN;
        
        if (!token) {
            console.error('[VK_SERVICE] ❌ Нет доступных токенов');
            return false;
        }

        console.log(`[VK_SERVICE] 🔍 Альтернативная проверка лайков через likes.getList`);
        
        const response = await axios.get('https://api.vk.com/method/likes.getList', {
            params: {
                type: 'post',
                owner_id: ownerId,
                item_id: postId,
                count: 1000, // Проверяем до 1000 лайков
                access_token: token,
                v: VK_API_VERSION
            }
        });

        if (response.data.error) {
            console.error('[VK_SERVICE] ❌ Ошибка альтернативного метода:', response.data.error.error_msg);
            return false;
        }

        const likers = response.data.response.items || [];
        const hasLiked = likers.includes(parseInt(userId));
        
        console.log(`[VK_SERVICE] ${hasLiked ? '✅' : '❌'} Пользователь ${userId} ${hasLiked ? 'лайкнул' : 'не лайкал'} пост (альтернативный метод)`);
        
        return hasLiked;
    } catch (error) {
        console.error('[VK_SERVICE] ❌ Ошибка альтернативного метода:', error.message);
        return false;
    }
}

/**
 * Проверяет, комментировал ли пользователь пост
 * @param {string|number} userId - ID пользователя VK
 * @param {string|number} ownerId - ID владельца поста (отрицательный для групп)
 * @param {string|number} postId - ID поста
 * @returns {Promise<boolean>} - true если пользователь комментировал пост
 */
async function hasCommentedPost(userId, ownerId, postId) {
    try {
        // Попробуем разные токены в порядке приоритета
        const tokens = [VK_ACCESS_TOKEN, VK_SERVICE_KEY, VK_GROUP_TOKEN].filter(token => 
            token && !token.includes('YOUR_') && !token.includes('REQUIRED')
        );
        
        if (tokens.length === 0) {
            console.error('[VK_SERVICE] ❌ Нет настроенных токенов доступа');
            return false;
        }

        console.log(`[VK_SERVICE] 💬 Проверяем комментарий пользователя ${userId} к посту ${ownerId}_${postId}`);
        
        for (const token of tokens) {
            try {
                // Получаем комментарии к посту
                const response = await axios.get('https://api.vk.com/method/wall.getComments', {
                    params: {
                        owner_id: ownerId,
                        post_id: postId,
                        count: 100, // Проверяем до 100 комментариев
                        access_token: token,
                        v: VK_API_VERSION
                    }
                });

                if (response.data.error) {
                    if (response.data.error.error_msg.includes('authorization failed')) {
                        console.log(`[VK_SERVICE] ⚠️  Токен не подходит для wall.getComments, пробуем следующий...`);
                        continue;
                    }
                    console.error('[VK_SERVICE] ❌ Ошибка VK API при получении комментариев:', response.data.error.error_msg);
                    continue;
                }

                const comments = response.data.response.items || [];
                const hasCommented = comments.some(comment => String(comment.from_id) === String(userId));
                
                console.log(`[VK_SERVICE] ${hasCommented ? '✅' : '❌'} Пользователь ${userId} ${hasCommented ? 'комментировал' : 'не комментировал'} пост`);
                
                return hasCommented;
            } catch (error) {
                console.log(`[VK_SERVICE] ⚠️  Ошибка с токеном, пробуем следующий:`, error.message);
                continue;
            }
        }
        
        console.error('[VK_SERVICE] ❌ Не удалось получить комментарии ни с одним токеном');
        return false;
    } catch (error) {
        console.error('[VK_SERVICE] ❌ Ошибка при проверке комментария:', error.message);
        return false;
    }
}

/**
 * Проверяет, репостнул ли пользователь пост
 * @param {string|number} userId - ID пользователя VK
 * @param {string|number} ownerId - ID владельца поста (отрицательный для групп)
 * @param {string|number} postId - ID поста
 * @returns {Promise<boolean>} - true если пользователь репостнул пост
 */
async function hasReposted(userId, ownerId, postId) {
    try {
        // Для получения стены пользователя нужен пользовательский токен или сервисный ключ
        const token = VK_ACCESS_TOKEN || VK_SERVICE_KEY;
        
        if (!token) {
            console.error('[VK_SERVICE] ❌ VK_ACCESS_TOKEN или VK_SERVICE_KEY не настроен');
            return false;
        }

        console.log(`[VK_SERVICE] 🔁 Проверяем репост пользователя ${userId} поста ${ownerId}_${postId}`);
        
        // Проверяем доступность стены пользователя
        const response = await axios.get('https://api.vk.com/method/wall.get', {
            params: {
                owner_id: userId,
                count: 100, // Проверяем последние 100 постов пользователя
                filter: 'all',
                access_token: token,
                v: VK_API_VERSION
            }
        });

        if (response.data.error) {
            // Если стена закрыта или пользователь недоступен, пытаемся альтернативный способ
            if (response.data.error.error_code === 15 || response.data.error.error_code === 18) {
                console.log(`[VK_SERVICE] ⚠️  Стена пользователя ${userId} закрыта или недоступна. Пропускаем проверку репоста.`);
                return false;
            }
            
            console.error('[VK_SERVICE] ❌ Ошибка VK API при получении постов пользователя:', response.data.error.error_msg);
            return false;
        }

        const posts = response.data.response.items || [];
        
        // Проверяем есть ли среди постов репост нужного поста
        const hasRepostedPost = posts.some(post => {
            return post.copy_history && 
                   post.copy_history.some(original => 
                       String(original.owner_id) === String(ownerId) && 
                       String(original.id) === String(postId)
                   );
        });
        
        if (hasRepostedPost) {
            console.log(`[VK_SERVICE] ✅ Пользователь ${userId} репостнул пост на стену`);
            return true;
        }
        
        // Если обычного репоста нет, проверяем избранное (закладки)
        console.log(`[VK_SERVICE] 🔍 Обычного репоста не найдено, проверяем избранное...`);
        const isInFavorites = await checkIfInFavorites(userId, ownerId, postId, token);
        
        if (isInFavorites) {
            console.log(`[VK_SERVICE] ✅ Пост найден в избранном пользователя ${userId}`);
            return true;
        }
        
        // Если пользователь добавил в избранное, но у нас нет пользовательского токена для проверки
        console.log(`[VK_SERVICE] ℹ️  Пользователь ${userId} не сделал обычный репост на стену`);
        console.log(`[VK_SERVICE] ℹ️  Проверка избранного недоступна (нужен пользовательский токен)`);
        console.log(`[VK_SERVICE] 💡 Если пользователь добавил пост в избранное, добавьте VK_USER_TOKEN в .env`);
        return false;
    } catch (error) {
        console.error('[VK_SERVICE] ❌ Ошибка при проверке репоста:', error.message);
        return false;
    }
}

/**
 * Проверяет, добавлен ли пост в избранное пользователя
 * @param {string|number} userId - ID пользователя VK
 * @param {string|number} ownerId - ID владельца поста
 * @param {string|number} postId - ID поста  
 * @param {string} token - токен доступа
 * @returns {Promise<boolean>} - true если пост в избранном
 */
async function checkIfInFavorites(userId, ownerId, postId, token) {
    try {
        // Метод fave.getPosts работает ТОЛЬКО с пользовательским токеном
        // Проверяем, что это не сервисный ключ
        if (!VK_ACCESS_TOKEN || 
            VK_ACCESS_TOKEN.includes('YOUR_') || 
            VK_ACCESS_TOKEN.includes('REQUIRED') ||
            VK_ACCESS_TOKEN === VK_SERVICE_KEY) {
            console.log(`[VK_SERVICE] ⚠️  Нет ПОЛЬЗОВАТЕЛЬСКОГО токена для проверки избранного (fave.getPosts требует user token, а не service key)`);
            return false;
        }

        // Дополнительная проверка - если токен очень длинный, это скорее всего service key
        if (VK_ACCESS_TOKEN.length > 200) {
            console.log(`[VK_SERVICE] ⚠️  VK_ACCESS_TOKEN похож на service key (слишком длинный). Нужен user access token для fave.getPosts`);
            return false;
        }

        const response = await axios.get('https://api.vk.com/method/fave.getPosts', {
            params: {
                count: 100, // Проверяем последние 100 избранных постов
                access_token: VK_ACCESS_TOKEN,
                v: VK_API_VERSION
            }
        });

        if (response.data.error) {
            // Специальная обработка ошибки авторизации
            if (response.data.error.error_msg.includes('service token') || 
                response.data.error.error_msg.includes('authorization failed')) {
                console.log(`[VK_SERVICE] ⚠️  VK_ACCESS_TOKEN является сервисным ключом, а не пользовательским токеном`);
                console.log(`[VK_SERVICE] 💡 Для проверки избранного нужен user access token. Пропускаем проверку избранного.`);
                return false;
            }
            
            console.log(`[VK_SERVICE] ⚠️  Ошибка при проверке избранного:`, response.data.error.error_msg);
            return false;
        }

        const favoritePosts = response.data.response.items || [];
        
        // Ищем наш пост среди избранных
        const isInFavorites = favoritePosts.some(post => {
            return String(post.owner_id) === String(ownerId) && 
                   String(post.id) === String(postId);
        });

        return isInFavorites;
    } catch (error) {
        console.log(`[VK_SERVICE] ⚠️  Ошибка при проверке избранного:`, error.message);
        return false;
    }
}

module.exports = {
    handleNewWallReply,
    isMember,
    hasLikedPost,
    hasCommentedPost,
    hasReposted,
};
