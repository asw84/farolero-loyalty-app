// backend/routes/vk-callback.routes.js
// Обработчик VK ID SDK callback

const express = require('express');
const router = express.Router();

/**
 * VK ID SDK callback endpoint
 * GET /api/oauth/vk/callback
 */
router.get('/vk/callback', (req, res) => {
    try {
        const { code, device_id, state, expires_in } = req.query;
        
        console.log('[VK_CALLBACK] 📥 Получен callback от VK ID SDK:', {
            code: code ? code.substring(0, 20) + '...' : 'отсутствует',
            device_id: device_id ? device_id.substring(0, 20) + '...' : 'отсутствует',
            state: state ? state.substring(0, 20) + '...' : 'отсутствует',
            expires_in
        });

        if (!code) {
            console.error('[VK_CALLBACK] ❌ Отсутствует код авторизации');
            return res.status(400).send(`
                <html><body>
                    <h2>❌ Ошибка VK авторизации</h2>
                    <p>Отсутствует код авторизации от VK</p>
                    <script>
                        setTimeout(() => window.close(), 3000);
                    </script>
                </body></html>
            `);
        }

        // Возвращаем HTML страницу которая передаст данные обратно в родительское окно
        const successPage = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>VK Авторизация</title>
                <meta charset="utf-8">
                <style>
                    body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 50px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                    }
                    .container { 
                        max-width: 400px; 
                        margin: 0 auto; 
                        background: rgba(255,255,255,0.1);
                        padding: 30px;
                        border-radius: 10px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h2>✅ Авторизация VK завершена!</h2>
                    <p>Данные получены, обрабатываем...</p>
                    <p><small>Окно закроется автоматически</small></p>
                </div>
                
                <script>
                    console.log('VK Callback received:', {
                        code: '${code}',
                        device_id: '${device_id}',
                        state: '${state}',
                        expires_in: '${expires_in}'
                    });
                    
                    // Отправляем данные в родительское окно (VK ID SDK)
                    if (window.opener) {
                        window.opener.postMessage({
                            type: 'vk_auth_success',
                            code: '${code}',
                            device_id: '${device_id}',
                            state: '${state}',
                            expires_in: '${expires_in}'
                        }, '*');
                    }
                    
                    // Закрываем окно через 2 секунды
                    setTimeout(() => {
                        window.close();
                    }, 2000);
                </script>
            </body>
            </html>
        `;

        res.send(successPage);
        
    } catch (error) {
        console.error('[VK_CALLBACK] ❌ Ошибка обработки callback:', error);
        res.status(500).send(`
            <html><body>
                <h2>❌ Ошибка сервера</h2>
                <p>Произошла ошибка при обработке авторизации VK</p>
                <script>
                    setTimeout(() => window.close(), 3000);
                </script>
            </body></html>
        `);
    }
});

module.exports = router;
