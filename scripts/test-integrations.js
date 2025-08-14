#!/usr/bin/env node
// scripts/test-integrations.js
// Тестирование интеграций с внешними сервисами

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Загружаем переменные окружения
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

class IntegrationTester {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green
            warning: '\x1b[33m', // Yellow
            error: '\x1b[31m',   // Red
            reset: '\x1b[0m'     // Reset
        };

        const icons = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };

        console.log(`${colors[type]}${icons[type]} [${timestamp}] ${message}${colors.reset}`);
    }

    async runTest(testName, testFunction, isWarningOnFail = false) {
        this.log(`Запуск теста: ${testName}`, 'info');
        
        try {
            const result = await testFunction();
            
            if (result.success) {
                this.log(`${testName} - УСПЕШНО`, 'success');
                this.results.passed++;
            } else {
                if (isWarningOnFail) {
                    this.log(`${testName} - ПРЕДУПРЕЖДЕНИЕ: ${result.message}`, 'warning');
                    this.results.warnings++;
                } else {
                    this.log(`${testName} - ОШИБКА: ${result.message}`, 'error');
                    this.results.failed++;
                }
            }

            this.results.tests.push({
                name: testName,
                success: result.success,
                message: result.message,
                details: result.details || null,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            const message = `Исключение: ${error.message}`;
            
            if (isWarningOnFail) {
                this.log(`${testName} - ПРЕДУПРЕЖДЕНИЕ: ${message}`, 'warning');
                this.results.warnings++;
            } else {
                this.log(`${testName} - ОШИБКА: ${message}`, 'error');
                this.results.failed++;
            }

            this.results.tests.push({
                name: testName,
                success: false,
                message: message,
                error: error.stack,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Тест AmoCRM API
    async testAmoCRM() {
        return new Promise(async (resolve) => {
            try {
                const domain = process.env.AMOCRM_DOMAIN;
                if (!domain) {
                    return resolve({
                        success: false,
                        message: 'AMOCRM_DOMAIN не настроен'
                    });
                }

                const response = await axios.get(`https://${domain}/api/v4/`, {
                    timeout: 10000,
                    validateStatus: () => true // Принимаем любой статус
                });

                if ([200, 401, 403].includes(response.status)) {
                    resolve({
                        success: true,
                        message: `AmoCRM API доступен (статус: ${response.status})`,
                        details: { domain, status: response.status }
                    });
                } else {
                    resolve({
                        success: false,
                        message: `AmoCRM API вернул неожиданный статус: ${response.status}`
                    });
                }
            } catch (error) {
                if (error.code === 'ENOTFOUND') {
                    resolve({
                        success: false,
                        message: 'AmoCRM домен недоступен'
                    });
                } else if (error.code === 'ECONNREFUSED') {
                    resolve({
                        success: false,
                        message: 'AmoCRM отказал в соединении'
                    });
                } else {
                    resolve({
                        success: false,
                        message: `Ошибка подключения к AmoCRM: ${error.message}`
                    });
                }
            }
        });
    }

    // Тест VK API
    async testVKAPI() {
        return new Promise(async (resolve) => {
            try {
                const response = await axios.get('https://api.vk.com/method/wall.get', {
                    params: {
                        v: '5.199',
                        access_token: 'invalid_token',
                        owner_id: 1,
                        count: 1
                    },
                    timeout: 10000
                });

                if (response.data && response.data.error && response.data.error.error_code === 5) {
                    resolve({
                        success: true,
                        message: 'VK API доступен (ожидаемая ошибка авторизации)',
                        details: { api_version: '5.199' }
                    });
                } else {
                    resolve({
                        success: false,
                        message: 'VK API вернул неожиданный ответ'
                    });
                }
            } catch (error) {
                resolve({
                    success: false,
                    message: `Ошибка подключения к VK API: ${error.message}`
                });
            }
        });
    }

    // Тест Instagram API
    async testInstagramAPI() {
        return new Promise(async (resolve) => {
            try {
                const response = await axios.get('https://graph.instagram.com/me', {
                    params: {
                        fields: 'id,username',
                        access_token: 'invalid_token'
                    },
                    timeout: 10000,
                    validateStatus: () => true
                });

                if ([400, 401, 403].includes(response.status)) {
                    resolve({
                        success: true,
                        message: `Instagram API доступен (ожидаемая ошибка авторизации: ${response.status})`,
                        details: { status: response.status }
                    });
                } else {
                    resolve({
                        success: false,
                        message: `Instagram API вернул неожиданный статус: ${response.status}`
                    });
                }
            } catch (error) {
                resolve({
                    success: false,
                    message: `Ошибка подключения к Instagram API: ${error.message}`
                });
            }
        });
    }

    // Тест Telegram API
    async testTelegramAPI() {
        return new Promise(async (resolve) => {
            try {
                const botToken = process.env.TELEGRAM_BOT_TOKEN;
                
                if (!botToken || botToken.includes('YOUR_')) {
                    return resolve({
                        success: false,
                        message: 'TELEGRAM_BOT_TOKEN не настроен'
                    });
                }

                const response = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`, {
                    timeout: 10000
                });

                if (response.data.ok) {
                    resolve({
                        success: true,
                        message: `Telegram Bot API работает (бот: @${response.data.result.username})`,
                        details: {
                            bot_id: response.data.result.id,
                            username: response.data.result.username
                        }
                    });
                } else {
                    resolve({
                        success: false,
                        message: 'Telegram Bot API вернул ошибку'
                    });
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    resolve({
                        success: false,
                        message: 'Неверный TELEGRAM_BOT_TOKEN'
                    });
                } else {
                    resolve({
                        success: false,
                        message: `Ошибка Telegram API: ${error.message}`
                    });
                }
            }
        });
    }

    // Тест локального backend API
    async testLocalBackend() {
        return new Promise(async (resolve) => {
            try {
                const response = await axios.get('http://localhost:3001/health', {
                    timeout: 5000
                });

                if (response.status === 200) {
                    resolve({
                        success: true,
                        message: 'Backend API доступен',
                        details: response.data
                    });
                } else {
                    resolve({
                        success: false,
                        message: `Backend вернул статус: ${response.status}`
                    });
                }
            } catch (error) {
                if (error.code === 'ECONNREFUSED') {
                    resolve({
                        success: false,
                        message: 'Backend не запущен (ECONNREFUSED)'
                    });
                } else {
                    resolve({
                        success: false,
                        message: `Ошибка подключения к backend: ${error.message}`
                    });
                }
            }
        });
    }

    // Тест конфигурации переменных окружения
    async testEnvironmentConfig() {
        return new Promise((resolve) => {
            const requiredVars = [
                'AMOCRM_DOMAIN',
                'AMOCRM_CLIENT_ID', 
                'AMOCRM_CLIENT_SECRET',
                'VK_CLIENT_ID',
                'JWT_SECRET'
            ];

            const missing = [];
            const empty = [];

            for (const varName of requiredVars) {
                const value = process.env[varName];
                if (!value) {
                    missing.push(varName);
                } else if (value.trim() === '' || value.includes('YOUR_') || value.includes('REQUIRED')) {
                    empty.push(varName);
                }
            }

            if (missing.length > 0 || empty.length > 0) {
                let message = '';
                if (missing.length > 0) {
                    message += `Отсутствуют: ${missing.join(', ')}`;
                }
                if (empty.length > 0) {
                    if (message) message += '; ';
                    message += `Не настроены: ${empty.join(', ')}`;
                }

                resolve({
                    success: false,
                    message: `Проблемы с переменными окружения: ${message}`,
                    details: { missing, empty }
                });
            } else {
                resolve({
                    success: true,
                    message: 'Все обязательные переменные окружения настроены',
                    details: { configured: requiredVars }
                });
            }
        });
    }

    // Тест файловой системы
    async testFileSystem() {
        return new Promise((resolve) => {
            const requiredFiles = [
                'backend/server.js',
                'backend/package.json',
                'backend/.env',
                'backend/amocrm/amocrm.json',
                'backend/database.js'
            ];

            const missing = [];

            for (const filePath of requiredFiles) {
                if (!fs.existsSync(filePath)) {
                    missing.push(filePath);
                }
            }

            if (missing.length > 0) {
                resolve({
                    success: false,
                    message: `Отсутствуют файлы: ${missing.join(', ')}`,
                    details: { missing }
                });
            } else {
                resolve({
                    success: true,
                    message: 'Все необходимые файлы присутствуют',
                    details: { checked: requiredFiles }
                });
            }
        });
    }

    // Запуск всех тестов
    async runAllTests() {
        this.log('🧪 === ЗАПУСК ИНТЕГРАЦИОННЫХ ТЕСТОВ ===', 'info');
        this.log(`📅 Время: ${new Date().toISOString()}`, 'info');
        
        console.log('');
        this.log('🔍 === ТЕСТИРОВАНИЕ БАЗОВОЙ КОНФИГУРАЦИИ ===', 'info');
        await this.runTest('Проверка файловой системы', () => this.testFileSystem());
        await this.runTest('Проверка переменных окружения', () => this.testEnvironmentConfig());

        console.log('');
        this.log('🌐 === ТЕСТИРОВАНИЕ ВНЕШНИХ API ===', 'info');
        await this.runTest('AmoCRM API', () => this.testAmoCRM());
        await this.runTest('VK API', () => this.testVKAPI());
        await this.runTest('Instagram API', () => this.testInstagramAPI(), true); // Warning only
        await this.runTest('Telegram Bot API', () => this.testTelegramAPI(), true); // Warning only

        console.log('');
        this.log('🏠 === ТЕСТИРОВАНИЕ ЛОКАЛЬНОГО API ===', 'info');
        await this.runTest('Backend Health Check', () => this.testLocalBackend(), true); // Warning only

        console.log('');
        this.generateReport();
    }

    generateReport() {
        const total = this.results.passed + this.results.failed + this.results.warnings;
        const successRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;

        this.log('📊 === ОТЧЕТ ПО ИНТЕГРАЦИОННЫМ ТЕСТАМ ===', 'info');
        console.log('════════════════════════════════════════════════════════');
        console.log(`📈 СТАТИСТИКА:`);
        console.log(`   ✅ Успешных: ${this.results.passed}`);
        console.log(`   ❌ Ошибок: ${this.results.failed}`);
        console.log(`   ⚠️  Предупреждений: ${this.results.warnings}`);
        console.log(`   📊 Процент успеха: ${successRate}%`);
        console.log('════════════════════════════════════════════════════════');

        // Сохраняем детальный отчет
        const reportPath = path.join(__dirname, '../test-results.json');
        fs.writeFileSync(reportPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            summary: {
                total,
                passed: this.results.passed,
                failed: this.results.failed,
                warnings: this.results.warnings,
                successRate
            },
            tests: this.results.tests
        }, null, 2));

        this.log(`📝 Детальный отчет сохранен: ${reportPath}`, 'info');

        // Определяем статус завершения
        if (this.results.failed === 0) {
            if (this.results.warnings === 0) {
                this.log('🎉 ВСЕ ИНТЕГРАЦИОННЫЕ ТЕСТЫ ПРОШЛИ УСПЕШНО!', 'success');
            } else {
                this.log(`⚠️  ЕСТЬ ${this.results.warnings} ПРЕДУПРЕЖДЕНИЙ`, 'warning');
            }
            process.exit(0);
        } else {
            this.log(`❌ НАЙДЕНО ${this.results.failed} КРИТИЧЕСКИХ ОШИБОК`, 'error');
            process.exit(1);
        }
    }
}

// Запуск тестов
if (require.main === module) {
    const tester = new IntegrationTester();
    tester.runAllTests().catch(error => {
        console.error('❌ Критическая ошибка при запуске тестов:', error);
        process.exit(1);
    });
}

module.exports = IntegrationTester;
