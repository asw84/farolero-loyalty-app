// scripts/security-check.js
// Проверка безопасности перед публикацией в GitHub

const fs = require('fs');
const path = require('path');

console.log('🔒 === ПРОВЕРКА БЕЗОПАСНОСТИ ПЕРЕД ПУБЛИКАЦИЕЙ ===');
console.log('📅', new Date().toLocaleString());
console.log('');

let securityIssues = 0;
let warnings = 0;

function logError(message) {
    console.log('❌', message);
    securityIssues++;
}

function logWarning(message) {
    console.log('⚠️ ', message);
    warnings++;
}

function logSuccess(message) {
    console.log('✅', message);
}

function logInfo(message) {
    console.log('ℹ️ ', message);
}

// 1. ПРОВЕРКА .gitignore
console.log('🔍 === ПРОВЕРКА .gitignore ===');

if (fs.existsSync('.gitignore')) {
    const gitignoreContent = fs.readFileSync('.gitignore', 'utf-8');
    
    const criticalPatterns = [
        '.env',
        '*.db',
        'tokens.json',
        'node_modules',
        '*secret*',
        '*key*.json'
    ];

    for (const pattern of criticalPatterns) {
        if (gitignoreContent.includes(pattern)) {
            logSuccess(`${pattern} исключен из Git`);
        } else {
            logError(`КРИТИЧНО: ${pattern} НЕ исключен из Git`);
        }
    }
} else {
    logError('КРИТИЧНО: .gitignore файл отсутствует');
}

// 2. ПРОВЕРКА НАЛИЧИЯ СЕКРЕТНЫХ ФАЙЛОВ
console.log('');
console.log('🔐 === ПРОВЕРКА СЕКРЕТНЫХ ФАЙЛОВ ===');

const sensitiveFiles = [
    'backend/.env',
    'backend/tokens.json',
    'backend/farolero_loyalty.db'
];

for (const file of sensitiveFiles) {
    if (fs.existsSync(file)) {
        logError(`КРИТИЧНО: Секретный файл ${file} найден - НЕ должен попасть в Git`);
    } else {
        logSuccess(`${file} не найден (это хорошо для Git)`);
    }
}

// 3. ПРОВЕРКА .env.example
console.log('');
console.log('📋 === ПРОВЕРКА .env.example ===');

if (fs.existsSync('backend/.env.example')) {
    const envExampleContent = fs.readFileSync('backend/.env.example', 'utf-8');
    
    // Проверяем что нет реальных ключей
    const suspiciousPatterns = [
        /sk-[a-zA-Z0-9]{48}/,  // OpenAI API keys
        /[0-9]{10}:[a-zA-Z0-9_-]{35}/,  // Telegram bot tokens
        /def50200[a-f0-9]{200,}/,  // AmoCRM refresh tokens
        /AKIA[0-9A-Z]{16}/,  // AWS access keys
    ];

    let foundSuspicious = false;
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(envExampleContent)) {
            logError('КРИТИЧНО: Найден подозрительный API ключ в .env.example');
            foundSuspicious = true;
        }
    }

    if (!foundSuspicious) {
        logSuccess('.env.example выглядит безопасно');
    }

    // Проверяем наличие placeholder значений
    const requiredPlaceholders = [
        'your_',
        'YOUR_',
        'your-domain',
        'here'
    ];

    let hasPlaceholders = false;
    for (const placeholder of requiredPlaceholders) {
        if (envExampleContent.includes(placeholder)) {
            hasPlaceholders = true;
            break;
        }
    }

    if (hasPlaceholders) {
        logSuccess('Placeholder значения найдены в .env.example');
    } else {
        logWarning('.env.example может содержать реальные значения');
    }

} else {
    logError('КРИТИЧНО: backend/.env.example не найден');
}

// 4. ПРОВЕРКА ЖЕСТКО ПРОПИСАННЫХ СЕКРЕТОВ В КОДЕ
console.log('');
console.log('🔍 === СКАНИРОВАНИЕ КОДА НА СЕКРЕТЫ ===');

function scanFileForSecrets(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        const secretPatterns = [
            { name: 'API Key', pattern: /api[_-]?key\s*[:=]\s*['"'][^'"]{10,}['"']/i },
            { name: 'Secret Key', pattern: /secret[_-]?key\s*[:=]\s*['"'][^'"]{10,}['"']/i },
            { name: 'Password', pattern: /password\s*[:=]\s*['"'][^'"]{5,}['"']/i },
            { name: 'Token', pattern: /token\s*[:=]\s*['"'][^'"]{20,}['"']/i },
            { name: 'Database URL', pattern: /database[_-]?url\s*[:=]\s*['"'].*:\/\/.*['"']/i },
        ];

        for (const { name, pattern } of secretPatterns) {
            if (pattern.test(content)) {
                logWarning(`Возможный ${name} найден в ${filePath}`);
            }
        }
    } catch (error) {
        // Игнорируем ошибки чтения файлов
    }
}

// Сканируем JavaScript файлы
function scanDirectory(dir, extensions = ['.js', '.ts', '.json']) {
    try {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
                scanDirectory(filePath, extensions);
            } else if (extensions.some(ext => file.endsWith(ext))) {
                scanFileForSecrets(filePath);
            }
        }
    } catch (error) {
        // Игнорируем недоступные директории
    }
}

scanDirectory('backend');
scanDirectory('frontend');

// 5. ПРОВЕРКА PACKAGE.JSON НА УЯЗВИМОСТИ
console.log('');
console.log('📦 === ПРОВЕРКА ЗАВИСИМОСТЕЙ ===');

const packageJsonPaths = [
    'backend/package.json',
    'frontend/package.json'
];

for (const packagePath of packageJsonPaths) {
    if (fs.existsSync(packagePath)) {
        try {
            const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
            
            // Проверяем наличие скриптов
            if (packageJson.scripts) {
                logSuccess(`${packagePath}: package.json валиден`);
            }

            // Проверяем основные зависимости безопасности
            const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            const securityPackages = ['helmet', 'cors', 'express-rate-limit'];
            let hasSecurityPackages = false;
            
            for (const pkg of securityPackages) {
                if (dependencies[pkg]) {
                    hasSecurityPackages = true;
                    break;
                }
            }

            if (hasSecurityPackages) {
                logSuccess(`${packagePath}: Найдены security пакеты`);
            } else {
                logWarning(`${packagePath}: Рекомендуется добавить security пакеты`);
            }

        } catch (error) {
            logError(`${packagePath}: Невалидный JSON`);
        }
    }
}

// 6. ПРОВЕРКА DOCKER КОНФИГУРАЦИИ
console.log('');
console.log('🐳 === ПРОВЕРКА DOCKER БЕЗОПАСНОСТИ ===');

if (fs.existsSync('docker-compose.yml')) {
    const dockerContent = fs.readFileSync('docker-compose.yml', 'utf-8');
    
    // Проверяем что нет хардкод паролей
    if (!dockerContent.includes('password:') || dockerContent.includes('${')) {
        logSuccess('Docker конфигурация выглядит безопасно');
    } else {
        logWarning('Docker конфигурация может содержать хардкод пароли');
    }

    // Проверяем volumes
    if (dockerContent.includes('volumes:')) {
        logSuccess('Docker volumes настроены для персистентности');
    }

    // Проверяем health checks
    if (dockerContent.includes('healthcheck:')) {
        logSuccess('Docker health checks настроены');
    } else {
        logWarning('Docker health checks не настроены');
    }

} else {
    logWarning('docker-compose.yml не найден');
}

// 7. ФИНАЛЬНАЯ ПРОВЕРКА README
console.log('');
console.log('📖 === ПРОВЕРКА ДОКУМЕНТАЦИИ ===');

if (fs.existsSync('README.md')) {
    const readmeContent = fs.readFileSync('README.md', 'utf-8');
    
    if (readmeContent.includes('## 🔒') || readmeContent.includes('Безопасность')) {
        logSuccess('README содержит информацию о безопасности');
    } else {
        logWarning('README не содержит раздел о безопасности');
    }

    if (readmeContent.includes('.env.example')) {
        logSuccess('README упоминает .env.example');
    } else {
        logWarning('README не упоминает настройку .env.example');
    }
} else {
    logError('README.md отсутствует');
}

// 8. ИТОГОВЫЙ ОТЧЕТ
console.log('');
console.log('🔒 === ИТОГОВЫЙ ОТЧЕТ БЕЗОПАСНОСТИ ===');
console.log('════════════════════════════════════════════════════════');

console.log(`🔍 Проверки безопасности:`);
console.log(`   ❌ Критические проблемы: ${securityIssues}`);
console.log(`   ⚠️  Предупреждения: ${warnings}`);

if (securityIssues === 0 && warnings === 0) {
    console.log('');
    console.log('🎉 ОТЛИЧНО! Проект готов к публикации в GitHub');
    console.log('✅ Никаких проблем безопасности не найдено');
} else if (securityIssues === 0) {
    console.log('');
    console.log('⚠️  УСЛОВНО ГОТОВ к публикации');
    console.log('❗ Есть предупреждения, но критических проблем нет');
    console.log('💡 Рекомендуется устранить предупреждения');
} else {
    console.log('');
    console.log('🚨 НЕ ГОТОВ к публикации!');
    console.log('❌ Найдены КРИТИЧЕСКИЕ проблемы безопасности');
    console.log('🛑 ОБЯЗАТЕЛЬНО устраните их перед публикацией');
}

console.log('════════════════════════════════════════════════════════');

// 9. РЕКОМЕНДАЦИИ
console.log('');
console.log('💡 === РЕКОМЕНДАЦИИ ПЕРЕД ПУБЛИКАЦИЕЙ ===');

console.log('');
console.log('📋 Обязательные действия:');
console.log('1. Убедитесь что backend/.env НЕ в Git');
console.log('2. Проверьте что backend/.env.example содержит только placeholders');
console.log('3. Убедитесь что .gitignore настроен правильно');
console.log('4. Удалите все реальные токены и ключи из кода');

console.log('');
console.log('🔒 Рекомендуемые улучшения:');
console.log('1. Добавьте rate limiting в production');
console.log('2. Настройте HTTPS для всех API endpoints');
console.log('3. Добавьте input validation');
console.log('4. Настройте логирование безопасности');

console.log('');
console.log('🚀 Готовые команды для Git:');
console.log('git add .');
console.log('git commit -m "feat: production-ready loyalty app"');
console.log('git push origin main');

// Возвращаем код выхода
process.exit(securityIssues > 0 ? 1 : 0);
