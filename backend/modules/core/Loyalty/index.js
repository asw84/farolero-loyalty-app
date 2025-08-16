// backend/modules/core/Loyalty/index.js
// Loyalty Module - логика программы лояльности

class LoyaltyModule {
    constructor(logger) {
        this.logger = logger;
        
        // Конфигурация статусов
        this.STATUS_CONFIG = {
            bronze: {
                name: 'Бронза',
                minPoints: 0,
                cashbackRate: 5,
                color: '#CD7F32',
                benefits: ['5% кэшбэк', 'Базовая поддержка']
            },
            silver: {
                name: 'Серебро',
                minPoints: 500,
                cashbackRate: 10,
                color: '#C0C0C0',
                benefits: ['10% кэшбэк', 'Приоритетная поддержка', 'Раннее уведомление о скидках']
            },
            gold: {
                name: 'Золото',
                minPoints: 1500,
                cashbackRate: 15,
                color: '#FFD700',
                benefits: ['15% кэшбэк', 'VIP поддержка', 'Эксклюзивные предложения', 'Бесплатная доставка']
            },
            platinum: {
                name: 'Платина',
                minPoints: 3000,
                cashbackRate: 20,
                color: '#E5E4E2',
                benefits: ['20% кэшбэк', 'Персональный менеджер', 'Эксклюзивные мероприятия', 'Приоритетное бронирование']
            }
        };

        this.logger.info('LoyaltyModule initialized');
    }

    /**
     * Расчет статуса пользователя по баллам
     * @param {number} points - количество баллов
     * @returns {string} - статус пользователя
     */
    calculateStatus(points) {
        this.logger.debug('Calculating status for points', { points });

        if (points >= this.STATUS_CONFIG.platinum.minPoints) {
            return 'platinum';
        } else if (points >= this.STATUS_CONFIG.gold.minPoints) {
            return 'gold';
        } else if (points >= this.STATUS_CONFIG.silver.minPoints) {
            return 'silver';
        } else {
            return 'bronze';
        }
    }

    /**
     * Получение информации о статусе
     * @param {string} status - статус пользователя
     * @returns {Object} - данные о статусе
     */
    getStatusInfo(status) {
        const statusData = this.STATUS_CONFIG[status];
        if (!statusData) {
            throw new Error(`Invalid status: ${status}`);
        }

        return {
            status,
            ...statusData
        };
    }

    /**
     * Расчет кэшбэка по статусу
     * @param {string} status - статус пользователя
     * @param {number} amount - сумма покупки
     * @returns {number} - размер кэшбэка в баллах
     */
    calculateCashback(status, amount) {
        const statusInfo = this.getStatusInfo(status);
        const cashback = Math.floor(amount * statusInfo.cashbackRate / 100);
        
        this.logger.debug('Calculated cashback', { status, amount, cashback, rate: statusInfo.cashbackRate });
        
        return cashback;
    }

    /**
     * Получение прогресса до следующего статуса
     * @param {number} points - текущие баллы
     * @returns {Object} - информация о прогрессе
     */
    getStatusProgress(points) {
        const currentStatus = this.calculateStatus(points);
        const currentStatusInfo = this.getStatusInfo(currentStatus);
        
        // Определяем следующий статус
        let nextStatus = null;
        let pointsToNext = 0;
        let progressPercent = 100; // По умолчанию максимальный статус

        if (currentStatus === 'bronze') {
            nextStatus = 'silver';
            pointsToNext = this.STATUS_CONFIG.silver.minPoints - points;
            progressPercent = (points / this.STATUS_CONFIG.silver.minPoints) * 100;
        } else if (currentStatus === 'silver') {
            nextStatus = 'gold';
            pointsToNext = this.STATUS_CONFIG.gold.minPoints - points;
            const totalNeeded = this.STATUS_CONFIG.gold.minPoints - this.STATUS_CONFIG.silver.minPoints;
            const currentProgress = points - this.STATUS_CONFIG.silver.minPoints;
            progressPercent = (currentProgress / totalNeeded) * 100;
        } else if (currentStatus === 'gold') {
            nextStatus = 'platinum';
            pointsToNext = this.STATUS_CONFIG.platinum.minPoints - points;
            const totalNeeded = this.STATUS_CONFIG.platinum.minPoints - this.STATUS_CONFIG.gold.minPoints;
            const currentProgress = points - this.STATUS_CONFIG.gold.minPoints;
            progressPercent = (currentProgress / totalNeeded) * 100;
        }

        return {
            currentStatus: currentStatusInfo,
            nextStatus: nextStatus ? this.getStatusInfo(nextStatus) : null,
            pointsToNext: Math.max(0, pointsToNext),
            progressPercent: Math.min(100, Math.max(0, progressPercent))
        };
    }

    /**
     * Получение всех статусов с описанием
     * @returns {Array} - список всех статусов
     */
    getAllStatuses() {
        return Object.keys(this.STATUS_CONFIG).map(status => ({
            status,
            ...this.STATUS_CONFIG[status]
        }));
    }

    /**
     * Проверка возможности использования баллов для покупки
     * @param {number} userPoints - баллы пользователя
     * @param {number} requestedPoints - запрошенные к списанию баллы
     * @param {number} purchaseAmount - сумма покупки
     * @returns {Object} - результат проверки
     */
    validatePointsUsage(userPoints, requestedPoints, purchaseAmount) {
        // Максимум можно потратить 50% от суммы покупки баллами
        const maxPointsUsage = Math.floor(purchaseAmount * 0.5);
        
        // Проверяем достаточность баланса
        if (userPoints < requestedPoints) {
            return {
                valid: false,
                error: 'Недостаточно баллов на счету',
                maxAvailable: userPoints
            };
        }

        // Проверяем лимит использования
        if (requestedPoints > maxPointsUsage) {
            return {
                valid: false,
                error: 'Превышен лимит использования баллов (максимум 50% от суммы)',
                maxUsage: maxPointsUsage
            };
        }

        return {
            valid: true,
            pointsToDeduct: requestedPoints,
            remainingPoints: userPoints - requestedPoints,
            discountAmount: requestedPoints // 1 балл = 1 рубль
        };
    }

    /**
     * Расчет итоговой стоимости покупки с учетом баллов и кэшбэка
     * @param {number} originalAmount - исходная сумма
     * @param {number} pointsUsed - использованные баллы
     * @param {string} userStatus - статус пользователя
     * @returns {Object} - детали расчета
     */
    calculatePurchaseDetails(originalAmount, pointsUsed, userStatus) {
        const discount = pointsUsed;
        const finalAmount = originalAmount - discount;
        const cashback = this.calculateCashback(userStatus, finalAmount);

        return {
            originalAmount,
            discount,
            finalAmount: Math.max(0, finalAmount),
            pointsUsed,
            cashbackEarned: cashback,
            userStatus,
            savings: discount + cashback
        };
    }

    /**
     * Проверка на повышение статуса
     * @param {number} oldPoints - старые баллы
     * @param {number} newPoints - новые баллы
     * @returns {Object} - информация о смене статуса
     */
    checkStatusUpgrade(oldPoints, newPoints) {
        const oldStatus = this.calculateStatus(oldPoints);
        const newStatus = this.calculateStatus(newPoints);

        if (oldStatus !== newStatus) {
            return {
                upgraded: true,
                oldStatus: this.getStatusInfo(oldStatus),
                newStatus: this.getStatusInfo(newStatus),
                celebrationMessage: `🎉 Поздравляем! Вы получили статус "${this.getStatusInfo(newStatus).name}"!`
            };
        }

        return {
            upgraded: false,
            currentStatus: this.getStatusInfo(newStatus)
        };
    }

    /**
     * Получение рекомендаций для пользователя
     * @param {number} points - текущие баллы
     * @param {string} lastActivity - последняя активность
     * @returns {Array} - список рекомендаций
     */
    getRecommendations(points, lastActivity = null) {
        const status = this.calculateStatus(points);
        const progress = this.getStatusProgress(points);
        const recommendations = [];

        // Рекомендации по повышению статуса
        if (progress.nextStatus) {
            recommendations.push({
                type: 'status_upgrade',
                title: `До статуса "${progress.nextStatus.name}" осталось ${progress.pointsToNext} баллов`,
                description: `Получите больше преимуществ: ${progress.nextStatus.benefits.join(', ')}`,
                action: 'Узнать как заработать баллы',
                priority: 'high'
            });
        }

        // Рекомендации по активности
        if (!lastActivity || Date.now() - lastActivity > 7 * 24 * 60 * 60 * 1000) {
            recommendations.push({
                type: 'activity',
                title: 'Заработайте баллы за активность',
                description: 'Лайкайте посты, комментируйте и делитесь в соцсетях',
                action: 'Перейти к заданиям',
                priority: 'medium'
            });
        }

        // Рекомендации по использованию баллов
        if (points >= 100) {
            recommendations.push({
                type: 'spend_points',
                title: 'Используйте накопленные баллы',
                description: 'Получите скидку до 50% от суммы покупки',
                action: 'Выбрать мероприятие',
                priority: 'low'
            });
        }

        return recommendations;
    }
}

module.exports = LoyaltyModule;
