// backend/routes/analytics.routes.js
// API endpoints для RFM-аналитики согласно ТЗ

const express = require('express');
const router = express.Router();

/**
 * POST /api/analytics/rfm/calculate - Пересчет всех RFM сегментов
 */
router.post('/rfm/calculate', async (req, res) => {
    try {
        console.log('[Analytics] Starting RFM calculation for all users');
        
        const result = await req.modules.rfm.calculateRFMForAllUsers();
        
        res.json({
            success: true,
            message: 'RFM calculation completed',
            data: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[Analytics] Failed to calculate RFM:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate RFM segments',
            message: error.message
        });
    }
});

/**
 * GET /api/analytics/rfm/user/:telegramId - Расчет RFM для пользователя
 */
router.get('/rfm/user/:telegramId', async (req, res) => {
    try {
        const { telegramId } = req.params;
        
        console.log(`[Analytics] Getting RFM for user: ${telegramId}`);
        
        const rfmData = await req.modules.rfm.getUserRFM(telegramId);
        
        if (!rfmData) {
            return res.status(404).json({
                success: false,
                error: 'No purchase data found for user',
                message: 'User has no purchases to analyze'
            });
        }
        
        res.json({
            success: true,
            data: rfmData,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error(`[Analytics] Failed to get RFM for user ${req.params.telegramId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user RFM',
            message: error.message
        });
    }
});

/**
 * GET /api/analytics/rfm/dashboard - RFM дашборд
 */
router.get('/rfm/dashboard', async (req, res) => {
    try {
        console.log('[Analytics] Getting RFM dashboard');
        
        const summary = await req.modules.rfm.getSegmentsSummary();
        const allSegments = req.modules.rfm.getAllSegments();
        
        res.json({
            success: true,
            data: {
                summary,
                segmentDefinitions: allSegments,
                dashboardUrl: '/admin#/rfm',
                recommendations: generateDashboardRecommendations(summary)
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('[Analytics] Failed to get RFM dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get RFM dashboard',
            message: error.message
        });
    }
});

/**
 * GET /api/analytics/rfm/segments - Получение всех сегментов
 */
router.get('/rfm/segments', async (req, res) => {
    try {
        const segments = req.modules.rfm.getAllSegments();
        const summary = await req.modules.rfm.getSegmentsSummary();
        
        res.json({
            success: true,
            data: {
                definitions: segments,
                current: summary.segments || []
            }
        });
        
    } catch (error) {
        console.error('[Analytics] Failed to get segments:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get segments',
            message: error.message
        });
    }
});

/**
 * GET /api/analytics/rfm/segment/:segmentName - Получение пользователей сегмента
 */
router.get('/rfm/segment/:segmentName', async (req, res) => {
    try {
        const { segmentName } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        
        console.log(`[Analytics] Getting users for segment: ${segmentName}`);
        
        const users = await req.modules.rfm.getSegmentUsers(segmentName, limit);
        const segmentInfo = req.modules.rfm.getAllSegments()[segmentName];
        
        if (!segmentInfo) {
            return res.status(404).json({
                success: false,
                error: 'Segment not found',
                availableSegments: Object.keys(req.modules.rfm.getAllSegments())
            });
        }
        
        res.json({
            success: true,
            data: {
                segment: {
                    name: segmentName,
                    ...segmentInfo
                },
                users,
                totalShown: users.length,
                limit
            }
        });
        
    } catch (error) {
        console.error(`[Analytics] Failed to get segment users for ${req.params.segmentName}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to get segment users',
            message: error.message
        });
    }
});

/**
 * GET /api/analytics/loyalty/status/:telegramId - Статус программы лояльности
 */
router.get('/loyalty/status/:telegramId', async (req, res) => {
    try {
        const { telegramId } = req.params;
        
        console.log(`[Analytics] Getting loyalty status for user: ${telegramId}`);
        
        const user = await req.modules.user.findByTelegramId(telegramId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        
        const points = await req.modules.points.getBalance(user.id);
        const status = req.modules.loyalty.calculateStatus(points);
        const statusInfo = req.modules.loyalty.getStatusInfo(status);
        const progress = req.modules.loyalty.getStatusProgress(points);
        const recommendations = req.modules.loyalty.getRecommendations(points);
        
        // Получаем RFM данные если есть
        let rfmData = null;
        try {
            rfmData = await req.modules.rfm.getUserRFM(telegramId);
        } catch (rfmError) {
            console.log('No RFM data for user:', telegramId);
        }
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    telegramId: user.telegramId,
                    firstName: user.firstName,
                    points
                },
                loyalty: {
                    status,
                    statusInfo,
                    progress,
                    recommendations
                },
                rfm: rfmData,
                analytics: {
                    joinedAt: user.createdAt,
                    totalTransactions: await getTransactionCount(user.id),
                    lastActivity: await getLastActivity(user.id)
                }
            }
        });
        
    } catch (error) {
        console.error(`[Analytics] Failed to get loyalty status for ${req.params.telegramId}:`, error);
        res.status(500).json({
            success: false,
            error: 'Failed to get loyalty status',
            message: error.message
        });
    }
});

/**
 * Генерация рекомендаций для дашборда
 */
function generateDashboardRecommendations(summary) {
    const recommendations = [];
    
    if (!summary.segments || summary.segments.length === 0) {
        return [{
            type: 'info',
            title: 'Начните сбор данных',
            description: 'Пока недостаточно данных для RFM-анализа',
            action: 'Активируйте систему покупок'
        }];
    }
    
    const segments = summary.segments;
    
    // Ищем проблемные сегменты
    const atRisk = segments.find(s => s.name === 'At Risk');
    if (atRisk && atRisk.percentage > 15) {
        recommendations.push({
            type: 'warning',
            title: `${atRisk.percentage}% клиентов в группе риска`,
            description: 'Высокий процент клиентов может уйти',
            action: 'Запустить программу возврата клиентов'
        });
    }
    
    const hibernating = segments.find(s => s.name === 'Hibernating');
    if (hibernating && hibernating.percentage > 20) {
        recommendations.push({
            type: 'info',
            title: `${hibernating.percentage}% спящих клиентов`,
            description: 'Большой потенциал для реактивации',
            action: 'Создать кампанию реактивации'
        });
    }
    
    // Ищем позитивные тренды
    const champions = segments.find(s => s.name === 'Champions');
    if (champions && champions.percentage > 10) {
        recommendations.push({
            type: 'success',
            title: `${champions.percentage}% лучших клиентов`,
            description: 'Отличная база лояльных клиентов',
            action: 'Запустить референс-программу'
        });
    }
    
    return recommendations;
}

/**
 * Вспомогательные функции
 */
async function getTransactionCount(userId) {
    // Это будет реализовано через points module
    return 0;
}

async function getLastActivity(userId) {
    // Это будет реализовано через user module
    return null;
}

module.exports = router;