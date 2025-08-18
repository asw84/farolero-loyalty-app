// frontend/src/components/StatusDisplay.tsx
// Компонент для отображения статуса пользователя с прогресс-баром

import React, { useState, useEffect } from 'react';

interface StatusLevel {
  name: string;
  minPoints: number;
  maxPoints: number | null;
  cashbackRate: number;
  color: string;
}

interface StatusDisplayProps {
  points: number;
  status: string;
  telegramId?: string | number | null;
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ points, status }) => {
  const [statusLevels, setStatusLevels] = useState<StatusLevel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatusLevels();
  }, []);

  const fetchStatusLevels = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/status/levels`);
      const data = await response.json();
      if (data.success) {
        setStatusLevels(data.data);
      }
    } catch (error) {
      console.error('Ошибка при загрузке уровней статуса:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLevel = () => {
    return statusLevels.find(level => level.name === status);
  };

  const getNextLevel = () => {
    const currentLevel = getCurrentLevel();
    if (!currentLevel) return null;
    
    const currentIndex = statusLevels.findIndex(level => level.name === status);
    if (currentIndex === -1 || currentIndex === statusLevels.length - 1) return null;
    
    return statusLevels[currentIndex + 1];
  };

  const getProgressToNextLevel = () => {
    const currentLevel = getCurrentLevel();
    const nextLevel = getNextLevel();
    
    if (!currentLevel || !nextLevel) return { progress: 100, pointsNeeded: 0 };
    
    const pointsInCurrentRange = points - currentLevel.minPoints;
    const totalPointsInRange = nextLevel.minPoints - currentLevel.minPoints;
    const progress = Math.min((pointsInCurrentRange / totalPointsInRange) * 100, 100);
    const pointsNeeded = Math.max(nextLevel.minPoints - points, 0);
    
    return { progress, pointsNeeded };
  };

  if (loading) {
    return <div>Загрузка статуса...</div>;
  }

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();
  const { progress, pointsNeeded } = getProgressToNextLevel();

  return (
    <div style={{ 
      padding: '20px', 
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      borderRadius: '15px',
      marginBottom: '20px',
      border: `3px solid ${currentLevel?.color || '#ccc'}`
    }}>
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h3 style={{ 
          margin: '0 0 10px 0', 
          color: currentLevel?.color || '#333',
          fontSize: '24px',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          🏆 {status}
        </h3>
        <div style={{ 
          fontSize: '18px', 
          fontWeight: 'bold',
          color: '#555'
        }}>
          {points.toLocaleString('ru-RU')} баллов
        </div>
      </div>

      {currentLevel && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <span style={{ 
              backgroundColor: currentLevel.color,
              color: 'white',
              padding: '8px 15px',
              borderRadius: '20px',
              fontSize: '16px',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
            }}>
              💰 Кэшбэк: {currentLevel.cashbackRate}%
            </span>
          </div>
        </div>
      )}

      {nextLevel && pointsNeeded > 0 && (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginBottom: '8px',
            fontSize: '14px',
            color: '#666'
          }}>
            <span>До уровня "{nextLevel.name}"</span>
            <span>{pointsNeeded.toLocaleString('ru-RU')} баллов</span>
          </div>
          
          <div style={{ 
            width: '100%',
            height: '12px',
            backgroundColor: '#e0e0e0',
            borderRadius: '6px',
            overflow: 'hidden',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: `${progress}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${currentLevel?.color || '#ccc'}, ${nextLevel.color})`,
              borderRadius: '6px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          
          <div style={{ 
            textAlign: 'center',
            marginTop: '8px',
            fontSize: '12px',
            color: '#888'
          }}>
            {progress.toFixed(1)}% до следующего уровня
          </div>
        </div>
      )}

      {!nextLevel && (
        <div style={{ 
          textAlign: 'center',
          color: currentLevel?.color || '#333',
          fontSize: '16px',
          fontWeight: 'bold',
          marginTop: '10px'
        }}>
          🎉 Максимальный уровень достигнут!
        </div>
      )}
    </div>
  );
};

export default StatusDisplay;
