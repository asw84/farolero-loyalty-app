const crypto = require('crypto');

/**
 * Generates a random string for the code verifier.
 * @param {number} length The length of the string to generate.
 * @returns {string} The generated code verifier.
 */
function generateCodeVerifier(length = 128) {
    // Генерируем достаточно байт для получения нужной длины после base64url кодирования
    const bytes = crypto.randomBytes(Math.ceil(length * 3 / 4));
    return bytes
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
        .slice(0, length);
}

/**
 * Creates a code challenge from a code verifier.
 * @param {string} verifier The code verifier.
 * @returns {string} The generated code challenge.
 */
function generateCodeChallenge(verifier) {
    return crypto.createHash('sha256')
        .update(verifier)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

module.exports = {
    generateCodeVerifier,
    generateCodeChallenge,
};
