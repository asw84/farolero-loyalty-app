// src/pages/ProfilePage.tsx
import React, { useEffect, useState } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import { fetchUserData } from '../api'; // Импортируем нашу функцию API

// Типизируем данные, которые ожидаем с бэкенда
interface UserData {
  points: number;
  status: string;
  referralLink: string;
}

const ProfilePage = () => {
  const { user } = useTelegram();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUserData(user.id)
        .then(data => {
          setUserData(data);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <div>Загрузка профиля...</div>;
  }

  return (
    <div>
      <h1>Профиль</h1>
      <p>Имя: {user?.first_name}</p>
      <p>ID: {user?.id}</p>
      <p>Баллы: <strong>{userData?.points || 0}</strong></p>
      <p>Статус: <strong>{userData?.status || 'Не определен'}</strong></p>
      <hr/>
      <h3>Ваша реферальная ссылка:</h3>
      <p><code>{userData?.referralLink}</code></p>
    </div>
  );
};

export default ProfilePage;