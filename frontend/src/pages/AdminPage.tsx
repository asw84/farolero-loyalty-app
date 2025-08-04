// frontend/src/pages/AdminPage.tsx
// ПОЛНАЯ ВЕРСИЯ С ФОРМОЙ КОРРЕКТИРОВКИ БАЛЛОВ

import { useEffect, useState } from 'react';
import { fetchAdminStats, adjustUserPoints } from '../api';

// Описываем, какие данные мы ожидаем получить
interface AdminStats {
  totalUsers: number;
  ticketsSold: number;
  pointsSpent: number;
}

const AdminPage = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Состояния для нашей новой формы
  const [telegramId, setTelegramId] = useState('');
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Загружаем данные при открытии страницы
  useEffect(() => {
    setLoading(true);
    fetchAdminStats()
      .then(data => {
        setStats(data);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // Пустой массив зависимостей, чтобы сработало один раз

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const pointsNum = Number(points);

    if (!telegramId || isNaN(pointsNum) || pointsNum === 0) {
        alert('Пожалуйста, введите корректный ID и ненулевое число баллов.');
        setIsSubmitting(false);
        return;
    }

    const result = await adjustUserPoints(telegramId, pointsNum, reason);
    if (result.success) {
        alert(`Баллы успешно обновлены! Новый баланс пользователя: ${result.newTotalPoints}`);
        // Очищаем форму
        setTelegramId('');
        setPoints('');
        setReason('');
    } else {
        alert(`Произошла ошибка: ${result.message}`);
    }
    setIsSubmitting(false);
  };
  
  // Стили
  const cardStyle: React.CSSProperties = {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '20px',
    margin: '10px',
    textAlign: 'center',
    minWidth: '150px'
  };

  const valueStyle: React.CSSProperties = {
    fontSize: '2em',
    fontWeight: 'bold',
    color: 'var(--accent-color)'
  };

  if (loading) {
    return <div>Загрузка статистики...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center' }}>Панель администратора</h1>
      
      {stats && (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div style={cardStyle}>
            <div style={valueStyle}>{stats.totalUsers}</div>
            <div>Всего пользователей</div>
            </div>
            <div style={cardStyle}>
            <div style={valueStyle}>{stats.ticketsSold}</div>
            <div>Билетов продано</div>
            </div>
            <div style={cardStyle}>
            <div style={valueStyle}>{stats.pointsSpent.toLocaleString('ru-RU')}</div>
            <div>Баллов потрачено</div>
            </div>
        </div>
      )}

      <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
        <h2>Ручная корректировка баллов</h2>
        <form onSubmit={handleAdjustPoints}>
          <div style={{ marginBottom: '10px' }}>
            <label>Telegram ID пользователя:</label><br/>
            <input type="text" value={telegramId} onChange={e => setTelegramId(e.target.value)} required style={{width: '90%'}}/>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Количество баллов (для списания - отрицательное, напр. -500):</label><br/>
            <input type="number" value={points} onChange={e => setPoints(e.target.value)} required style={{width: '90%'}}/>
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Причина (например, "Бонус за отзыв" или "Списание за возврат"):</label><br/>
            <input type="text" value={reason} onChange={e => setReason(e.target.value)} required style={{width: '90%'}}/>
          </div>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Выполняется...' : 'Применить'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminPage;