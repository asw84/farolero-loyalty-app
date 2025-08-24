// frontend/src/pages/ProfilePage.tsx
// ВЕРСИЯ С VK ID SDK

import { useState } from 'react';
import { useUser } from '../hooks/useUser';
import VKIDAuth from '../components/VKIDAuth';
import StatusDisplay from '../components/StatusDisplay';
import { testAmoCRMConnection, getAmoCRMContact } from '../api';

const ProfilePage = () => {
  const { userData, loading } = useUser();
  // --- УДАЛЕНО: Состояния для VK ID SDK больше не нужны ---
  // const [vkAuthStatus, setVkAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  // const [vkAuthMessage, setVkAuthMessage] = useState('');
  const [amocrmStatus, setAmocrmStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [amocrmMessage, setAmocrmMessage] = useState('');
  const [amocrmContact, setAmocrmContact] = useState<any>(null);

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

  // --- УДАЛЕНО: Обработчики для VK ID SDK больше не нужны, так как авторизация серверная ---
  // const handleVKIDSuccess = async (vkData: any) => { ... };
  // const handleVKIDError = (error: string) => { ... };

  // --- Обработчики для AmoCRM ---
  const handleTestAmoCRM = async () => {
    setAmocrmStatus('loading');
    setAmocrmMessage('Проверка подключения к AmoCRM...');
    
    try {
      const result = await testAmoCRMConnection();
      
      if (result.success) {
        setAmocrmStatus('success');
        setAmocrmMessage(`✅ Подключение успешно! Найдено ${result.usersCount} пользователей`);
      } else {
        setAmocrmStatus('error');
        setAmocrmMessage(`❌ Ошибка: ${result.message}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      setAmocrmStatus('error');
      setAmocrmMessage(`❌ Ошибка: ${errorMessage}`);
    }
  };

  const handleGetAmoCRMContact = async () => {
    if (!userData?.telegramId) {
      setAmocrmStatus('error');
      setAmocrmMessage('❌ Ошибка: Telegram ID не найден');
      return;
    }
    
    setAmocrmStatus('loading');
    setAmocrmMessage('Поиск контакта в AmoCRM...');
    console.log('Поиск контакта для Telegram ID:', userData.telegramId);
    
    try {
      const result = await getAmoCRMContact(userData.telegramId);
      console.log('Результат от AmoCRM:', result);
      
      if (result.success) {
        setAmocrmStatus('success');
        setAmocrmContact(result.contact);
        setAmocrmMessage(`✅ Найден контакт: ${result.contact.name} (ID: ${result.contact.id}), баллов: ${result.contact.points}`);
      } else {
        setAmocrmStatus('error');
        setAmocrmMessage(`❌ Ошибка: ${result.message}`);
        setAmocrmContact(null);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      console.error('Ошибка при получении контакта из AmoCRM:', error);
      setAmocrmStatus('error');
      setAmocrmMessage(`❌ Ошибка: ${errorMessage}`);
      setAmocrmContact(null);
    }
  };

  if (loading) {
    return <div>Загрузка профиля...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Профиль</h1>
      
      <StatusDisplay 
        points={userData.points}
        status={userData.status}
        telegramId={userData.telegramId}
      />
      
      <div style={{ 
        backgroundColor: '#f8f9fa',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '20px'
      }}>
        <p><strong>Telegram ID:</strong> {userData.telegramId}</p>
      </div>
      
      <h3>Привязка аккаунтов</h3>
      
      {/* Instagram OAuth */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Instagram</h4>
        <button onClick={handleInstagramLink}>Привязать Instagram</button>
      </div>

      {/* VK ID авторизация */}
      <div style={{ marginBottom: '20px' }}>
        <h4>VK ID</h4>
        {/* --- УДАЛЕНО: Отображение статусов VK ID SDK --- */}
        <VKIDAuth
          telegramId={Number(userData.telegramId) || 0}
        />
      </div>

      <hr/>
      
      {/* AmoCRM тестирование */}
      <h3>Интеграция с AmoCRM</h3>
      <div style={{ marginBottom: '20px' }}>
        <h4>Тестирование подключения</h4>
        <button onClick={handleTestAmoCRM} style={{ marginRight: '10px' }}>
          Тестировать подключение
        </button>
        <button onClick={handleGetAmoCRMContact}>
          Найти мой контакт
        </button>
        
        {amocrmStatus === 'loading' && (
          <div style={{ color: 'blue', marginBottom: '10px', marginTop: '10px' }}>
            {amocrmMessage}
          </div>
        )}
        {amocrmStatus === 'success' && (
          <div style={{ color: 'green', marginBottom: '10px', marginTop: '10px' }}>
            {amocrmMessage}
          </div>
        )}
        {amocrmStatus === 'error' && (
          <div style={{ color: 'red', marginBottom: '10px', marginTop: '10px' }}>
            {amocrmMessage}
          </div>
        )}
        
        {amocrmContact && (
          <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h4>Информация о контакте из AmoCRM:</h4>
            <p><strong>ID:</strong> {amocrmContact.id}</p>
            <p><strong>Имя:</strong> {amocrmContact.name}</p>
            <p><strong>Баллы:</strong> {amocrmContact.points}</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ProfilePage;
