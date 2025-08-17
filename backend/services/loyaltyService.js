// Сервис для начисления баллов лояльности
// TODO: интегрировать с AmoCRM для получения/обновления баллов

const POINTS_CONFIG = {
  subscribe: 20,        // Подписка на сообщество
  social_like: 2,       // Лайк поста
  social_comment: 5,    // Комментарий к посту
  social_repost: 10     // Репост поста
};

async function addPoints(contactId, actionType) {
  try {
    const points = POINTS_CONFIG[actionType];
    if (!points) {
      console.error(`Unknown action type: ${actionType}`);
      return false;
    }

    // TODO: 1) получить текущие баллы из AmoCRM по contactId
    // const currentPoints = await amocrm.getPoints(contactId);
    
    // TODO: 2) добавить новые баллы
    // const newPoints = currentPoints + points;
    
    // TODO: 3) записать обратно в AmoCRM + пересчитать статус
    // await amocrm.updatePoints(contactId, newPoints);
    // await amocrm.updateStatus(contactId, calculateStatus(newPoints));

    console.log(`Added ${points} points for ${actionType} to contact ${contactId}`);
    return true;
  } catch (error) {
    console.error('Error adding points:', error);
    return false;
  }
}

function calculateStatus(points) {
  // Логика расчета статуса по баллам
  if (points >= 3000) return 'Платина';
  if (points >= 1500) return 'Золото';
  if (points >= 500) return 'Серебро';
  return 'Бронза';
}

// Расчет процента кэшбэка по статусу
function calculateCashbackRate(status) {
  const cashbackRates = {
    'Бронза': 5,
    'Серебро': 10,
    'Золото': 15,
    'Платина': 20
  };
  return cashbackRates[status] || 5; // По умолчанию 5% для Бронзы
}

module.exports = { addPoints, calculateStatus, calculateCashbackRate, POINTS_CONFIG };
