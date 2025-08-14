// backend/utils/qr-generator.js
// Генерация QR-кодов для реферальной системы

const QRCode = require('qrcode');

/**
 * Генерирует QR-код для реферальной ссылки
 * @param {string} referralUrl - URL реферальной ссылки
 * @param {Object} options - Опции для генерации QR-кода
 * @returns {Promise<string>} - Base64 строка с QR-кодом
 */
async function generateReferralQR(referralUrl, options = {}) {
    try {
        const qrOptions = {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 300,
            ...options
        };

        const qrCodeDataURL = await QRCode.toDataURL(referralUrl, qrOptions);
        console.log(`[QR] ✅ QR-код сгенерирован для URL: ${referralUrl}`);
        
        return qrCodeDataURL;
    } catch (error) {
        console.error('[QR] ❌ Ошибка генерации QR-кода:', error);
        throw new Error('Не удалось сгенерировать QR-код');
    }
}

/**
 * Генерирует SVG QR-код для реферальной ссылки
 * @param {string} referralUrl - URL реферальной ссылки  
 * @param {Object} options - Опции для генерации QR-кода
 * @returns {Promise<string>} - SVG строка с QR-кодом
 */
async function generateReferralQRSvg(referralUrl, options = {}) {
    try {
        const qrOptions = {
            errorCorrectionLevel: 'M',
            type: 'svg',
            quality: 0.92,
            margin: 1,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 300,
            ...options
        };

        const qrCodeSvg = await QRCode.toString(referralUrl, qrOptions);
        console.log(`[QR] ✅ SVG QR-код сгенерирован для URL: ${referralUrl}`);
        
        return qrCodeSvg;
    } catch (error) {
        console.error('[QR] ❌ Ошибка генерации SVG QR-кода:', error);
        throw new Error('Не удалось сгенерировать SVG QR-код');
    }
}

/**
 * Генерирует стилизованный QR-код с логотипом (опционально)
 * @param {string} referralUrl - URL реферальной ссылки
 * @param {Object} options - Опции стилизации
 * @returns {Promise<string>} - Base64 строка с стилизованным QR-кодом
 */
async function generateStyledReferralQR(referralUrl, options = {}) {
    try {
        const qrOptions = {
            errorCorrectionLevel: 'H', // Высокий уровень коррекции для логотипа
            type: 'image/png',
            quality: 0.92,
            margin: 2,
            color: {
                dark: options.darkColor || '#2D5AA0', // Farolero brand color
                light: options.lightColor || '#FFFFFF'
            },
            width: options.width || 400,
        };

        const qrCodeDataURL = await QRCode.toDataURL(referralUrl, qrOptions);
        
        // TODO: В будущем можно добавить логотип в центр QR-кода
        // Для этого нужно будет использовать Canvas или библиотеку для манипуляции изображений
        
        console.log(`[QR] ✅ Стилизованный QR-код сгенерирован для URL: ${referralUrl}`);
        
        return qrCodeDataURL;
    } catch (error) {
        console.error('[QR] ❌ Ошибка генерации стилизованного QR-кода:', error);
        throw new Error('Не удалось сгенерировать стилизованный QR-код');
    }
}

/**
 * Валидация URL перед генерацией QR-кода
 * @param {string} url - URL для валидации
 * @returns {boolean} - true если URL валидный
 */
function validateUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

module.exports = {
    generateReferralQR,
    generateReferralQRSvg,
    generateStyledReferralQR,
    validateUrl
};
