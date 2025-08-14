// backend/controllers/auth.controller.js
// Веб-интерфейс для автоматической авторизации AmoCRM

const amocrmClient = require('../amocrm/apiClient');
const fs = require('fs');
const path = require('path');

/**
 * Отображает страницу с инструкциями по авторизации AmoCRM
 * GET /auth/setup
 */
const showSetupPage = async (req, res) => {
    const config = require('../amocrm/amocrm.json');
    const currentDomain = req.get('host');
    const protocol = req.secure ? 'https' : 'http';
    const currentRedirectUri = `${protocol}://${currentDomain}/api/amocrm/callback`;
    
    const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Настройка AmoCRM - Farolero</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh; padding: 20px;
            }
            .container { 
                max-width: 800px; margin: 0 auto; 
                background: white; border-radius: 15px; 
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                overflow: hidden;
            }
            .header { 
                background: linear-gradient(135deg, #2d5aa0 0%, #1e3a8a 100%);
                color: white; padding: 30px; text-align: center;
            }
            .content { padding: 30px; }
            .step { 
                background: #f8f9fa; padding: 20px; margin: 20px 0; 
                border-radius: 10px; border-left: 4px solid #667eea;
            }
            .step h3 { color: #333; margin-bottom: 15px; }
            .code-block { 
                background: #1a1a1a; color: #00ff00; padding: 15px; 
                border-radius: 8px; font-family: 'Courier New', monospace;
                margin: 10px 0; overflow-x: auto;
            }
            .highlight { background: #fff3cd; padding: 2px 6px; border-radius: 4px; }
            .button { 
                display: inline-block; background: #667eea; color: white; 
                padding: 12px 25px; text-decoration: none; border-radius: 8px;
                font-weight: 600; transition: all 0.3s ease;
                border: none; cursor: pointer; margin: 10px 5px;
            }
            .button:hover { background: #5a6fd8; transform: translateY(-2px); }
            .button.success { background: #28a745; }
            .button.danger { background: #dc3545; }
            .status { 
                padding: 15px; border-radius: 8px; margin: 20px 0;
                border: 1px solid #ddd;
            }
            .status.success { background: #d4edda; border-color: #c3e6cb; color: #155724; }
            .status.error { background: #f8d7da; border-color: #f5c6cb; color: #721c24; }
            .status.warning { background: #fff3cd; border-color: #ffeaa7; color: #856404; }
            .copy-btn { 
                background: #6c757d; color: white; border: none; 
                padding: 5px 10px; border-radius: 4px; cursor: pointer;
                font-size: 12px; margin-left: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔧 Настройка AmoCRM</h1>
                <p>Автоматическая система авторизации</p>
            </div>
            
            <div class="content">
                <div id="status-check">
                    <h2>📊 Проверка статуса</h2>
                    <button onclick="checkTokenStatus()" class="button">Проверить токены</button>
                    <div id="token-status"></div>
                </div>

                <div class="step">
                    <h3>📋 Шаг 1: Настройка в AmoCRM</h3>
                    <p>Перейдите в AmoCRM → Настройки → Интеграции → Ваша интеграция</p>
                    <p>В поле <strong>"Ссылка для перенаправления"</strong> укажите:</p>
                    <div class="code-block">
                        ${currentRedirectUri}
                        <button class="copy-btn" onclick="copyToClipboard('${currentRedirectUri}')">Копировать</button>
                    </div>
                </div>

                <div class="step">
                    <h3>🔑 Шаг 2: Генерация кода авторизации</h3>
                    <p>В AmoCRM нажмите <strong>"Сгенерировать секретный ключ"</strong></p>
                    <p>Полученный код вставьте в поле ниже:</p>
                    <textarea id="auth-code" placeholder="Вставьте код авторизации здесь..." 
                              style="width: 100%; height: 100px; margin: 10px 0; padding: 10px; border-radius: 5px; border: 1px solid #ddd;"></textarea>
                    <button onclick="saveAuthCode()" class="button">Сохранить код</button>
                </div>

                <div class="step">
                    <h3>🚀 Шаг 3: Автоматическая авторизация</h3>
                    <p>После сохранения кода нажмите кнопку для автоматического получения токенов:</p>
                    <button onclick="startAuthorization()" class="button success" id="auth-btn" disabled>
                        Получить токены автоматически
                    </button>
                    <div id="auth-result"></div>
                </div>

                <div class="step">
                    <h3>💾 Шаг 4: Backup токенов</h3>
                    <p>Сохраните токены для восстановления:</p>
                    <button onclick="downloadTokens()" class="button">Скачать tokens.json</button>
                    <button onclick="showTokens()" class="button">Показать токены</button>
                    <div id="tokens-display"></div>
                </div>

                <div class="step">
                    <h3>🔄 Восстановление токенов</h3>
                    <p>Если у вас есть backup файл tokens.json:</p>
                    <input type="file" id="tokens-file" accept=".json" style="margin: 10px 0;">
                    <button onclick="uploadTokens()" class="button">Восстановить из файла</button>
                </div>
            </div>
        </div>

        <script>
            async function checkTokenStatus() {
                const statusDiv = document.getElementById('token-status');
                statusDiv.innerHTML = '<div class="status warning">Проверяем...</div>';
                
                try {
                    const response = await fetch('/api/amocrm/test');
                    const data = await response.json();
                    
                    if (data.success) {
                        statusDiv.innerHTML = '<div class="status success">✅ Токены работают! AmoCRM подключен.</div>';
                    } else {
                        statusDiv.innerHTML = '<div class="status error">❌ Токены не работают: ' + data.error + '</div>';
                    }
                } catch (error) {
                    statusDiv.innerHTML = '<div class="status error">❌ Ошибка проверки: ' + error.message + '</div>';
                }
            }

            async function saveAuthCode() {
                const code = document.getElementById('auth-code').value.trim();
                if (!code) {
                    alert('Введите код авторизации!');
                    return;
                }

                try {
                    const response = await fetch('/auth/save-code', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ authCode: code })
                    });

                    const data = await response.json();
                    if (data.success) {
                        alert('✅ Код сохранен!');
                        document.getElementById('auth-btn').disabled = false;
                    } else {
                        alert('❌ Ошибка: ' + data.error);
                    }
                } catch (error) {
                    alert('❌ Ошибка сохранения: ' + error.message);
                }
            }

            async function startAuthorization() {
                const resultDiv = document.getElementById('auth-result');
                resultDiv.innerHTML = '<div class="status warning">🔄 Получаем токены...</div>';
                
                try {
                    const response = await fetch('/auth/get-tokens', { method: 'POST' });
                    const data = await response.json();
                    
                    if (data.success) {
                        resultDiv.innerHTML = '<div class="status success">✅ Токены успешно получены и сохранены!</div>';
                        setTimeout(checkTokenStatus, 1000);
                    } else {
                        resultDiv.innerHTML = '<div class="status error">❌ Ошибка: ' + data.error + '</div>';
                    }
                } catch (error) {
                    resultDiv.innerHTML = '<div class="status error">❌ Ошибка: ' + error.message + '</div>';
                }
            }

            async function downloadTokens() {
                try {
                    const response = await fetch('/auth/download-tokens');
                    if (response.ok) {
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'tokens.json';
                        a.click();
                        window.URL.revokeObjectURL(url);
                    } else {
                        alert('❌ Ошибка загрузки токенов');
                    }
                } catch (error) {
                    alert('❌ Ошибка: ' + error.message);
                }
            }

            async function showTokens() {
                const tokensDiv = document.getElementById('tokens-display');
                try {
                    const response = await fetch('/auth/show-tokens');
                    const data = await response.json();
                    
                    if (data.success) {
                        tokensDiv.innerHTML = '<div class="code-block">' + 
                            JSON.stringify(data.tokens, null, 2) + '</div>';
                    } else {
                        tokensDiv.innerHTML = '<div class="status error">❌ ' + data.error + '</div>';
                    }
                } catch (error) {
                    tokensDiv.innerHTML = '<div class="status error">❌ ' + error.message + '</div>';
                }
            }

            async function uploadTokens() {
                const fileInput = document.getElementById('tokens-file');
                const file = fileInput.files[0];
                
                if (!file) {
                    alert('Выберите файл tokens.json!');
                    return;
                }

                const formData = new FormData();
                formData.append('tokens', file);

                try {
                    const response = await fetch('/auth/upload-tokens', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();
                    if (data.success) {
                        alert('✅ Токены успешно восстановлены!');
                        setTimeout(checkTokenStatus, 1000);
                    } else {
                        alert('❌ Ошибка: ' + data.error);
                    }
                } catch (error) {
                    alert('❌ Ошибка: ' + error.message);
                }
            }

            function copyToClipboard(text) {
                navigator.clipboard.writeText(text).then(function() {
                    alert('✅ Скопировано в буфер обмена!');
                });
            }

            // Автоматическая проверка при загрузке
            window.onload = function() {
                checkTokenStatus();
            }
        </script>
    </body>
    </html>`;

    res.send(html);
};

/**
 * Сохраняет код авторизации в конфиг
 * POST /auth/save-code
 */
const saveAuthCode = async (req, res) => {
    try {
        const { authCode } = req.body;
        
        if (!authCode) {
            return res.status(400).json({
                success: false,
                error: 'Код авторизации обязателен'
            });
        }

        // Читаем текущий конфиг
        const configPath = path.join(__dirname, '../amocrm/amocrm.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        
        // Обновляем код авторизации
        config.auth_code = authCode;
        
        // Сохраняем конфиг
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        console.log('[AUTH_CONTROLLER] ✅ Код авторизации сохранен');
        
        res.json({
            success: true,
            message: 'Код авторизации сохранен'
        });

    } catch (error) {
        console.error('[AUTH_CONTROLLER] ❌ Ошибка сохранения кода:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка сохранения кода авторизации'
        });
    }
};

/**
 * Автоматически получает токены используя сохраненный код
 * POST /auth/get-tokens
 */
const getTokens = async (req, res) => {
    try {
        console.log('[AUTH_CONTROLLER] 🔄 Запуск автоматического получения токенов...');
        
        // Пытаемся получить токены через AmoCRM API
        const tokens = await amocrmClient.getInitialToken();
        
        if (tokens) {
            console.log('[AUTH_CONTROLLER] ✅ Токены успешно получены автоматически');
            res.json({
                success: true,
                message: 'Токены успешно получены и сохранены'
            });
        } else {
            throw new Error('Не удалось получить токены');
        }

    } catch (error) {
        console.error('[AUTH_CONTROLLER] ❌ Ошибка получения токенов:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Ошибка получения токенов'
        });
    }
};

/**
 * Скачивает файл tokens.json
 * GET /auth/download-tokens
 */
const downloadTokens = async (req, res) => {
    try {
        const tokensPath = path.join(__dirname, '../tokens.json');
        
        if (!fs.existsSync(tokensPath)) {
            return res.status(404).json({
                success: false,
                error: 'Файл tokens.json не найден'
            });
        }

        res.download(tokensPath, 'tokens.json', (err) => {
            if (err) {
                console.error('[AUTH_CONTROLLER] ❌ Ошибка скачивания:', err);
                res.status(500).json({
                    success: false,
                    error: 'Ошибка скачивания файла'
                });
            }
        });

    } catch (error) {
        console.error('[AUTH_CONTROLLER] ❌ Ошибка download:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка загрузки файла'
        });
    }
};

/**
 * Показывает содержимое tokens.json
 * GET /auth/show-tokens
 */
const showTokens = async (req, res) => {
    try {
        const tokensPath = path.join(__dirname, '../tokens.json');
        
        if (!fs.existsSync(tokensPath)) {
            return res.json({
                success: false,
                error: 'Файл tokens.json не найден'
            });
        }

        const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
        
        // Скрываем часть токенов для безопасности
        const maskedTokens = {
            ...tokens,
            access_token: tokens.access_token ? tokens.access_token.substring(0, 50) + '...' : null,
            refresh_token: tokens.refresh_token ? tokens.refresh_token.substring(0, 50) + '...' : null
        };

        res.json({
            success: true,
            tokens: maskedTokens
        });

    } catch (error) {
        console.error('[AUTH_CONTROLLER] ❌ Ошибка показа токенов:', error);
        res.json({
            success: false,
            error: 'Ошибка чтения токенов'
        });
    }
};

/**
 * Загружает tokens.json из файла
 * POST /auth/upload-tokens
 */
const uploadTokens = async (req, res) => {
    try {
        if (!req.files || !req.files.tokens) {
            return res.status(400).json({
                success: false,
                error: 'Файл не предоставлен'
            });
        }

        const tokensFile = req.files.tokens;
        const tokensContent = tokensFile.data.toString('utf-8');
        
        // Валидируем JSON
        let tokens;
        try {
            tokens = JSON.parse(tokensContent);
        } catch (parseError) {
            return res.status(400).json({
                success: false,
                error: 'Неверный формат JSON файла'
            });
        }

        // Проверяем наличие обязательных полей
        if (!tokens.access_token || !tokens.refresh_token) {
            return res.status(400).json({
                success: false,
                error: 'В файле отсутствуют обязательные токены'
            });
        }

        // Сохраняем файл
        const tokensPath = path.join(__dirname, '../tokens.json');
        fs.writeFileSync(tokensPath, JSON.stringify(tokens, null, 2));
        
        console.log('[AUTH_CONTROLLER] ✅ Токены восстановлены из файла');
        
        res.json({
            success: true,
            message: 'Токены успешно восстановлены'
        });

    } catch (error) {
        console.error('[AUTH_CONTROLLER] ❌ Ошибка загрузки токенов:', error);
        res.status(500).json({
            success: false,
            error: 'Ошибка загрузки токенов'
        });
    }
};

module.exports = {
    showSetupPage,
    saveAuthCode,
    getTokens,
    downloadTokens,
    showTokens,
    uploadTokens
};
