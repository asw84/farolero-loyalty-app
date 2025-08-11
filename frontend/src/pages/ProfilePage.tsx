'''// frontend/src/pages/ProfilePage.tsx
// ВЕРСИЯ С VK ID SDK

import { useState } from 'react';
import { useUser } from '../hooks/useUser';
import VKIDAuth from '../components/VKIDAuth';

const ProfilePage = () => {
  const { userData, loading } = useUser();
  const [vkAuthStatus, setVkAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [vkAuthMessage, setVkAuthMessage] = useState('');

  // --- Логика для Instagram OAuth (оставляем как есть) ---
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

  // --- Обработчики для VK ID ---
  const handleVKIDSuccess = async (vkData: any) => {
    console.log('VK ID авторизация успешна, отправка на бэкенд:', vkData);
    setVkAuthStatus('loading');
    setVkAuthMessage('Проверка данных...');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/oauth/vk/verify-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vkData: vkData,
          telegramId: userData.telegramId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка проверки на сервере');
      }

      setVkAuthStatus('success');
      setVkAuthMessage('Аккаунт VK успешно привязан!');
      console.log('Бэкенд успешно обработал данные:', result);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('Ошибка при отправке данных на бэкенд:', errorMessage);
      setVkAuthStatus('error');
      setVkAuthMessage(`Ошибка: ${errorMessage}`);
    }
  };

  const handleVKIDError = (error: string) => {
    console.error('VK ID ошибка:', error);
    setVkAuthStatus('error');
    setVkAuthMessage(`Ошибка: ${error}`);
  };

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
      
      {/* Instagram OAuth */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Instagram</h4>
        <button onClick={handleInstagramLink}>Привязать Instagram</button>
      </div>

      {/* VK ID авторизация */}
      <div style={{ marginBottom: '20px' }}>
        <h4>VK ID</h4>
        {vkAuthStatus === 'loading' && (
          <div style={{ color: 'blue', marginBottom: '10px' }}>
            {vkAuthMessage}
          </div>
        )}
        {vkAuthStatus === 'success' && (
          <div style={{ color: 'green', marginBottom: '10px' }}>
            ✅ {vkAuthMessage}
          </div>
        )}
        {vkAuthStatus === 'error' && (
          <div style={{ color: 'red', marginBottom: '10px' }}>
            ❌ {vkAuthMessage}
          </div>
        )}
        {vkAuthStatus !== 'success' && (
          <VKIDAuth
            onSuccess={handleVKIDSuccess}
            onError={handleVKIDError}
            telegramId={userData.telegramId}
          />
        )}
      </div>

      <hr/>
      <h3>Ваша реферальная ссылка:</h3>
      <p><code>{userData.referralLink}</code></p>
    </div>
  );
};

export default ProfilePage;
''
