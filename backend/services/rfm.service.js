// backend/services/rfm.service.js
// RFM-анализ пользователей (Recency, Frequency, Monetary)

const { dbRun, dbGet, dbAll } = require('../database');

// RFM сегменты и их описания
const RFM_SEGMENTS = {
  'Champions': {
    description: 'Лучшие клиенты',
    rfm_range: { R: [4, 5], F: [4, 5], M: [4, 5] },
    strategy: 'Награждайте их. Могут стать ранними последователями новых продуктов.',
    color: '#1e7b85'
  },
  'Loyal Customers': {
    description: 'Лояльные покупатели',
    rfm_range: { R: [3, 5], F: [3, 5], M: [3, 5] },
    strategy: 'Увеличивайте продажи. Предлагайте членство или программы лояльности.',
    color: '#2d5aa0'
  },
  'Potential Loyalists': {
    description: 'Потенциально лояльные',
    rfm_range: { R: [3, 5], F: [1, 3], M: [1, 3] },
    strategy: 'Предлагайте программы членства. Рекомендуйте продукты.',
    color: '#5a67d8'
  },
  'New Customers': {
    description: 'Новые клиенты',
    rfm_range: { R: [4, 5], F: [1, 1], M: [1, 1] },
    strategy: 'Обеспечьте поддержку для создания отношений и увеличения покупок.',
    color: '#48bb78'
  },
  'Promising': {
    description: 'Перспективные',
    rfm_range: { R: [3, 4], F: [1, 1], M: [1, 1] },
    strategy: 'Создавайте узнаваемость бренда. Предлагайте бесплатные пробные версии.',
    color: '#38b2ac'
  },
  'Need Attention': {
    description: 'Требуют внимания',
    rfm_range: { R: [2, 3], F: [2, 3], M: [2, 3] },
    strategy: 'Делайте ограниченные по времени предложения. Рекомендуйте продукты.',
    color: '#ed8936'
  },
  'About to Sleep': {
    description: 'Засыпающие',
    rfm_range: { R: [2, 3], F: [1, 2], M: [1, 2] },
    strategy: 'Делитесь ценным контентом. Рекомендуйте популярные продукты.',
    color: '#ecc94b'
  },
  'At Risk': {
    description: 'Под угрозой оттока',
    rfm_range: { R: [1, 2], F: [2, 5], M: [2, 5] },
    strategy: 'Отправляйте персонализированные сообщения. Предлагайте скидки.',
    color: '#f56565'
  },
  'Cannot Lose Them': {
    description: 'Нельзя потерять',
    rfm_range: { R: [1, 2], F: [4, 5], M: [4, 5] },
    strategy: 'Выигрывайте их обратно с помощью релевантных продуктов и скидок.',
    color: '#e53e3e'
  },
  'Hibernating': {
    description: 'Спящие',
    rfm_range: { R: [1, 2], F: [1, 2], M: [1, 2] },
    strategy: 'Реактивируйте с сильно дисконтированными предложениями.',
    color: '#a0aec0'
  }
};

/**
 * Вычисляет RFM скоры для всех пользователей
 * @returns {Promise<void>}
 */
async function calculateRFMForAllUsers() {
  try {
    console.log('[RFM] 🔄 Начинаем расчет RFM для всех пользователей...');

    // Получаем всех пользователей с покупками
    const users = await dbAll(`
      SELECT DISTINCT u.telegram_user_id
      FROM users u
      INNER JOIN purchases p ON u.telegram_user_id = p.user_telegram_id
    `);

    let processedCount = 0;
    
    for (const user of users) {
      await calculateUserRFM(user.telegram_user_id);
      processedCount++;
    }

    console.log(`[RFM] ✅ RFM расчитан для ${processedCount} пользователей`);
    
  } catch (error) {
    console.error('[RFM] ❌ Ошибка расчета RFM:', error);
    throw error;
  }
}

/**
 * Вычисляет RFM скоры для конкретного пользователя
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<Object>} - RFM данные пользователя
 */
async function calculateUserRFM(telegramId) {
  try {
    // Получаем данные покупок пользователя
    const purchases = await dbAll(`
      SELECT amount, purchase_date
      FROM purchases 
      WHERE user_telegram_id = ?
      ORDER BY purchase_date DESC
    `, [telegramId]);

    if (purchases.length === 0) {
      return null; // Нет покупок
    }

    // Рассчитываем Recency (дни с последней покупки)
    const lastPurchaseDate = new Date(purchases[0].purchase_date);
    const today = new Date();
    const daysSinceLastPurchase = Math.floor((today - lastPurchaseDate) / (1000 * 60 * 60 * 24));

    // Рассчитываем Frequency (количество покупок)
    const frequency = purchases.length;

    // Рассчитываем Monetary (общая сумма покупок)
    const monetary = purchases.reduce((sum, purchase) => sum + parseFloat(purchase.amount), 0);

    // Получаем квантили для скоринга
    const quantiles = await getQuantiles();

    // Конвертируем в скоры от 1 до 5
    const recencyScore = getRecencyScore(daysSinceLastPurchase, quantiles.recency);
    const frequencyScore = getScore(frequency, quantiles.frequency);
    const monetaryScore = getScore(monetary, quantiles.monetary);

    // Определяем сегмент
    const segmentName = determineSegment(recencyScore, frequencyScore, monetaryScore);

    // Сохраняем в базу данных
    await dbRun(`
      INSERT OR REPLACE INTO rfm_segments 
      (user_telegram_id, recency_score, frequency_score, monetary_score, segment_name, calculated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [telegramId, recencyScore, frequencyScore, monetaryScore, segmentName]);

    const result = {
      telegramId,
      recencyScore,
      frequencyScore,
      monetaryScore,
      segmentName,
      metrics: {
        daysSinceLastPurchase,
        frequency,
        monetary: Math.round(monetary)
      }
    };

    console.log(`[RFM] ✅ Пользователь ${telegramId}: R${recencyScore}F${frequencyScore}M${monetaryScore} = ${segmentName}`);
    
    return result;

  } catch (error) {
    console.error(`[RFM] ❌ Ошибка расчета RFM для ${telegramId}:`, error);
    throw error;
  }
}

/**
 * Получает квантили для всех пользователей (для нормализации скоров)
 * @returns {Promise<Object>} - Квантили для recency, frequency, monetary
 */
async function getQuantiles() {
  try {
    // Получаем все метрики для расчета квантилей
    const metrics = await dbAll(`
      SELECT 
        user_telegram_id,
        COUNT(*) as frequency,
        SUM(amount) as monetary,
        MIN(julianday('now') - julianday(purchase_date)) as recency_days
      FROM purchases
      GROUP BY user_telegram_id
      HAVING COUNT(*) > 0
    `);

    if (metrics.length === 0) {
      // Дефолтные значения если нет данных
      return {
        recency: [1, 7, 30, 90, 365],
        frequency: [1, 2, 3, 5, 10],
        monetary: [100, 500, 1000, 2500, 5000]
      };
    }

    // Сортируем и вычисляем квантили
    const recencyValues = metrics.map(m => m.recency_days).sort((a, b) => a - b);
    const frequencyValues = metrics.map(m => m.frequency).sort((a, b) => a - b);
    const monetaryValues = metrics.map(m => m.monetary).sort((a, b) => a - b);

    return {
      recency: getQuantileValues(recencyValues),
      frequency: getQuantileValues(frequencyValues),
      monetary: getQuantileValues(monetaryValues)
    };

  } catch (error) {
    console.error('[RFM] ❌ Ошибка получения квантилей:', error);
    throw error;
  }
}

/**
 * Вычисляет квантили для массива значений
 * @param {number[]} values - Отсортированный массив значений
 * @returns {number[]} - Квантили [20%, 40%, 60%, 80%]
 */
function getQuantileValues(values) {
  const len = values.length;
  if (len === 0) return [0, 0, 0, 0, 0];
  
  const q1 = values[Math.floor(len * 0.2)];
  const q2 = values[Math.floor(len * 0.4)];
  const q3 = values[Math.floor(len * 0.6)];
  const q4 = values[Math.floor(len * 0.8)];
  const q5 = values[len - 1];
  
  return [q1, q2, q3, q4, q5];
}

/**
 * Конвертирует recency в скор (обратная логика - меньше дней = больше скор)
 * @param {number} days - Дни с последней покупки
 * @param {number[]} quantiles - Квантили recency
 * @returns {number} - Скор от 1 до 5
 */
function getRecencyScore(days, quantiles) {
  if (days <= quantiles[0]) return 5;
  if (days <= quantiles[1]) return 4;
  if (days <= quantiles[2]) return 3;
  if (days <= quantiles[3]) return 2;
  return 1;
}

/**
 * Конвертирует значение в скор от 1 до 5
 * @param {number} value - Значение для скоринга
 * @param {number[]} quantiles - Квантили
 * @returns {number} - Скор от 1 до 5
 */
function getScore(value, quantiles) {
  if (value >= quantiles[4]) return 5;
  if (value >= quantiles[3]) return 4;
  if (value >= quantiles[2]) return 3;
  if (value >= quantiles[1]) return 2;
  return 1;
}

/**
 * Определяет сегмент пользователя на основе RFM скоров
 * @param {number} R - Recency score
 * @param {number} F - Frequency score
 * @param {number} M - Monetary score
 * @returns {string} - Название сегмента
 */
function determineSegment(R, F, M) {
  // Champions: R>=4, F>=4, M>=4
  if (R >= 4 && F >= 4 && M >= 4) return 'Champions';
  
  // Loyal Customers: R>=3, F>=3, M>=3
  if (R >= 3 && F >= 3 && M >= 3) return 'Loyal Customers';
  
  // Potential Loyalists: R>=3, F<=3, M<=3
  if (R >= 3 && F <= 3 && M <= 3) return 'Potential Loyalists';
  
  // New Customers: R>=4, F=1, M=1
  if (R >= 4 && F === 1 && M === 1) return 'New Customers';
  
  // Promising: R>=3, F=1, M=1
  if (R >= 3 && F === 1 && M === 1) return 'Promising';
  
  // Need Attention: R=2-3, F=2-3, M=2-3
  if (R >= 2 && R <= 3 && F >= 2 && F <= 3 && M >= 2 && M <= 3) return 'Need Attention';
  
  // About to Sleep: R=2-3, F<=2, M<=2
  if (R >= 2 && R <= 3 && F <= 2 && M <= 2) return 'About to Sleep';
  
  // At Risk: R<=2, F>=2, M>=2
  if (R <= 2 && F >= 2 && M >= 2) return 'At Risk';
  
  // Cannot Lose Them: R<=2, F>=4, M>=4
  if (R <= 2 && F >= 4 && M >= 4) return 'Cannot Lose Them';
  
  // Hibernating: все остальные с низкими показателями
  return 'Hibernating';
}

/**
 * Получает RFM данные пользователя
 * @param {string} telegramId - Telegram ID пользователя
 * @returns {Promise<Object>} - RFM данные
 */
async function getUserRFM(telegramId) {
  try {
    const rfmData = await dbGet(`
      SELECT * FROM rfm_segments 
      WHERE user_telegram_id = ?
    `, [telegramId]);

    if (!rfmData) {
      // Если данных нет, пытаемся рассчитать
      return await calculateUserRFM(telegramId);
    }

    // Добавляем информацию о сегменте
    rfmData.segmentInfo = RFM_SEGMENTS[rfmData.segment_name];
    
    return rfmData;

  } catch (error) {
    console.error(`[RFM] ❌ Ошибка получения RFM для ${telegramId}:`, error);
    throw error;
  }
}

/**
 * Получает сводку по всем сегментам
 * @returns {Promise<Object>} - Статистика по сегментам
 */
async function getSegmentsSummary() {
  try {
    const segments = await dbAll(`
      SELECT 
        segment_name,
        COUNT(*) as user_count,
        AVG(recency_score) as avg_recency,
        AVG(frequency_score) as avg_frequency,
        AVG(monetary_score) as avg_monetary
      FROM rfm_segments
      GROUP BY segment_name
      ORDER BY user_count DESC
    `);

    // Добавляем информацию о сегментах
    const segmentsWithInfo = segments.map(segment => ({
      ...segment,
      info: RFM_SEGMENTS[segment.segment_name] || {}
    }));

    const totalUsers = segments.reduce((sum, s) => sum + s.user_count, 0);

    return {
      totalUsers,
      segments: segmentsWithInfo,
      segmentDefinitions: RFM_SEGMENTS
    };

  } catch (error) {
    console.error('[RFM] ❌ Ошибка получения сводки сегментов:', error);
    throw error;
  }
}

/**
 * Получает пользователей конкретного сегмента
 * @param {string} segmentName - Название сегмента
 * @param {number} limit - Лимит пользователей
 * @returns {Promise<Array>} - Список пользователей сегмента
 */
async function getSegmentUsers(segmentName, limit = 50) {
  try {
    const users = await dbAll(`
      SELECT 
        rfm.*,
        u.telegram_user_id,
        COUNT(p.id) as total_purchases,
        SUM(p.amount) as total_spent,
        MAX(p.purchase_date) as last_purchase_date
      FROM rfm_segments rfm
      JOIN users u ON rfm.user_telegram_id = u.telegram_user_id
      LEFT JOIN purchases p ON u.telegram_user_id = p.user_telegram_id
      WHERE rfm.segment_name = ?
      GROUP BY rfm.user_telegram_id
      ORDER BY rfm.calculated_at DESC
      LIMIT ?
    `, [segmentName, limit]);

    return users;

  } catch (error) {
    console.error(`[RFM] ❌ Ошибка получения пользователей сегмента ${segmentName}:`, error);
    throw error;
  }
}

module.exports = {
  calculateRFMForAllUsers,
  calculateUserRFM,
  getUserRFM,
  getSegmentsSummary,
  getSegmentUsers,
  RFM_SEGMENTS
};
