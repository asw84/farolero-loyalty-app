// frontend/src/pages/AnalyticsPage.tsx
// Страница аналитики и RFM-анализа

import React, { useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import './AnalyticsPage.css';

interface SegmentInfo {
  description: string;
  strategy: string;
  color: string;
}

interface Segment {
  segment_name: string;
  user_count: number;
  avg_recency: number;
  avg_frequency: number;
  avg_monetary: number;
  info: SegmentInfo;
}

interface DashboardData {
  overview: {
    totalUsers: number;
    totalPurchases: number;
    totalRevenue: number;
    activeUsers: number;
  };
  segments: {
    total: number;
    topSegments: Segment[];
  };
  dailyStats: Array<{
    date: string;
    purchases: number;
    unique_users: number;
    revenue: number;
  }>;
}

interface UserRFM {
  recency_score: number;
  frequency_score: number;
  monetary_score: number;
  segment_name: string;
  calculated_at: string;
  segmentInfo?: SegmentInfo;
}

const AnalyticsPage: React.FC = () => {
  const { user } = useTelegram();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [userRFM, setUserRFM] = useState<UserRFM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'segments' | 'personal'>('overview');

  useEffect(() => {
    loadAnalyticsData();
    if (user?.id) {
      loadUserRFM();
    }
  }, [user]);

  const loadAnalyticsData = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard');
      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError('Ошибка загрузки данных аналитики');
      }
    } catch (err) {
      console.error('Ошибка загрузки аналитики:', err);
      setError('Ошибка подключения к серверу');
    }
  };

  const loadUserRFM = async () => {
    try {
      const response = await fetch(`/api/analytics/rfm/user/${user?.id}`);
      const data = await response.json();

      if (data.success) {
        setUserRFM(data.data);
      }
    } catch (err) {
      console.error('Ошибка загрузки RFM пользователя:', err);
    } finally {
      setLoading(false);
    }
  };

  const recalculateRFM = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/analytics/rfm/calculate', {
        method: 'POST'
      });

      const data = await response.json();
      if (data.success) {
        await loadAnalyticsData();
        await loadUserRFM();
      }
    } catch (err) {
      console.error('Ошибка пересчета RFM:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(num);
  };

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка аналитики...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-page">
        <div className="error-message">
          <h3>Ошибка</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <h1>📊 Аналитика</h1>
        <button onClick={recalculateRFM} className="recalculate-button">
          🔄 Пересчитать RFM
        </button>
      </div>

      <div className="analytics-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Обзор
        </button>
        <button 
          className={`tab ${activeTab === 'segments' ? 'active' : ''}`}
          onClick={() => setActiveTab('segments')}
        >
          Сегменты
        </button>
        <button 
          className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Мой RFM
        </button>
      </div>

      {activeTab === 'overview' && dashboardData && (
        <div className="overview-tab">
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-value">{formatNumber(dashboardData.overview.totalUsers)}</div>
              <div className="metric-label">Всего пользователей</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{formatNumber(dashboardData.overview.totalPurchases)}</div>
              <div className="metric-label">Всего покупок</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{formatCurrency(dashboardData.overview.totalRevenue)}</div>
              <div className="metric-label">Общая выручка</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{formatNumber(dashboardData.overview.activeUsers)}</div>
              <div className="metric-label">Активных за месяц</div>
            </div>
          </div>

          {dashboardData.dailyStats.length > 0 && (
            <div className="daily-stats">
              <h3>📈 Статистика за последние дни</h3>
              <div className="stats-list">
                {dashboardData.dailyStats.slice(0, 7).map((stat, index) => (
                  <div key={index} className="stat-row">
                    <div className="stat-date">
                      {new Date(stat.date).toLocaleDateString('ru-RU')}
                    </div>
                    <div className="stat-metrics">
                      <span>Покупок: {stat.purchases}</span>
                      <span>Пользователей: {stat.unique_users}</span>
                      <span>Выручка: {formatCurrency(stat.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'segments' && dashboardData && (
        <div className="segments-tab">
          <div className="segments-summary">
            <h3>👥 RFM Сегменты ({formatNumber(dashboardData.segments.total)} пользователей)</h3>
          </div>

          <div className="segments-grid">
            {dashboardData.segments.topSegments.map((segment, index) => (
              <div 
                key={index} 
                className="segment-card"
                style={{ borderLeftColor: segment.info.color }}
              >
                <div className="segment-header">
                  <h4>{segment.segment_name}</h4>
                  <div className="segment-count">{segment.user_count} чел.</div>
                </div>
                <div className="segment-description">
                  {segment.info.description}
                </div>
                <div className="segment-scores">
                  <div className="score">
                    R: {segment.avg_recency.toFixed(1)}
                  </div>
                  <div className="score">
                    F: {segment.avg_frequency.toFixed(1)}
                  </div>
                  <div className="score">
                    M: {segment.avg_monetary.toFixed(1)}
                  </div>
                </div>
                <div className="segment-strategy">
                  <strong>Стратегия:</strong> {segment.info.strategy}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'personal' && (
        <div className="personal-tab">
          {userRFM ? (
            <div className="personal-rfm">
              <div className="rfm-header">
                <h3>🎯 Ваш RFM профиль</h3>
                <div className="rfm-segment" style={{ color: userRFM.segmentInfo?.color }}>
                  {userRFM.segment_name}
                </div>
              </div>

              <div className="rfm-scores">
                <div className="rfm-score">
                  <div className="score-label">Recency</div>
                  <div className="score-value">{userRFM.recency_score}</div>
                  <div className="score-desc">Недавность покупок</div>
                </div>
                <div className="rfm-score">
                  <div className="score-label">Frequency</div>
                  <div className="score-value">{userRFM.frequency_score}</div>
                  <div className="score-desc">Частота покупок</div>
                </div>
                <div className="rfm-score">
                  <div className="score-label">Monetary</div>
                  <div className="score-value">{userRFM.monetary_score}</div>
                  <div className="score-desc">Сумма покупок</div>
                </div>
              </div>

              {userRFM.segmentInfo && (
                <div className="segment-info">
                  <h4>Описание сегмента</h4>
                  <p>{userRFM.segmentInfo.description}</p>
                  <h4>Рекомендации</h4>
                  <p>{userRFM.segmentInfo.strategy}</p>
                </div>
              )}

              <div className="rfm-updated">
                Обновлено: {new Date(userRFM.calculated_at).toLocaleDateString('ru-RU')}
              </div>
            </div>
          ) : (
            <div className="no-rfm">
              <h3>🔍 RFM данные не найдены</h3>
              <p>Совершите первую покупку, чтобы увидеть свой RFM профиль</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsPage;
