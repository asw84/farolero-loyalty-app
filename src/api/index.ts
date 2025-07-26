// src/api/index.ts
// ПОЛНАЯ ВЕРСИЯ

// Функция для загрузки данных пользователя с бэкенда
export const fetchUserData = async (telegramId: number | string) => {
  try {
    const response = await fetch(`/api/user/${telegramId}`);
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
    const response = await fetch('/api/walks');
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
    const response = await fetch(`/api/walk/${id}`);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch walk with id ${id}:`, error);
    return null;
  }
};

// --- НОВАЯ ФУНКЦИЯ: Создание заказа ---
export const createOrder = async (telegramId: number | string, walkId: number | string) => {
  try {
    const response = await fetch('/api/order', {
      method: 'POST', // Указываем, что это POST-запрос
      headers: {
        'Content-Type': 'application/json', // Говорим, что отправляем JSON
      },
      // В тело запроса помещаем наши данные
      body: JSON.stringify({ telegramId, walkId }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return await response.json(); // Ожидаем в ответе JSON с paymentUrl
  } catch (error) {
    console.error('Failed to create order:', error);
    return null;
  }
};