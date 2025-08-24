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

const VKIDAuth: React.FC<VKIDAuthProps> = ({ onSuccess, onError, telegramId }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Загружаем VK ID SDK, если он еще не загружен
    if (!window.VKID) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@vkid/sdk/dist/vkid.umd.js';
      script.async = true;
      script.onload = () => {
        console.log('VK ID SDK загружен');
      };
      script.onerror = () => {
        console.error('Ошибка загрузки VK ID SDK');
        onError('Ошибка загрузки VK ID SDK');
      };
      document.head.appendChild(script);
    }

    // Получаем конфигурацию VK с backend
    const getVKConfig = async () => {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.5425685-au70735.twc1.net';
        const response = await fetch(`${API_BASE_URL}/api/vk/config`);
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Ошибка получения конфигурации VK');
        }
        
        const { appId } = data.config;
        
        if (!appId) {
          throw new Error('VK_CLIENT_ID не настроен на сервере');
        }
        
        // Проверяем, загружен ли VK ID SDK
        const checkVKIDLoaded = () => {
          if (window.VKID) {
            window.VKID.init({
              app_id: Number(appId),
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
          } else {
            // Если SDK еще не загружен, пробуем снова через 500мс
            setTimeout(checkVKIDLoaded, 500);
          }
        };
        
        // Начинаем проверку загрузки SDK
        checkVKIDLoaded();
      } catch (error) {
        console.error('Ошибка при получении конфигурации VK:', error);
        onError('Ошибка конфигурации клиента VK ID.');
      }
    };

    getVKConfig();

    // Очистка при размонтировании
    return () => {
      if (window.VKID && window.VKID.destroy) {
        window.VKID.destroy();
      }
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
          href={`${import.meta.env.VITE_API_URL || 'https://api.5425685-au70735.twc1.net'}/auth/vk/login?tg_user_id=${telegramId}`}
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

