// backend/services/referral.service.js
// Реферальная система с QR-кодами

const { dbRun, dbGet, getDbConnection } = require('../database');
const crypto = require('crypto');
const statusService = require('./status.service');
const achievementsService = require('./achievements.service');

const REFERRAL_BONUSES = {
    REFERRER_BONUS: 50,  // Бонус для того, кто пригласил
    REFEREE_BONUS: 20    // Бонус для нового пользователя
};

/**
 * Генерирует уникальный реферальный код
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {string} - Реферальный код
 */
function generateReferralCode(telegramId) {
    const hash = crypto.createHash('sha256')
        .update(telegramId + Date.now() + Math.random())
        .digest('hex');
    return 'FAR' + hash.substring(0, 8).toUpperCase();
}

/**
 * Создает реферальный код для пользователя
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<string>} - Созданный реферальный код
 */
async function createReferralCode(telegramId) {
    try {
        // Проверяем, есть ли уже код у пользователя
        const existingCode = await dbGet(
            'SELECT referral_code FROM referrals WHERE referrer_telegram_id = ? AND referee_telegram_id IS NULL LIMIT 1',
            [telegramId]
        );
        
        if (existingCode) {
            console.log(`[REFERRAL] ✅ Возвращаем существующий код: ${existingCode.referral_code}`);
            return existingCode.referral_code;
        }

        // Генерируем новый код
        let referralCode;
        let attempts = 0;
        const maxAttempts = 10;

        do {
            referralCode = generateReferralCode(telegramId);
            attempts++;

            try {
                await dbRun(
                    'INSERT INTO referrals (referrer_telegram_id, referral_code) VALUES (?, ?)',
                    [telegramId, referralCode]
                );
                console.log(`[REFERRAL] ✅ Создан новый реферальный код: ${referralCode} для ${telegramId}`);
                return referralCode;
            } catch (error) {
                if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' && attempts < maxAttempts) {
                    console.log(`[REFERRAL] ⚠️ Код ${referralCode} уже существует, генерируем новый...`);
                    continue;
                }
                throw error;
            }
        } while (attempts < maxAttempts);

        throw new Error('Не удалось сгенерировать уникальный реферальный код');
    } catch (error) {
        console.error('[REFERRAL] ❌ Ошибка создания реферального кода:', error);
        throw error;
    }
}

/**
 * Активирует реферальный код при регистрации нового пользователя
 * @param {string} referralCode - Реферальный код
 * @param {string} newUserTelegramId - Telegram ID нового пользователя
 * @returns {Promise<Object>} - Результат активации
 */
async function activateReferralCode(referralCode, newUserTelegramId) {
    const db = getDbConnection();
    
    return new Promise((resolve, reject) => {
        db.serialize(async () => {
            try {
                await dbRun('BEGIN TRANSACTION;');

                // Проверяем валидность кода
                const referral = await dbGet(
                    'SELECT * FROM referrals WHERE referral_code = ? AND referee_telegram_id IS NULL',
                    [referralCode]
                );

                if (!referral) {
                    await dbRun('ROLLBACK;');
                    return reject(new Error('Неверный или уже использованный реферальный код'));
                }

                // Проверяем, что пользователь не активирует свой собственный код
                if (referral.referrer_telegram_id === newUserTelegramId) {
                    await dbRun('ROLLBACK;');
                    return reject(new Error('Нельзя активировать собственный реферальный код'));
                }

                // Проверяем, что пользователь не использовал другие коды ранее
                const existingActivation = await dbGet(
                    'SELECT * FROM referrals WHERE referee_telegram_id = ?',
                    [newUserTelegramId]
                );

                if (existingActivation) {
                    await dbRun('ROLLBACK;');
                    return reject(new Error('Пользователь уже активировал реферальный код'));
                }

                // Активируем реферальный код
                await dbRun(
                    'UPDATE referrals SET referee_telegram_id = ?, activated_at = CURRENT_TIMESTAMP, bonus_amount = ? WHERE referral_code = ?',
                    [newUserTelegramId, REFERRAL_BONUSES.REFERRER_BONUS, referralCode]
                );

                // Начисляем бонус рефереру
                await dbRun(
                    'UPDATE users SET points = points + ? WHERE telegram_user_id = ?',
                    [REFERRAL_BONUSES.REFERRER_BONUS, referral.referrer_telegram_id]
                );

                // Начисляем бонус новому пользователю
                await dbRun(
                    'UPDATE users SET points = points + ? WHERE telegram_user_id = ?',
                    [REFERRAL_BONUSES.REFEREE_BONUS, newUserTelegramId]
                );

                // Записываем активность
                const referrerUser = await dbGet('SELECT id FROM users WHERE telegram_user_id = ?', [referral.referrer_telegram_id]);
                const newUser = await dbGet('SELECT id FROM users WHERE telegram_user_id = ?', [newUserTelegramId]);

                if (referrerUser) {
                    await dbRun(
                        'INSERT INTO activity (user_id, points_awarded, source, activity_type) VALUES (?, ?, ?, ?)',
                        [referrerUser.id, REFERRAL_BONUSES.REFERRER_BONUS, 'referral', 'referrer_bonus']
                    );
                }

                if (newUser) {
                    await dbRun(
                        'INSERT INTO activity (user_id, points_awarded, source, activity_type) VALUES (?, ?, ?, ?)',
                        [newUser.id, REFERRAL_BONUSES.REFEREE_BONUS, 'referral', 'welcome_bonus']
                    );
                }

                // Автоматически обновляем статусы обоих пользователей
                try {
                    const referrerStatusUpdate = await statusService.updateUserStatus(referral.referrer_telegram_id);
                    const newUserStatusUpdate = await statusService.updateUserStatus(newUserTelegramId);
                    
                    if (referrerStatusUpdate.statusChanged) {
                        console.log(`[ReferralService] 🎉 Статус реферера изменен: ${referrerStatusUpdate.oldStatus} → ${referrerStatusUpdate.newStatus}`);
                    }
                    
                    if (newUserStatusUpdate.statusChanged) {
                        console.log(`[ReferralService] 🎉 Статус нового пользователя изменен: ${newUserStatusUpdate.oldStatus} → ${newUserStatusUpdate.newStatus}`);
                    }
                } catch (statusError) {
                    console.error('❌ [ReferralService] Ошибка при обновлении статусов:', statusError);
                    // Не прерываем выполнение, статус обновится при следующем запросе
                }

                // Проверяем достижения для обоих пользователей
                try {
                    // Проверяем достижения реферера (за приглашение друзей)
                    const referrerAchievements = await achievementsService.checkAndUnlockAchievements(referral.referrer_telegram_id, 'referral');
                    if (referrerAchievements.totalUnlocked > 0) {
                        console.log(`[ReferralService] 🏆 Реферер разблокировал ${referrerAchievements.totalUnlocked} достижений`);
                        referrerAchievements.newlyUnlocked.forEach(achievement => {
                            console.log(`[ReferralService] 🏆 ${achievement.name} (+${achievement.points_reward} баллов)`);
                        });
                    }

                    // Проверяем достижения нового пользователя (за баллы и статус)
                    const newUserAchievements = await achievementsService.checkAndUnlockAchievements(newUserTelegramId, 'points');
                    if (newUserAchievements.totalUnlocked > 0) {
                        console.log(`[ReferralService] 🏆 Новый пользователь разблокировал ${newUserAchievements.totalUnlocked} достижений`);
                    }
                } catch (achievementError) {
                    console.warn('[ReferralService] ⚠️ Ошибка проверки достижений:', achievementError.message);
                }

                // Помечаем бонус как выплаченный
                await dbRun(
                    'UPDATE referrals SET bonus_paid = TRUE WHERE referral_code = ?',
                    [referralCode]
                );

                await dbRun('COMMIT;');

                console.log(`[REFERRAL] ✅ Активирован код ${referralCode}: ${referral.referrer_telegram_id} -> ${newUserTelegramId}`);

                resolve({
                    success: true,
                    referrerBonus: REFERRAL_BONUSES.REFERRER_BONUS,
                    refereeBonus: REFERRAL_BONUSES.REFEREE_BONUS,
                    referrerTelegramId: referral.referrer_telegram_id
                });

            } catch (error) {
                await dbRun('ROLLBACK;');
                console.error('[REFERRAL] ❌ Ошибка активации кода:', error);
                reject(error);
            }
        });
    });
}

/**
 * Получает статистику рефералов пользователя
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<Object>} - Статистика рефералов
 */
async function getReferralStats(telegramId) {
    try {
        // Получаем реферальный код пользователя
        const userCode = await dbGet(
            'SELECT referral_code FROM referrals WHERE referrer_telegram_id = ? AND referee_telegram_id IS NULL LIMIT 1',
            [telegramId]
        );

        // Считаем количество приглашенных пользователей
        const totalReferrals = await dbGet(
            'SELECT COUNT(*) as count FROM referrals WHERE referrer_telegram_id = ? AND referee_telegram_id IS NOT NULL',
            [telegramId]
        );

        // Считаем общий заработанный бонус
        const totalEarned = await dbGet(
            'SELECT SUM(bonus_amount) as total FROM referrals WHERE referrer_telegram_id = ? AND bonus_paid = TRUE',
            [telegramId]
        );

        // Получаем список последних рефералов
        const recentReferrals = await new Promise((resolve, reject) => {
            const db = getDbConnection();
            db.all(
                `SELECT referee_telegram_id, activated_at, bonus_amount 
                 FROM referrals 
                 WHERE referrer_telegram_id = ? AND referee_telegram_id IS NOT NULL 
                 ORDER BY activated_at DESC LIMIT 10`,
                [telegramId],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });

        return {
            referralCode: userCode?.referral_code || null,
            totalReferrals: totalReferrals?.count || 0,
            totalEarned: totalEarned?.total || 0,
            recentReferrals: recentReferrals || []
        };

    } catch (error) {
        console.error('[REFERRAL] ❌ Ошибка получения статистики:', error);
        throw error;
    }
}

/**
 * Проверяет валидность реферального кода
 * @param {string} referralCode - Реферальный код для проверки
 * @returns {Promise<Object>} - Информация о коде
 */
async function validateReferralCode(referralCode) {
    try {
        const referral = await dbGet(
            'SELECT referrer_telegram_id, referee_telegram_id FROM referrals WHERE referral_code = ?',
            [referralCode]
        );

        if (!referral) {
            return { valid: false, reason: 'Код не найден' };
        }

        if (referral.referee_telegram_id) {
            return { valid: false, reason: 'Код уже использован' };
        }

        return { 
            valid: true, 
            referrerTelegramId: referral.referrer_telegram_id 
        };

    } catch (error) {
        console.error('[REFERRAL] ❌ Ошибка валидации кода:', error);
        throw error;
    }
}

/**
 * Получает URL для реферальной ссылки
 * @param {string} referralCode - Реферальный код
 * @returns {string} - URL для приглашения
 */
function getReferralUrl(referralCode) {
    const botUrl = process.env.APP_BASE_URL || 'https://t.me/farolero_bot';
    return `${botUrl}?start=ref_${referralCode}`;
}

module.exports = {
    createReferralCode,
    activateReferralCode,
    getReferralStats,
    validateReferralCode,
    getReferralUrl,
    REFERRAL_BONUSES
};
