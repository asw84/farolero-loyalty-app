// frontend/src/components/VKIDAuth.tsx
// УПРОЩЕННАЯ И НАДЕЖНАЯ ВЕРСИЯ

import React from 'react';

interface VKIDAuthProps {
  telegramId: number;
}

const VKIDAuth: React.FC<VKIDAuthProps> = ({ telegramId }) => {
  // Формируем полную, абсолютную ссылку на эндпоинт авторизации на бэкенде
  const authUrl = `${import.meta.env.VITE_API_URL || 'https://api.5425685-au70735.twc1.net'}/auth/vk/login?tg_user_id=${telegramId}`;

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      textAlign: 'center' 
    }}>
      <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>
        Привязка аккаунта ВКонтакте
      </h4>
      <a 
        href={authUrl}
        target="_blank" 
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          width: '100%',
          padding: '12px 24px',
          backgroundColor: '#0077FF',
          color: '#FFFFFF',
          textDecoration: 'none',
          borderRadius: '8px',
          fontWeight: '500',
          fontSize: '16px',
          border: 'none',
          cursor: 'pointer',
          boxSizing: 'border-box'
        }}
      >
        Привязать аккаунт VK
      </a>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
        Нажмите, чтобы безопасно подключить ваш профиль VK и начать получать бонусы за активность.
      </p>
    </div>
  );
};

export default VKIDAuth;

