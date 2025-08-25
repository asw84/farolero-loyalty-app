// frontend/src/components/VKIDAuth.tsx
import React, { useEffect, useRef, useState } from 'react';

interface VKIDAuthProps {
  telegramId: string;
  onSuccess?: (vkData: any) => void;
  onError?: (error: any) => void;
}

declare global {
  interface Window {
    VKIDSDK: any;
  }
}

const VKIDAuth: React.FC<VKIDAuthProps> = ({ telegramId, onSuccess, onError }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const [vkUser, setVkUser] = useState<any>(null);

  useEffect(() => {
    // Проверяем статус привязки VK при загрузке
    checkVKStatus();
  }, [telegramId]);

  const checkVKStatus = async () => {
    try {
      const response = await fetch(`/api/vk/status?telegram_id=${telegramId}`);
      const data = await response.json();
      
      if (data.linked) {
        setIsLinked(true);
        setVkUser(data.vk_user);
      }
    } catch (error) {
      console.error('Ошибка проверки статуса VK:', error);
    }
  };

  const initVKIDSDK = () => {
    if (!window.VKIDSDK) {
      console.error('VK ID SDK не загружен');
      return;
    }

    const VKID = window.VKIDSDK;

    try {
      VKID.Config.init({
        app: 54020829,
        redirectUrl: 'https://api.5425685-au70735.twc1.net/api/oauth/vk/callback',
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: '', // Базовые права доступа
      });

      const floatingOneTap = new VKID.FloatingOneTap();

      floatingOneTap.render({
        appName: 'Программа лояльности Farolero',
        showAlternativeLogin: true
      })
      .on(VKID.WidgetEvents.ERROR, vkidOnError)
      .on(VKID.FloatingOneTapInternalEvents.LOGIN_SUCCESS, function (payload: any) {
        console.log('VK Login Success:', payload);
        const code = payload.code;
        const deviceId = payload.device_id;

        setIsLoading(true);

        VKID.Auth.exchangeCode(code, deviceId)
          .then(vkidOnSuccess)
          .catch(vkidOnError);
      });

    } catch (error) {
      console.error('Ошибка инициализации VK ID SDK:', error);
      vkidOnError(error);
    }
  };

  const vkidOnSuccess = async (data: any) => {
    console.log('VK Auth Success:', data);
    setIsLoading(true);

    try {
      // Отправляем данные на backend для привязки
      const response = await fetch('/api/vk/link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: data.access_token,
          user_id: data.user_id,
          email: data.email,
          telegram_id: telegramId
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsLinked(true);
        setVkUser(result.vk_user);
        onSuccess?.(result);
      } else {
        throw new Error(result.error || 'Ошибка привязки аккаунта');
      }

    } catch (error) {
      console.error('Ошибка привязки VK:', error);
      vkidOnError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const vkidOnError = (error: any) => {
    console.error('VK ID Error:', error);
    setIsLoading(false);
    onError?.(error);
  };

  // Загружаем VK ID SDK
  useEffect(() => {
    if (isLinked) return; // Если уже привязан, не загружаем SDK

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
    script.onload = () => {
      console.log('VK ID SDK загружен');
      // Небольшая задержка для инициализации
      setTimeout(initVKIDSDK, 100);
    };
    script.onerror = () => {
      console.error('Ошибка загрузки VK ID SDK');
    };

    document.head.appendChild(script);

    return () => {
      // Убираем script при размонтировании
      document.head.removeChild(script);
    };
  }, [isLinked]);

  if (isLinked && vkUser) {
    return (
      <div className="vk-auth-linked">
        <div className="vk-user-info">
          <img 
            src={vkUser.photo} 
            alt={`${vkUser.first_name} ${vkUser.last_name}`}
            className="vk-avatar"
            style={{ width: 40, height: 40, borderRadius: '50%' }}
          />
          <span>
            ✅ VK: {vkUser.first_name} {vkUser.last_name}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="vk-auth-container" ref={containerRef}>
      {isLoading ? (
        <div className="vk-auth-loading">
          🔄 Привязываем VK аккаунт...
        </div>
      ) : (
        <div className="vk-auth-prompt">
          <p>Для получения дополнительных баллов привяжите VK аккаунт</p>
          <small>Нажмите на кнопку авторизации VK, которая появится</small>
        </div>
      )}
    </div>
  );
};

export default VKIDAuth;