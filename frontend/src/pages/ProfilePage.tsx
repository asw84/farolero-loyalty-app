// frontend/src/pages/ProfilePage.tsx
// ВЕРСИЯ С КНОПКАМИ ПРИВЯЗКИ

import { useUser } from '../hooks/useUser';

const ProfilePage = () => {
  const { userData, loading } = useUser();

  // --- Логика для ссылок авторизации ---
  const handleInstagramLink = () => {
    // Эти значения должны соответствовать тем, что в вашем Facebook App
    const INSTAGRAM_APP_ID = 'your_instagram_app_id'; // TODO: Вынести в .env.development
    const REDIRECT_URI = 'http://localhost:3001/api/oauth/instagram/callback';
    
    // Формируем ссылку для авторизации
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_APP_ID}&redirect_uri=${REDIRECT_URI}&scope=user_profile&response_type=code`;
    
    // Открываем ссылку в новом окне
    window.open(authUrl, '_blank');
  };

  const handleVkLink = () => {
    const VK_APP_ID = 54020829; // можно вынести в env, сейчас фиксируем
    const REDIRECT_URI = `${import.meta.env.VITE_API_URL}/api/oauth/vk/callback`;
    const state = `tg:${userData.telegramId}`;
    const authUrl = `https://id.vk.com/authorize?response_type=code&client_id=${VK_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&state=${encodeURIComponent(state)}`;
    window.open(authUrl, '_blank');
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
