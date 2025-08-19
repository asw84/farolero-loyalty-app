// frontend/src/pages/AdminPage.tsx
// УЛУЧШЕННАЯ ВЕРСИЯ С ВИЗУАЛИЗАЦИЕЙ ДАННЫХ И УЛУЧШЕННЫМ UX/UI

import { useState } from 'react';
import AdminTabs from '../components/admin/AdminTabs';
import DashboardStats from '../components/admin/DashboardStats';
import UserSearch from '../components/admin/UserSearch';
import TopUsersTable from '../components/admin/TopUsersTable';
import RegistrationChart from '../components/admin/RegistrationChart';
import PointsDistributionChart from '../components/admin/PointsDistributionChart';
import ActivityStatsChart from '../components/admin/ActivityStatsChart';
import DailyActivityChart from '../components/admin/DailyActivityChart';
import PointsAdjustment from '../components/admin/PointsAdjustment';
import UserManagement from '../components/admin/UserManagement';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div>
            <DashboardStats />
            <TopUsersTable />
          </div>
        );
      case 'users':
        return (
          <div>
            <UserSearch />
            <TopUsersTable />
          </div>
        );
      case 'charts':
        return (
          <div>
            <RegistrationChart />
            <PointsDistributionChart />
            <ActivityStatsChart />
            <DailyActivityChart />
          </div>
        );
      case 'points':
        return <PointsAdjustment />;
      case 'management':
        return <UserManagement />;
      default:
        return (
          <div>
            <DashboardStats />
            <TopUsersTable />
          </div>
        );
    }
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {/* Заголовок админпанели */}
        <div style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '24px',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
            🛠️ Панель администратора
          </h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9 }}>
            Управление пользователями и статистика
          </p>
        </div>

        {/* Вкладки */}
        <AdminTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Контент вкладок */}
        <div style={{ padding: '24px' }}>
          {renderTabContent()}
        </div>

        {/* Подвал */}
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '16px 24px',
          borderTop: '1px solid #e9ecef',
          textAlign: 'center',
          fontSize: '12px',
          color: '#6c757d'
        }}>
          © 2025 Farolero Loyalty App. Административная панель.
        </div>
      </div>
    </div>
  );
};

export default AdminPage;