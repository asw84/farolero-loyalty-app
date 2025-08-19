// frontend/src/components/admin/PointsAdjustment.tsx

import { useState } from 'react';
import { adjustUserPoints } from '../../api';

const PointsAdjustment = () => {
  const [telegramId, setTelegramId] = useState('');
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    const pointsNum = Number(points);

    if (!telegramId || isNaN(pointsNum) || pointsNum === 0) {
      setErrorMessage('Пожалуйста, введите корректный ID и ненулевое число баллов.');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await adjustUserPoints(telegramId, pointsNum, reason);
      if (result.success) {
        setSuccessMessage(`Баллы успешно обновлены! Новый баланс пользователя: ${result.newTotalPoints}`);
        // Очищаем форму
        setTelegramId('');
        setPoints('');
        setReason('');
      } else {
        setErrorMessage(`Произошла ошибка: ${result.message}`);
      }
    } catch (error) {
      setErrorMessage('Произошла ошибка при выполнении запроса.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e9ecef'
    }}>
      <h3 style={{ marginBottom: '20px', color: '#333' }}>Ручная корректировка баллов</h3>
      
      {successMessage && (
        <div style={{
          backgroundColor: '#d4edda',
          color: '#155724',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px',
          border: '1px solid #c3e6cb'
        }}>
          ✅ {successMessage}
        </div>
      )}

      {errorMessage && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px',
          border: '1px solid #f5c6cb'
        }}>
          ❌ {errorMessage}
        </div>
      )}

      <form onSubmit={handleAdjustPoints}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px',
            fontWeight: '500',
            color: '#495057'
          }}>
            Telegram ID пользователя:
          </label>
          <input
            type="text"
            value={telegramId}
            onChange={(e) => setTelegramId(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ced4da'}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px',
            fontWeight: '500',
            color: '#495057'
          }}>
            Количество баллов:
          </label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            required
            placeholder="Для списания используйте отрицательное число, например: -500"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ced4da'}
          />
          <small style={{ color: '#6c757d', fontSize: '12px' }}>
            💡 Положительное число для начисления, отрицательное для списания
          </small>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px',
            fontWeight: '500',
            color: '#495057'
          }}>
            Причина корректировки:
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
            placeholder="Например: 'Бонус за отзыв' или 'Списание за возврат'"
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px',
              resize: 'vertical',
              transition: 'border-color 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ced4da'}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isSubmitting ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.backgroundColor = '#0056b3';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.backgroundColor = '#007bff';
            }
          }}
        >
          {isSubmitting ? (
            <span>⏳ Выполняется...</span>
          ) : (
            <span>✅ Применить изменения</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default PointsAdjustment;