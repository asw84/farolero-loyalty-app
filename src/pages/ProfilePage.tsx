// frontend/src/pages/ProfilePage.tsx
// ИСПРАВЛЕННАЯ ВЕРСИЯ

import { useEffect, useState } from 'react';
import { useUser } from '../context/UserContext'; // <-- Импортируем наш хук

const ProfilePage = () => {
  // --- Получаем все данные из общего хранилища ---
  const { userData, loading } = useUser();
  // ---------------------------------------------

  if (loading) {
    return <div>Загрузка профиля...</div>;
  }

  return (
    <div>
      <h1>Профиль</h1>
      {/* Используем данные из userData */}
      <p>ID: {userData.telegramId}</p>
      <p>Баллы: <strong>{userData.points}</strong></p>
      <p>Статус: <strong>{userData.status}</strong></p>
      <hr/>
      <h3>Ваша реферальная ссылка:</h3>
      <p><code>{userData.referralLink}</code></p>
    </div>
  );
};

export default ProfilePage;