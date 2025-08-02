// frontend/src/api/index.ts
// ПОЛНАЯ ВЕРСИЯ

// ВАЖНО: Убедись, что здесь твой актуальный URL из тоннеля для бэкенда
const API_BASE_URL = 'https://ТВОЙ-АКТУАЛЬНЫЙ-АДРЕС.trycloudflare.com';

// Функция для загрузки данных пользователя с бэкенда
export const fetchUserData = async (telegramId: number | string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/${telegramId}`);
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
export const createOrder = async (telegramId: number | string, walkId: number | string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ telegramId, walkId }),
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

// --- НОВАЯ ФУНКЦИЯ ДЛЯ РУЧНОЙ КОРРЕКТИРОВКИ БАЛЛОВ ---
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