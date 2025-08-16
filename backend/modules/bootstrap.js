// backend/modules/bootstrap.js
// Инициализация и настройка всех модулей с DI

const { container } = require('./container');
const { db } = require('../database');

// Core модули
const UserModule = require('./core/User');
const PointsModule = require('./core/Points');
const LoyaltyModule = require('./core/Loyalty');

// Business модули
const RFMAnalyticsModule = require('./business/RFMAnalytics');

// Утилиты
const TokenManager = require('../utils/token-manager');
const VKConfigValidator = require('../utils/vk-config-validator');

/**
 * Простой logger для модулей
 */
class Logger {
    info(message, data = {}) {
        console.log(`[INFO] ${message}`, data);
    }

    debug(message, data = {}) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEBUG] ${message}`, data);
        }
    }

    warn(message, data = {}) {
        console.warn(`[WARN] ${message}`, data);
    }

    error(message, data = {}) {
        console.error(`[ERROR] ${message}`, data);
    }
}

/**
 * Инициализация всех модулей в контейнере
 */
function bootstrapModules() {
    console.log('🚀 Bootstrapping modules...');

    // Регистрируем базовые зависимости
    container.registerInstance('database', db);
    container.registerInstance('logger', new Logger());

    // Регистрируем утилиты
    container.register('tokenManager', (container) => {
        return new TokenManager('amocrm');
    });

    container.register('vkConfigValidator', (container) => {
        return new VKConfigValidator();
    });

    // Регистрируем core модули
    container.register('userModule', (container) => {
        return new UserModule(
            container.resolve('database'),
            container.resolve('logger')
        );
    });

    container.register('pointsModule', (container) => {
        return new PointsModule(
            container.resolve('database'),
            container.resolve('logger'),
            container.resolve('userModule')
        );
    });

    container.register('loyaltyModule', (container) => {
        return new LoyaltyModule(
            container.resolve('logger')
        );
    });

    container.register('rfmAnalyticsModule', (container) => {
        return new RFMAnalyticsModule(
            container.resolve('database'),
            container.resolve('logger'),
            container.resolve('userModule'),
            container.resolve('pointsModule')
        );
    });

    // Создаем синглтоны для проверки инициализации
    const userModule = container.resolve('userModule');
    const pointsModule = container.resolve('pointsModule');
    const loyaltyModule = container.resolve('loyaltyModule');
    const rfmAnalyticsModule = container.resolve('rfmAnalyticsModule');

    console.log('✅ Modules bootstrapped successfully');
    console.log(`📊 Registered services: ${container.getRegisteredServices().join(', ')}`);

    return {
        userModule,
        pointsModule,
        loyaltyModule,
        rfmAnalyticsModule,
        container
    };
}

/**
 * Инициализация модулей для тестов
 */
function bootstrapTestModules(mockDatabase = null) {
    const testContainer = container.createChild();
    
    // Используем мок базу данных для тестов
    if (mockDatabase) {
        testContainer.registerInstance('database', mockDatabase);
    }

    testContainer.registerInstance('logger', new Logger());

    // Регистрируем модули с тестовыми зависимостями
    testContainer.register('userModule', (container) => {
        return new UserModule(
            container.resolve('database'),
            container.resolve('logger')
        );
    });

    testContainer.register('pointsModule', (container) => {
        return new PointsModule(
            container.resolve('database'),
            container.resolve('logger'),
            container.resolve('userModule')
        );
    });

    testContainer.register('loyaltyModule', (container) => {
        return new LoyaltyModule(
            container.resolve('logger')
        );
    });

    return testContainer;
}

/**
 * Middleware для внедрения модулей в контроллеры
 */
function injectModules(req, res, next) {
    req.modules = {
        user: container.resolve('userModule'),
        points: container.resolve('pointsModule'),
        loyalty: container.resolve('loyaltyModule'),
        rfm: container.resolve('rfmAnalyticsModule')
    };
    next();
}

/**
 * Health check всех модулей
 */
function healthCheckModules() {
    const services = container.getRegisteredServices();
    const health = {};

    services.forEach(serviceName => {
        try {
            const service = container.resolve(serviceName);
            health[serviceName] = {
                status: 'healthy',
                type: service.constructor.name
            };
        } catch (error) {
            health[serviceName] = {
                status: 'unhealthy',
                error: error.message
            };
        }
    });

    const overallStatus = Object.values(health).every(service => 
        service.status === 'healthy'
    ) ? 'healthy' : 'unhealthy';

    return {
        status: overallStatus,
        services: health,
        timestamp: new Date().toISOString()
    };
}

module.exports = {
    bootstrapModules,
    bootstrapTestModules,
    injectModules,
    healthCheckModules,
    container
};
