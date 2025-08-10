// frontend/src/pages/ProfilePage.tsx
// ВЕРСИЯ С КНОПКАМИ ПРИВЯЗКИ

import { useUser } from '../hooks/useUser';

const ProfilePage = () => {
  const { userData, loading } = useUser();

  // --- Логика для ссылок авторизации ---
  const handleInstagramLink = () => {
    // Эти значения должны соответствовать тем, что в вашем Facebook App
    const INSTAGRAM_APP_ID = 'your_instagram_app_id'; // TODO: Вынести в .env.development
    const REDIRECT_URI = `${import.meta.env.VITE_API_URL}/api/oauth/instagram/callback`;
    const state = `tg:${userData.telegramId}`;
    
    // Формируем ссылку для авторизации
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user_profile&response_type=code&state=${encodeURIComponent(state)}`;
    
    // Открываем ссылку в новом окне
    window.open(authUrl, '_blank', 'width=600,height=600');
  };

  const handleVkLink = () => {
    // Простое решение: прямая ссылка на VK ID
    const VK_APP_ID = 54020829;
    const REDIRECT_URI = `${import.meta.env.VITE_API_URL}/api/oauth/vk/callback`;
    const state = `tg:${userData.telegramId}`;
    
    // Используем правильный endpoint VK ID
    const authUrl = `https://id.vk.com/auth?app_id=${VK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${encodeURIComponent(state)}&response_type=code`;
    
    window.open(authUrl, '_blank', 'width=600,height=600');
  };
  // -------------------------------------

  if (loading) {
    return <div>Загрузка профиля...</div>;
  }

  return (
    <div>
      <h1>Профиль</h1>
      <p>ID: {userData.telegramId}</p>
      <p>Баллы: <strong>{userData.points}</strong></p>
      <p>Статус: <strong>{userData.status}</strong></p>
      <hr/>
      
      <h3>Привязка аккаунтов</h3>
      <button onClick={handleInstagramLink}>Привязать Instagram</button>
      <button onClick={handleVkLink} style={{ marginLeft: '10px' }}>Привязать VK</button>

      <hr/>
      <h3>Ваша реферальная ссылка:</h3>
      <p><code>{userData.referralLink}</code></p>
    </div>
  );
};

export default ProfilePage;
