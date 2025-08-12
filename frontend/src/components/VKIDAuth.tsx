// frontend/src/components/VKIDAuth.tsx
import { useEffect, useRef } from 'react';

// Определяем типы для VK ID SDK
interface VKIDUser {
  uuid: string;
  token: string;
  [key: string]: any;
}

interface VKIDConfig {
  init: (config: {
    app_id: number;
    onAuth: (user: VKIDUser) => void;
    onError: (error: { message: string }) => void;
  }) => void;
  destroy: () => void;
  Widgets: {
    OneTap: (config: {
      container: HTMLDivElement;
      style: {
        width: string;
        height: string;
        borderRadius: string;
        backgroundColor: string;
        color: string;
        fontSize: string;
        fontWeight: string;
        border: string;
        cursor: string;
      };
    }) => void;
  };
}

// Объявляем глобальный тип для VKID
declare global {
  interface Window {
    VKID: VKIDConfig;
  }
}

interface VKIDAuthProps {
  onSuccess: (userData: VKIDUser) => void;
  onError: (error: string) => void;
  telegramId: number; // telegramId остается для возможного использования в будущем
}

const VKIDAuth: React.FC<VKIDAuthProps> = ({ onSuccess, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Создаем URL для VK OAuth через наш auth роут
  const vkAuthUrl = new URL(`${import.meta.env.VITE_API_URL}/api/oauth/vk/login`, window.location.origin);
  vkAuthUrl.searchParams.set('tg_user_id', '123'); // TODO: получить реальный Telegram ID

  useEffect(() => {
    const vkAppId = import.meta.env.VITE_VK_APP_ID;

    if (!vkAppId) {
      console.error('Ошибка конфигурации: VITE_VK_APP_ID не установлен.');
      onError('Ошибка конфигурации клиента VK ID.');
      return;
    }

    // Инициализация VK ID SDK
    if (window.VKID) {
      window.VKID.init({
        app_id: Number(vkAppId),
        onAuth: (user: VKIDUser) => {
          console.log('VK ID авторизация успешна:', user);
          onSuccess(user);
        },
        onError: (error: { message: string }) => {
          console.error('VK ID ошибка авторизации:', error);
          onError(error.message || 'Ошибка авторизации VK ID');
        }
      });

      // Создаем кнопку One Tap
      if (containerRef.current) {
        window.VKID.Widgets.OneTap({
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
        if (window.VKID && window.VKID.destroy) {
          window.VKID.destroy();
        }
      };
    } else {
      console.error('VK ID SDK не загружен');
      onError('VK ID SDK не загружен');
    }
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

