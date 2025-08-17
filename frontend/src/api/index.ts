// frontend/src/api/index.ts
// ПОЛНАЯ ВЕРСИЯ

// ВАЖНО: Вставь сюда актуальный URL из твоего тоннеля для бэкенда
const API_BASE_URL = 'https://api.5425685-au70735.twc1.net';

// Функция для загрузки данных пользователя с бэкенда
export const fetchUserData = async (telegramId: number | string, referrerId: string | null = null) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telegramId, referrerId }),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    return null;
  }
};

// Функция для загрузки КОРОТКОГО списка прогулок
export const fetchWalks = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/walks`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch walks:', error);
    return [];
  }
};

// Функция для загрузки деталей одной прогулки
export const fetchWalkById = async (id: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/walk/${id}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch walk with id ${id}:`, error);
    return null;
  }
};

// Функция создания заказа
export const createOrder = async (telegramId: number | string, walkId: number | string, usePoints: boolean) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telegramId, walkId, usePoints }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server returned an error:', errorData);
      throw new Error(errorData.message || 'Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to create order:', error);
    return null;
  }
};

// Функция для получения статистики для админ-панели
export const fetchAdminStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/stats`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch admin stats:', error);
    return null;
  }
};

// Функция для ручной корректировки баллов
export const adjustUserPoints = async (telegramId: string, points: number, reason: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/adjust-points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId, points, reason }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        return { success: false, message: errorData.message || 'Ошибка сервера' };
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to adjust points:', error);
    return { success: false, message: 'Ошибка сети' };
  }
};

// Функция для проверки подписки на соцсети
export const checkSocialSubscription = async (telegramId: number | string, socialNetwork: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/social/check-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId, socialNetwork }),
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to check subscription:', error);
    return { success: false, message: 'Ошибка сети. Не удалось выполнить проверку.' };
  }
};

// Функция для тестирования подключения к AmoCRM
export const testAmoCRMConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/amocrm/test`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to test AmoCRM connection:', error);
    return { success: false, message: 'Ошибка сети. Не удалось проверить подключение к AmoCRM.' };
  }
};

// Функция для получения контакта из AmoCRM по Telegram ID
export const getAmoCRMContact = async (telegramId: number | string) => {
  try {
    console.log('Запрос к AmoCRM API для telegramId:', telegramId);
    const response = await fetch(`${API_BASE_URL}/api/amocrm/contacts/search?telegramId=${telegramId}`);
    console.log('Статус ответа:', response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Ошибка ответа от AmoCRM API:', errorData);
      throw new Error(`Network response was not ok: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Данные от AmoCRM API:', data);
    return data;
  } catch (error) {
    console.error('Failed to get AmoCRM contact:', error);
    return { success: false, message: 'Ошибка сети. Не удалось получить контакт из AmoCRM.' };
  }
};

// ===============================================
// API функции для геймификации и достижений
// ===============================================

// Получить все достижения пользователя
export const fetchUserAchievements = async (telegramId: number | string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/achievements/user/${telegramId}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user achievements:', error);
    return { success: false, data: [] };
  }
};

// Получить статистику достижений пользователя
export const fetchAchievementsStats = async (telegramId: number | string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/achievements/stats/${telegramId}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch achievements stats:', error);
    return { success: false, data: {} };
  }
};

// Получить ежедневные задания пользователя
export const fetchDailyTasks = async (telegramId: number | string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/daily-tasks/${telegramId}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch daily tasks:', error);
    return { success: false, data: { tasks: [], completed_count: 0, total_count: 0 } };
  }
};

// Выполнить ежедневный вход
export const performDailyCheckin = async (telegramId: number | string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/daily-tasks/${telegramId}/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to perform daily checkin:', error);
    return { success: false, message: 'Ошибка выполнения ежедневного входа' };
  }
};

// Обновить прогресс задания
export const updateTaskProgress = async (telegramId: number | string, taskCode: string, increment = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/daily-tasks/${telegramId}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ taskCode, increment }),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to update task progress:', error);
    return { success: false, message: 'Ошибка обновления прогресса' };
  }
};

// Получить статистику стрика пользователя
export const fetchUserStreak = async (telegramId: number | string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/daily-tasks/${telegramId}/streak`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch user streak:', error);
    return { success: false, data: { current_streak: 0, longest_streak: 0 } };
  }
};

// Получить календарь активности пользователя
export const fetchActivityCalendar = async (telegramId: number | string, period = '30') => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/activity-calendar/${telegramId}?period=${period}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch activity calendar:', error);
    return { success: false, data: { calendar: [], stats: {} } };
  }
};

// Получить месячную активность
export const fetchMonthlyActivity = async (telegramId: number | string, year?: number, month?: number) => {
  try {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month || (now.getMonth() + 1);
    
    const response = await fetch(`${API_BASE_URL}/api/activity-calendar/${telegramId}/month/${targetYear}/${targetMonth}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch monthly activity:', error);
    return { success: false, data: { weeks: [], stats: {} } };
  }
};

// Трекинг активности
export const trackActivity = async (telegramId: number | string, activityType: string, data?: any) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/daily-tasks/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telegramId, activityType, data }),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to track activity:', error);
    return { success: false, message: 'Ошибка трекинга активности' };
  }
};

// Проверить достижения пользователя
export const checkAchievements = async (telegramId: number | string, triggerType?: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/achievements/check/${telegramId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ triggerType }),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to check achievements:', error);
    return { success: false, newlyUnlocked: [], totalUnlocked: 0 };
  }
};