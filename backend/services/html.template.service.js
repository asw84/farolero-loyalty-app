// backend/services/html.template.service.js

/**
 * Сервис для управления HTML шаблонами ответов VK OAuth
 * Позволяет легко изменять внешний вид и поведение страниц
 */

class HTMLTemplateService {
    constructor() {
        this.config = this.loadConfig();
    }

    /**
     * Загружает конфигурацию из переменных окружения
     */
    loadConfig() {
        return {
            // Основные настройки
            autoCloseDelay: parseInt(process.env.VK_OAUTH_AUTO_CLOSE_DELAY) || 3000,
            errorAutoCloseDelay: parseInt(process.env.VK_OAUTH_ERROR_AUTO_CLOSE_DELAY) || 5000,
            
            // Цвета и стили
            successBackground: process.env.VK_OAUTH_SUCCESS_BG || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            errorBackground: process.env.VK_OAUTH_ERROR_BG || 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            successButtonColor: process.env.VK_OAUTH_SUCCESS_BTN_COLOR || '#4CAF50',
            errorButtonColor: process.env.VK_OAUTH_ERROR_BTN_COLOR || '#ff6b6b',
            
            // Тексты
            successTitle: process.env.VK_OAUTH_SUCCESS_TITLE || '✅ Авторизация VK завершена!',
            successMessage: process.env.VK_OAUTH_SUCCESS_MSG || 'Аккаунт VK успешно привязан к вашему Telegram аккаунту.',
            successSubMessage: process.env.VK_OAUTH_SUCCESS_SUB_MSG || 'Теперь вы можете закрыть эту вкладку и вернуться в Telegram.',
            closeButtonText: process.env.VK_OAUTH_CLOSE_BTN_TEXT || 'Закрыть вкладку',
            
            errorTitle: process.env.VK_OAUTH_ERROR_TITLE || '❌ Ошибка авторизации VK',
            errorMessage: process.env.VK_OAUTH_ERROR_MSG || 'Произошла ошибка при привязке аккаунта VK.',
            errorSubMessage: process.env.VK_OAUTH_ERROR_SUB_MSG || 'Попробуйте еще раз или обратитесь в поддержку.',
            
            // Дополнительные настройки
            enableAutoClose: process.env.VK_OAUTH_ENABLE_AUTO_CLOSE !== 'false',
            showCloseButton: process.env.VK_OAUTH_SHOW_CLOSE_BTN !== 'false',
            customCSS: process.env.VK_OAUTH_CUSTOM_CSS || '',
            customJS: process.env.VK_OAUTH_CUSTOM_JS || ''
        };
    }

    /**
     * Генерирует CSS стили на основе конфигурации
     */
    generateCSS() {
        return `
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container { 
            background: rgba(255,255,255,0.1); 
            padding: 30px; 
            border-radius: 15px; 
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 100%;
        }
        .success { color: #4CAF50; font-weight: bold; }
        .error { color: #ff6b6b; font-weight: bold; }
        .close-btn { 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 25px; 
            cursor: pointer; 
            font-size: 16px;
            margin-top: 20px;
            transition: all 0.3s ease;
        }
        .close-btn:hover { 
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .auto-close-info {
            font-size: 12px;
            opacity: 0.7;
            margin-top: 15px;
        }
        ${this.config.customCSS}
        `;
    }

    /**
     * Генерирует JavaScript код на основе конфигурации
     */
    generateJS() {
        let js = '';
        
        if (this.config.enableAutoClose) {
            js += `
            // Автоматическое закрытие вкладки
            let countdown = ${this.config.autoCloseDelay / 1000};
            const countdownElement = document.getElementById('countdown');
            
            if (countdownElement) {
                const timer = setInterval(() => {
                    countdown--;
                    countdownElement.textContent = countdown;
                    if (countdown <= 0) {
                        clearInterval(timer);
                        window.close();
                    }
                }, 1000);
            } else {
                setTimeout(() => {
                    window.close();
                }, ${this.config.autoCloseDelay});
            }
            `;
        }

        js += this.config.customJS;
        return js;
    }

    /**
     * Генерирует HTML страницу успешной авторизации
     */
    generateSuccessPage() {
        const autoCloseInfo = this.config.enableAutoClose 
            ? `<p class="auto-close-info">Вкладка автоматически закроется через <span id="countdown">${this.config.autoCloseDelay / 1000}</span> секунд</p>`
            : '';

        const closeButton = this.config.showCloseButton 
            ? `<button class="close-btn" onclick="window.close()" style="background: ${this.config.successButtonColor};">${this.config.closeButtonText}</button>`
            : '';

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>VK Авторизация завершена</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        ${this.generateCSS()}
        body { background: ${this.config.successBackground}; color: white; }
        .close-btn:hover { background: ${this.config.successButtonColor}dd !important; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${this.config.successTitle}</h1>
        <p class="success">${this.config.successMessage}</p>
        <p>${this.config.successSubMessage}</p>
        ${closeButton}
        ${autoCloseInfo}
    </div>
    <script>
        ${this.generateJS()}
    </script>
</body>
</html>`;
    }

    /**
     * Генерирует HTML страницу ошибки
     */
    generateErrorPage(errorDetails = '') {
        const autoCloseInfo = this.config.enableAutoClose 
            ? `<p class="auto-close-info">Вкладка автоматически закроется через <span id="countdown">${this.config.errorAutoCloseDelay / 1000}</span> секунд</p>`
            : '';

        const closeButton = this.config.showCloseButton 
            ? `<button class="close-btn" onclick="window.close()" style="background: ${this.config.errorButtonColor};">${this.config.closeButtonText}</button>`
            : '';

        const errorDetailsHtml = errorDetails 
            ? `<div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 15px 0; font-family: monospace; font-size: 12px;">
                <strong>Детали ошибки:</strong><br>${errorDetails}
               </div>`
            : '';

        return `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Ошибка авторизации VK</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        ${this.generateCSS()}
        body { background: ${this.config.errorBackground}; color: white; }
        .close-btn:hover { background: ${this.config.errorButtonColor}dd !important; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${this.config.errorTitle}</h1>
        <p class="error">${this.config.errorMessage}</p>
        <p>${this.config.errorSubMessage}</p>
        ${errorDetailsHtml}
        ${closeButton}
        ${autoCloseInfo}
    </div>
    <script>
        ${this.generateJS()}
    </script>
</body>
</html>`;
    }

    /**
     * Обновляет конфигурацию на лету
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('[HTML_TEMPLATE_SERVICE] Конфигурация обновлена:', this.config);
    }

    /**
     * Возвращает текущую конфигурацию
     */
    getConfig() {
        return { ...this.config };
    }
}

module.exports = new HTMLTemplateService();
