// frontend/src/pages/WalkDetailsPage.tsx
// ФИНАЛЬНЫЙ ШТРИХ

import { useEffect, useState, useRef } from 'react';
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
  const walkRef = useRef<WalkDetails | null>(null);
  walkRef.current = walk;

  useEffect(() => {
    if (id) {
      setWalkLoading(true);
      fetchWalkById(id)
        .then(data => { setWalk(data); })
        .finally(() => { setWalkLoading(false); });
    }
  }, [id]);

  useEffect(() => {
    const onPurchase = async () => {
      const currentWalk = walkRef.current;
      if (!currentWalk || !telegramId || !id) return;
      tg.MainButton.showProgress();
      const orderResponse = await createOrder(telegramId, id, usePoints);
      tg.MainButton.hideProgress();
      if (orderResponse && orderResponse.orderUrl) {
        tg.openLink(orderResponse.orderUrl);
      } else {
        tg.showAlert('Не удалось создать заказ.');
      }
    };

    const goBack = () => navigate(-1);
    
    tg.onEvent('mainButtonClicked', onPurchase);
    tg.onEvent('backButtonClicked', goBack);
    tg.BackButton.show();
    
    // --- ГЛАВНОЕ ИЗМЕНЕНИЕ ---
    // Убираем логику показа/скрытия отсюда, чтобы избежать гонок
    // -------------------------

    return () => {
      tg.offEvent('mainButtonClicked', onPurchase);
      tg.offEvent('backButtonClicked', goBack);
      tg.MainButton.hide(); // <-- Прячем кнопку ТОЛЬКО при уходе со страницы
      tg.BackButton.hide();
    };
  }, [telegramId, tg, navigate, id, usePoints]); // Убираем walk из зависимостей здесь

  // --- НОВЫЙ, ОТДЕЛЬНЫЙ ЭФФЕКТ ТОЛЬКО ДЛЯ КНОПКИ ---
  // Он будет следить за состоянием и принимать финальное решение
  useEffect(() => {
    if (walk && telegramId) {
        const price = usePoints ? Math.max(0, walk.price - (points || 0)) : walk.price;
        tg.MainButton.setText(`Купить за ${price} руб.`);
        tg.MainButton.show();
    } else {
      // На всякий случай прячем, если что-то пошло не так
      tg.MainButton.hide();
    }
  }, [walk, telegramId, tg.MainButton, usePoints, points]);
  // ------------------------------------------------

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
