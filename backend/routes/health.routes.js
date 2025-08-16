// backend/routes/health.routes.js
// Health check для системы токенов AmoCRM

const express = require('express');
const router = express.Router();
const TokenManager = require('../utils/token-manager');
const { healthCheckModules } = require('../modules/bootstrap');

const tokenManager = new TokenManager('amocrm');

/**
 * GET /api/health - Общий health check
 */
router.get('/', async (req, res) => {
    try {
        const { db } = require('../database');
        
        // Проверяем соединение с БД
        const dbOk = db.prepare('SELECT 1').get();
        
        // Проверяем состояние токенов
        const tokenHealth = tokenManager.getHealthStatus();
        
        // Проверяем основные сервисы
        // Проверяем модули
        const moduleHealth = healthCheckModules();
        
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: dbOk ? 'healthy' : 'unhealthy',
                tokens: tokenHealth,
                modules: moduleHealth,
                environment: process.env.NODE_ENV || 'development'
            }
        };

        const overallStatus = (
            health.services.database === 'healthy' && 
            tokenHealth.overall === 'healthy' &&
            moduleHealth.status === 'healthy'
        ) ? 'healthy' : 'unhealthy';

        health.status = overallStatus;
        
        res.status(overallStatus === 'healthy' ? 200 : 503).json(health);
    } catch (error) {
        console.error('[Health] ❌ Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * GET /api/health/tokens - Детальная проверка токенов
 */
router.get('/tokens', async (req, res) => {
    try {
        const tokenHealth = tokenManager.getHealthStatus();
        const tokens = tokenManager.getTokens();
        
        const response = {
            status: tokenHealth.overall,
            timestamp: new Date().toISOString(),
            storage: tokenHealth,
            tokens: {
                hasAccessToken: !!tokens.access_token,
                hasRefreshToken: !!tokens.refresh_token,
                expired: tokenManager.isTokenExpired(tokens),
                createdAt: tokens.created_at ? new Date(tokens.created_at * 1000).toISOString() : null,
                expiresIn: tokens.expires_in
            }
        };

        res.json(response);
    } catch (error) {
        console.error('[Health] ❌ Token health check failed:', error);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * POST /api/health/tokens/clear - Очистка всех токенов (для отладки)
 * ВНИМАНИЕ: Только для development!
 */
router.post('/tokens/clear', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
            error: 'Token clearing is not allowed in production'
        });
    }

    try {
        tokenManager.clearAllTokens();
        
        res.json({
            status: 'success',
            message: 'All tokens cleared from all storages',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[Health] ❌ Failed to clear tokens:', error);
        res.status(500).json({
            status: 'error',
            error: error.message
        });
    }
});

module.exports = router;
