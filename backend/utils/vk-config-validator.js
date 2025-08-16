// backend/utils/vk-config-validator.js
// Валидатор VK конфигурации с проверкой фиктивных ключей

class VKConfigValidator {
    constructor() {
        this.config = {
            CLIENT_ID: process.env.VK_CLIENT_ID,
            CLIENT_SECRET: process.env.VK_CLIENT_SECRET,
            REDIRECT_URI: process.env.VK_REDIRECT_URI,
            SERVICE_KEY: process.env.VK_SERVICE_KEY,
            GROUP_ID: process.env.VK_GROUP_ID,
            GROUP_TOKEN: process.env.VK_GROUP_TOKEN,
            JWT_SECRET: process.env.JWT_SECRET
        };
        
        this.placeholders = [
            'ВАШ_ЗАЩИЩЁННЫЙ_КЛЮЧ_ИЗ_VK',
            'ПОЛУЧИТЕ_ЗАЩИЩЁННЫЙ_КЛЮЧ_ИЗ_VK_DEVELOPERS',
            'ВАШ_СЕРВИСНЫЙ_КЛЮЧ_ДЛЯ_VK_ID_API',
            'ПОЛУЧИТЕ_СЕРВИСНЫЙ_КЛЮЧ_ИЗ_VK_DEVELOPERS',
            'ID_СООБЩЕСТВА_БЕЗ_-',
            'ГРУППОВОЙ_ТОКЕН_С_ПРАВАМИ',
            'YOUR_VK_CLIENT_ID',
            'your_secret_key_here',
            'super_secret_for_state_use_strong_random_string'
        ];
    }

    /**
     * Проверка является ли значение плейсхолдером
     */
    isPlaceholder(value) {
        if (!value) return false;
        
        return this.placeholders.some(placeholder => 
            value.includes(placeholder) || 
            value === placeholder
        );
    }

    /**
     * Проверка критически важных ключей
     */
    validateCritical() {
        const errors = [];
        
        // VK_CLIENT_SECRET - критично
        if (!this.config.CLIENT_SECRET || this.isPlaceholder(this.config.CLIENT_SECRET)) {
            errors.push({
                key: 'VK_CLIENT_SECRET',
                message: 'Отсутствует или содержит placeholder',
                severity: 'critical',
                solution: 'Получите защищённый ключ из https://dev.vk.com/'
            });
        }
        
        // VK_CLIENT_ID - должен быть числом
        if (!this.config.CLIENT_ID || isNaN(this.config.CLIENT_ID)) {
            errors.push({
                key: 'VK_CLIENT_ID',
                message: 'Отсутствует или не является числом',
                severity: 'critical',
                solution: 'Укажите ID приложения из VK Developers'
            });
        }
        
        // VK_REDIRECT_URI - должен быть HTTPS
        if (!this.config.REDIRECT_URI || !this.config.REDIRECT_URI.startsWith('https://')) {
            errors.push({
                key: 'VK_REDIRECT_URI',
                message: 'Отсутствует или не HTTPS',
                severity: 'critical',
                solution: 'Укажите корректный HTTPS redirect URI'
            });
        }
        
        // JWT_SECRET - должен быть достаточно длинным
        if (!this.config.JWT_SECRET || this.config.JWT_SECRET.length < 32) {
            errors.push({
                key: 'JWT_SECRET',
                message: 'Отсутствует или слишком короткий (< 32 символов)',
                severity: 'critical',
                solution: 'Сгенерируйте: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
            });
        }
        
        return errors;
    }

    /**
     * Проверка опциональных ключей
     */
    validateOptional() {
        const warnings = [];
        
        // VK_SERVICE_KEY
        if (!this.config.SERVICE_KEY || this.isPlaceholder(this.config.SERVICE_KEY)) {
            warnings.push({
                key: 'VK_SERVICE_KEY',
                message: 'Не настроен (опционально для VK ID API)',
                severity: 'warning',
                impact: 'Ограниченные возможности VK ID API'
            });
        }
        
        // VK_GROUP_ID
        if (!this.config.GROUP_ID || isNaN(this.config.GROUP_ID)) {
            warnings.push({
                key: 'VK_GROUP_ID',
                message: 'Не настроен (опционально для отслеживания активности)',
                severity: 'warning',
                impact: 'Нет отслеживания активности в группе VK'
            });
        }
        
        // VK_GROUP_TOKEN
        if (!this.config.GROUP_TOKEN || this.isPlaceholder(this.config.GROUP_TOKEN)) {
            warnings.push({
                key: 'VK_GROUP_TOKEN',
                message: 'Не настроен (опционально для отслеживания активности)',
                severity: 'warning',
                impact: 'Нет доступа к API группы VK'
            });
        }
        
        return warnings;
    }

    /**
     * Полная валидация конфигурации
     */
    validate() {
        const errors = this.validateCritical();
        const warnings = this.validateOptional();
        
        const hasPlaceholders = Object.entries(this.config).some(([key, value]) => 
            value && this.isPlaceholder(value)
        );
        
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            hasPlaceholders,
            config: this.config,
            readiness: this.calculateReadiness(errors, warnings)
        };
    }

    /**
     * Расчет процента готовности
     */
    calculateReadiness(errors, warnings) {
        const totalChecks = 7; // Всего критичных проверок
        const failedChecks = errors.length;
        const warningChecks = warnings.length;
        
        const criticalScore = ((totalChecks - failedChecks) / totalChecks) * 80; // 80% за критичные
        const optionalScore = ((3 - warningChecks) / 3) * 20; // 20% за опциональные
        
        return Math.round(criticalScore + optionalScore);
    }

    /**
     * Генерация отчета для консоли
     */
    generateReport() {
        const result = this.validate();
        
        console.log('🔵 === VK КОНФИГУРАЦИЯ ===');
        console.log('');
        
        if (result.valid) {
            console.log('✅ Конфигурация валидна');
            console.log(`🎯 Готовность: ${result.readiness}%`);
        } else {
            console.log('❌ КРИТИЧЕСКИЕ ОШИБКИ:');
            result.errors.forEach(error => {
                console.log(`❌ ${error.key}: ${error.message}`);
                console.log(`   Решение: ${error.solution}`);
            });
        }
        
        if (result.warnings.length > 0) {
            console.log('');
            console.log('⚠️  ПРЕДУПРЕЖДЕНИЯ:');
            result.warnings.forEach(warning => {
                console.log(`⚠️  ${warning.key}: ${warning.message}`);
                console.log(`   Влияние: ${warning.impact}`);
            });
        }
        
        if (result.hasPlaceholders) {
            console.log('');
            console.log('🔧 ОБНАРУЖЕНЫ ПЛЕЙСХОЛДЕРЫ:');
            console.log('Запустите: node backend/scripts/setup-vk-keys.js');
        }
        
        console.log('');
        console.log(`🎯 Общая готовность VK: ${result.readiness}%`);
        
        return result;
    }

    /**
     * Проверка в runtime при загрузке сервера
     */
    validateAtStartup() {
        const result = this.validate();
        
        if (!result.valid) {
            console.error('🔵 VK CONFIGURATION ERROR:');
            result.errors.forEach(error => {
                console.error(`❌ ${error.key}: ${error.message}`);
            });
            
            if (result.hasPlaceholders) {
                console.error('');
                console.error('🔧 Запустите настройку: node backend/scripts/setup-vk-keys.js');
            }
            
            // В development режиме не падаем, только предупреждаем
            if (process.env.NODE_ENV === 'production') {
                throw new Error('VK configuration is invalid for production');
            } else {
                console.warn('⚠️  VK интеграция не будет работать до настройки ключей');
            }
        }
        
        return result;
    }

    /**
     * Middleware для Express для проверки VK endpoints
     */
    requireValidConfig(req, res, next) {
        const result = this.validate();
        
        if (!result.valid) {
            return res.status(503).json({
                error: 'VK integration not configured',
                message: 'VK_CLIENT_SECRET and other keys need to be set up',
                setup_guide: '/docs/VK_SETUP_AUTOMATED.md',
                readiness: result.readiness
            });
        }
        
        next();
    }
}

module.exports = VKConfigValidator;
