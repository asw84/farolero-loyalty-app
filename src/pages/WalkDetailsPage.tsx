// src/pages/WalkDetailsPage.tsx
// ФИНАЛЬНАЯ ВЕРСИЯ С ПОЛНЫМ ИСПРАВЛЕНИЕМ ЦИКЛА РЕРЕНДЕРА

import { useEffect, useState, useRef } from 'react'; // Добавляем useRef
import { useParams, useNavigate } from 'react-router-dom';
import { useTelegram } from '../hooks/useTelegram';
import { fetchWalkById, createOrder } from '../api';

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
  const { tg, user } = useTelegram();

  const [walk, setWalk] = useState<WalkDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Используем useRef для хранения walk, чтобы избежать цикла в useEffect
  const walkRef = useRef<WalkDetails | null>(null);
  walkRef.current = walk;

  useEffect(() => {
    const onPurchase = async () => {
      // Используем walkRef.current для доступа к актуальным данным без зависимости
      const currentWalk = walkRef.current;
      if (!currentWalk || !user?.id || !id) return;

      tg.MainButton.showProgress();
      const orderResponse = await createOrder(user.id, id);
      tg.MainButton.hideProgress();

      if (orderResponse && orderResponse.paymentUrl) {
        tg.openLink(orderResponse.paymentUrl);
      } else {
        tg.showAlert('Не удалось создать заказ. Попробуйте позже.');
      }
    };

    const goBack = () => navigate(-1);

    tg.onEvent('mainButtonClicked', onPurchase);
    tg.onEvent('backButtonClicked', goBack);
    tg.BackButton.show();

    return () => {
      tg.offEvent('mainButtonClicked', onPurchase);
      tg.offEvent('backButtonClicked', goBack);
      tg.MainButton.hide();
      tg.BackButton.hide();
    };
    // Убираем почти все зависимости. Этот useEffect теперь отвечает ТОЛЬКО за подписку/отписку
  }, [id, user, tg, navigate]);

  // Отдельный useEffect для загрузки данных. Он запускается только один раз
  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchWalkById(id).then(data => {
        setWalk(data);
        if (data) {
          tg.MainButton.setText(`Купить за ${data.price} руб.`);
          tg.MainButton.show();
        }
      }).finally(() => {
        setLoading(false);
      });
    }
  }, [id, tg]); // Зависит только от id, который не меняется

  if (loading) {
    return <div>Загрузка информации о прогулке...</div>;
  }

  if (!walk) {
    return <div>Прогулка не найдена.</div>;
  }

  return (
    <div style={{ padding: '10px' }}>
      <h1 style={{ fontFamily: 'var(--primary-font)', fontSize: '2.5em' }}>{walk.title}</h1>
      <p><strong>Город:</strong> {walk.city}</p>
      <p><strong>Длительность:</strong> {walk.duration}</p>
      <hr style={{ borderColor: 'var(--accent-color)', opacity: 0.3 }}/>
      <p>{walk.description}</p>
    </div>
  );
};

export default WalkDetailsPage;