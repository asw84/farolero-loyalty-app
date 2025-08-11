// frontend/src/components/VKIDAuth.tsx
import { useEffect, useRef } from 'react';
import { VKID } from '@vkid/sdk';

interface VKIDAuthProps {
  onSuccess: (userData: any) => void;
  onError: (error: string) => void;
  telegramId: number; // telegramId остается для возможного использования в будущем
}

const VKIDAuth: React.FC<VKIDAuthProps> = ({ onSuccess, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Создаем URL для VK OAuth через наш auth роут
  const vkAuthUrl = new URL('/auth/vk/login', window.location.origin);
  vkAuthUrl.searchParams.set('tg_user_id', '123'); // TODO: получить реальный Telegram ID

  useEffect(() => {
    const vkAppId = import.meta.env.VITE_VK_APP_ID;

    if (!vkAppId) {
      console.error('Ошибка конфигурации: VITE_VK_APP_ID не установлен.');
      onError('Ошибка конфигурации клиента VK ID.');
      return;
    }

    // Инициализация VK ID SDK
    VKID.Config.init({
      app_id: Number(vkAppId),
      onAuth: (user) => {
        console.log('VK ID авторизация успешна:', user);
        onSuccess(user);
      },
      onError: (error) => {
        console.error('VK ID ошибка авторизации:', error);
        onError(error.message || 'Ошибка авторизации VK ID');
      }
    });

    // Создаем кнопку One Tap
    if (containerRef.current) {
      VKID.Widgets.OneTap({
        container: containerRef.current,
        style: {
          width: '100%',
          height: '48px',
          borderRadius: '8px',
          backgroundColor: '#0077FF',
          color: '#FFFFFF',
          fontSize: '16px',
          fontWeight: '500',
          border: 'none',
          cursor: 'pointer'
        }
      });
    }

    // Очистка при размонтировании
    return () => {
      VKID.Config.destroy();
    };
  }, [onSuccess, onError]);

  return (
    <div>
      <div ref={containerRef}></div>
      <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
        Нажмите кнопку выше для авторизации через VK ID
      </p>
      
      {/* Кнопка для OAuth авторизации */}
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#333' }}>Альтернативная авторизация VK</h4>
        <a 
          href={vkAuthUrl.toString()} 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#0077FF',
            color: '#FFFFFF',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: '500',
            fontSize: '16px'
          }}
        >
          Привязать VK через OAuth
        </a>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
          Откроется в новой вкладке. После авторизации вернитесь в приложение.
        </p>
      </div>
    </div>
  );
};

export default VKIDAuth;

