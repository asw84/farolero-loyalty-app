'''// frontend/src/components/VKIDAuth.tsx
import { useEffect, useRef } from 'react';
import { VKID } from '@vkid/sdk';

interface VKIDAuthProps {
  onSuccess: (userData: any) => void;
  onError: (error: string) => void;
  telegramId: number; // telegramId остается для возможного использования в будущем
}

const VKIDAuth: React.FC<VKIDAuthProps> = ({ onSuccess, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);

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
    </div>
  );
};

export default VKIDAuth;
'''
