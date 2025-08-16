// frontend/src/pages/WalkDetailsPage.tsx
// ЧИСТАЯ АРХИТЕКТУРА БЕЗ БЕСКОНЕЧНЫХ ЦИКЛОВ

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { fetchWalkById, createOrder } from '../api';
import { useUser } from '../hooks/useUser';

interface WalkDetails {
  id: number;
  city: string;
  title: string;
  price: number;
  description: string;
  duration: string;
}

const WalkDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const { userData, loading: userLoading } = useUser();
  const { telegramId, points } = userData;
  const [usePoints, setUsePoints] = useState(false);
  const [walk, setWalk] = useState<WalkDetails | null>(null);
  const [walkLoading, setWalkLoading] = useState(true);

  // Мемоизация стабильных значений
  const walkId = useMemo(() => id, [id]);
  const stableTelegramId = useMemo(() => telegramId, [telegramId]);

  // Мемоизация загрузки данных прогулки
  const loadWalkData = useCallback(async () => {
    if (!walkId) return;

    try {
      console.log(`[WalkDetailsPage] 🚶 Загружаю прогулку ID: ${walkId}`);
      setWalkLoading(true);
      const data = await fetchWalkById(walkId);
      setWalk(data);
      console.log('[WalkDetailsPage] ✅ Данные прогулки загружены');
    } catch (error) {
      console.error('[WalkDetailsPage] ❌ Ошибка загрузки прогулки:', error);
    } finally {
      setWalkLoading(false);
    }
  }, [walkId]);

  // Мемоизация обработчика покупки
  const handlePurchase = useCallback(async () => {
    if (!walk || !stableTelegramId || !walkId) {
      console.log('[WalkDetailsPage] ⚠️ Отменяю покупку - нет необходимых данных');
      return;
    }

    console.log('[WalkDetailsPage] 💳 Начинаю процесс покупки');
    tg.MainButton.showProgress();
    
    try {
      const orderResponse = await createOrder(stableTelegramId, walkId, usePoints);
      
      if (orderResponse && orderResponse.orderUrl) {
        console.log('[WalkDetailsPage] ✅ Заказ создан, открываю ссылку');
        tg.openLink(orderResponse.orderUrl);
      } else {
        console.log('[WalkDetailsPage] ❌ Не удалось создать заказ');
        tg.showAlert('Не удалось создать заказ.');
      }
    } catch (error) {
      console.error('[WalkDetailsPage] ❌ Ошибка при создании заказа:', error);
      tg.showAlert('Ошибка при создании заказа.');
    } finally {
      tg.MainButton.hideProgress();
    }
  }, [walk, stableTelegramId, walkId, usePoints, tg]);

  // Мемоизация обработчика возврата
  const handleGoBack = useCallback(() => {
    console.log('[WalkDetailsPage] ⬅️ Возвращаюсь назад');
    navigate(-1);
  }, [navigate]);

  // Мемоизация вычисления цены
  const finalPrice = useMemo(() => {
    if (!walk) return 0;
    return usePoints ? Math.max(0, walk.price - (points || 0)) : walk.price;
  }, [walk, usePoints, points]);

  // Загрузка данных прогулки
  useEffect(() => {
    loadWalkData();
  }, [loadWalkData]);

  // Настройка событий Telegram
  useEffect(() => {
    console.log('[WalkDetailsPage] 🔧 Настраиваю события Telegram');
    
    tg.onEvent('mainButtonClicked', handlePurchase);
    tg.onEvent('backButtonClicked', handleGoBack);
    tg.BackButton.show();

    return () => {
      console.log('[WalkDetailsPage] 🧹 Очищаю события Telegram');
      tg.offEvent('mainButtonClicked', handlePurchase);
      tg.offEvent('backButtonClicked', handleGoBack);
      tg.MainButton.hide();
      tg.BackButton.hide();
    };
  }, [tg, handlePurchase, handleGoBack]);

  // Управление главной кнопкой
  useEffect(() => {
    if (walk && stableTelegramId) {
      const buttonText = `Купить за ${finalPrice} руб.`;
      console.log(`[WalkDetailsPage] 🔘 Обновляю кнопку: "${buttonText}"`);
      tg.MainButton.setText(buttonText);
      tg.MainButton.show();
    } else {
      console.log('[WalkDetailsPage] 🔘 Скрываю кнопку - нет данных');
      tg.MainButton.hide();
    }
  }, [walk, stableTelegramId, finalPrice, tg]);

  if (walkLoading || userLoading) {
    return <div>Загрузка информации...</div>;
  }
  if (!walk) {
    return <div>Прогулка не найдена.</div>;
  }

  return (
    <div style={{ padding: '10px' }}>
      <h1>{walk.title}</h1>
      <p><strong>Город:</strong> {walk.city}</p>
      <p><strong>Длительность:</strong> {walk.duration}</p>
      <hr />
      <p>{walk.description}</p>
      <hr />
      <div>
        <label>
          <input type="checkbox" checked={usePoints} onChange={(e) => setUsePoints(e.target.checked)} />
          Использовать {points} баллов для скидки
        </label>
      </div>
    </div>
  );
};

export default WalkDetailsPage;
