// test-quick.js - Быстрое тестирование для Windows
const fs = require('fs');
const path = require('path');

console.log('🧪 === БЫСТРОЕ ТЕСТИРОВАНИЕ FAROLERO LOYALTY APP ===');
console.log('📅', new Date().toLocaleString());
console.log('');

let passed = 0;
let failed = 0;
let warnings = 0;

function logSuccess(message) {
    console.log('✅', message);
    passed++;
}

function logError(message) {
    console.log('❌', message);
    failed++;
}

function logWarning(message) {
    console.log('⚠️ ', message);
    warnings++;
}

function logInfo(message) {
    console.log('ℹ️ ', message);
}

// Проверка структуры проекта
console.log('🔍 === ПРОВЕРКА СТРУКТУРЫ ПРОЕКТА ===');

const requiredFiles = [
    'docker-compose.yml',
    'backend/server.js',
    'backend/package.json',
    'backend/.env',
    'backend/amocrm/amocrm.json',
    'backend/database.js'
];

for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
        logSuccess(`Файл ${file} найден`);
    } else {
        logError(`Файл ${file} отсутствует`);
    }
}

// Проверка директорий
const requiredDirs = ['backend', 'frontend', 'scripts'];

for (const dir of requiredDirs) {
    if (fs.existsSync(dir)) {
        logSuccess(`Директория ${dir} найдена`);
    } else {
        logError(`Директория ${dir} отсутствует`);
    }
}

console.log('');
console.log('⚙️  === ПРОВЕРКА КОНФИГУРАЦИИ ===');

// Проверка .env файла
if (fs.existsSync('backend/.env')) {
    const envContent = fs.readFileSync('backend/.env', 'utf-8');
    
    const requiredVars = [
        'AMOCRM_DOMAIN',
        'AMOCRM_CLIENT_ID', 
        'AMOCRM_CLIENT_SECRET',
        'VK_CLIENT_ID',
        'JWT_SECRET'
    ];

    for (const varName of requiredVars) {
        const regex = new RegExp(`^${varName}=.+`, 'm');
        if (regex.test(envContent)) {
            const emptyRegex = new RegExp(`^${varName}=$`, 'm');
            if (emptyRegex.test(envContent)) {
                logWarning(`${varName} настроена, но пуста`);
            } else {
                logSuccess(`${varName} настроена`);
            }
        } else {
            logError(`${varName} не найдена в .env`);
        }
    }

    // Опциональные переменные
    const optionalVars = ['TELEGRAM_BOT_TOKEN', 'VK_CLIENT_SECRET', 'INSTAGRAM_APP_ID'];
    
    for (const varName of optionalVars) {
        const regex = new RegExp(`^${varName}=.+`, 'm');
        if (regex.test(envContent) && !envContent.includes('YOUR_') && !envContent.includes('REQUIRED')) {
            logSuccess(`${varName} настроена (опционально)`);
        } else {
            logWarning(`${varName} не настроена (опционально)`);
        }
    }
} else {
    logError('Файл backend/.env не найден');
}

console.log('');
console.log('📦 === ПРОВЕРКА PACKAGE.JSON ===');

// Проверка backend package.json
if (fs.existsSync('backend/package.json')) {
    try {
        const packageJson = JSON.parse(fs.readFileSync('backend/package.json', 'utf-8'));
        
        if (packageJson.dependencies) {
            logSuccess('Dependencies найдены');
            
            const criticalDeps = ['express', 'sqlite3', 'axios', 'cors'];
            for (const dep of criticalDeps) {
                if (packageJson.dependencies[dep]) {
                    logSuccess(`${dep} установлен`);
                } else {
                    logError(`${dep} отсутствует в dependencies`);
                }
            }
        } else {
            logError('Dependencies не найдены в package.json');
        }

        if (packageJson.scripts && packageJson.scripts.start) {
            logSuccess('Start script настроен');
        } else {
            logError('Start script не найден');
        }
    } catch (error) {
        logError('Ошибка парсинга backend/package.json: ' + error.message);
    }
} else {
    logError('backend/package.json не найден');
}

console.log('');
console.log('🐳 === ПРОВЕРКА DOCKER КОНФИГУРАЦИИ ===');

// Проверка docker-compose.yml
if (fs.existsSync('docker-compose.yml')) {
    try {
        const dockerComposeContent = fs.readFileSync('docker-compose.yml', 'utf-8');
        
        if (dockerComposeContent.includes('backend:')) {
            logSuccess('Backend сервис найден в docker-compose.yml');
        } else {
            logError('Backend сервис не найден в docker-compose.yml');
        }

        if (dockerComposeContent.includes('frontend:')) {
            logSuccess('Frontend сервис найден в docker-compose.yml');
        } else {
            logError('Frontend сервис не найден в docker-compose.yml');
        }

        if (dockerComposeContent.includes('healthcheck:')) {
            logSuccess('Health checks настроены');
        } else {
            logWarning('Health checks не настроены');
        }

        if (dockerComposeContent.includes('volumes:')) {
            logSuccess('Volumes настроены');
        } else {
            logWarning('Volumes не настроены');
        }
    } catch (error) {
        logError('Ошибка чтения docker-compose.yml: ' + error.message);
    }
} else {
    logError('docker-compose.yml не найден');
}

// Проверка Dockerfile
if (fs.existsSync('backend/Dockerfile')) {
    logSuccess('Backend Dockerfile найден');
} else {
    logError('Backend Dockerfile отсутствует');
}

if (fs.existsSync('frontend/Dockerfile')) {
    logSuccess('Frontend Dockerfile найден');
} else {
    logWarning('Frontend Dockerfile отсутствует');
}

console.log('');
console.log('🧪 === ПРОВЕРКА ТЕСТОВ ===');

// Проверка тестовых файлов
const testFiles = [
    'backend/tests/api.test.js',
    'backend/tests/integrations.test.js',
    'scripts/test-integrations.js',
    'scripts/test-complete.sh',
    'scripts/pre-deploy-check.sh'
];

for (const testFile of testFiles) {
    if (fs.existsSync(testFile)) {
        logSuccess(`Тестовый файл ${testFile} найден`);
    } else {
        logWarning(`Тестовый файл ${testFile} отсутствует`);
    }
}

console.log('');
console.log('📊 === ФИНАЛЬНЫЙ ОТЧЕТ ===');
console.log('════════════════════════════════════════════════════════');
console.log(`📈 СТАТИСТИКА:`);
console.log(`   ✅ Успешных проверок: ${passed}`);
console.log(`   ❌ Ошибок: ${failed}`);
console.log(`   ⚠️  Предупреждений: ${warnings}`);

const total = passed + failed + warnings;
const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
console.log(`   📊 Процент успеха: ${successRate}%`);
console.log('════════════════════════════════════════════════════════');

console.log('');
console.log('💡 РЕКОМЕНДАЦИИ:');

if (failed === 0 && warnings === 0) {
    console.log('🎉 ОТЛИЧНО! Проект готов к тестированию и деплою!');
    console.log('📋 Следующие шаги:');
    console.log('   1. Запустите Docker: docker-compose up -d --build');
    console.log('   2. Проверьте health: curl http://localhost:3001/health');
    console.log('   3. Протестируйте API endpoints');
} else if (failed === 0) {
    console.log('⚠️  Проект условно готов. Есть предупреждения.');
    console.log('🔧 Рекомендуется устранить предупреждения для лучшей стабильности.');
} else {
    console.log('❌ Проект НЕ готов к деплою!');
    console.log('🛠️  Необходимо устранить критические ошибки:');
    console.log('   - Проверьте отсутствующие файлы');
    console.log('   - Настройте переменные окружения');
    console.log('   - Убедитесь в корректности конфигурации');
}

console.log('');
console.log('🔗 ПОЛЕЗНЫЕ КОМАНДЫ:');
console.log('   docker-compose up -d --build    # Запуск с пересборкой');
console.log('   docker-compose logs backend     # Логи backend');
console.log('   docker-compose ps               # Статус контейнеров');
console.log('   node backend/server.js          # Локальный запуск backend');

// Код выхода
process.exit(failed > 0 ? 1 : 0);
