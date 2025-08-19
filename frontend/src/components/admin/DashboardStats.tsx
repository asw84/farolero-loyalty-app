// frontend/src/components/admin/DashboardStats.tsx

import { useEffect, useState } from 'react';
import { fetchAdminStats } from '../../api';

interface AdminStats {
  totalUsers: number;
  ticketsSold: number;
  pointsSpent: number;
}

const DashboardStats = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchAdminStats();
        setStats(data);
      } catch (error) {
        console.error('Error loading admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <div>Загрузка статистики...</div>;
  }

  const statsCards = [
    {
      title: 'Всего пользователей',
      value: stats?.totalUsers || 0,
      icon: '👥',
      color: '#007bff',
      trend: 'up'
    },
    {
      title: 'Билетов продано',
      value: stats?.ticketsSold || 0,
      icon: '🎫',
      color: '#28a745',
      trend: 'up'
    },
    {
      title: 'Баллов потрачено',
      value: stats?.pointsSpent || 0,
      icon: '💰',
      color: '#ffc107',
      trend: 'down'
    }
  ];

  return (
    <div style={{ marginBottom: '30px' }}>
      <h3>Общая статистика</h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        {statsCards.map((card, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e9ecef',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div style={{ 
                fontSize: '14px', 
                color: '#6c757d',
                fontWeight: '500'
              }}>
                {card.title}
              </div>
              <div style={{ fontSize: '24px' }}>
                {card.icon}
              </div>
            </div>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'bold',
              color: card.color,
              marginBottom: '8px'
            }}>
              {typeof card.value === 'number' ? card.value.toLocaleString('ru-RU') : card.value}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#6c757d',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span style={{ 
                color: card.trend === 'up' ? '#28a745' : '#dc3545',
                fontWeight: 'bold'
              }}>
                {card.trend === 'up' ? '↑' : '↓'}
              </span>
              За все время
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardStats;