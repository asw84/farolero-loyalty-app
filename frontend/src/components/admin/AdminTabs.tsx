// frontend/src/components/admin/AdminTabs.tsx

import { useState } from 'react';

interface AdminTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const AdminTabs = ({ activeTab, onTabChange }: AdminTabsProps) => {
  const tabs = [
    { id: 'dashboard', label: 'Общая статистика', icon: '📊' },
    { id: 'users', label: 'Пользователи', icon: '👥' },
    { id: 'charts', label: 'Графики', icon: '📈' },
    { id: 'points', label: 'Баллы', icon: '💰' },
    { id: 'management', label: 'Управление', icon: '🛠️' },
  ];

  return (
    <div style={{ 
      display: 'flex', 
      borderBottom: '2px solid #eee', 
      marginBottom: '20px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px 8px 0 0',
      overflow: 'hidden'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            padding: '12px 20px',
            backgroundColor: activeTab === tab.id ? '#007bff' : 'transparent',
            color: activeTab === tab.id ? 'white' : '#333',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: activeTab === tab.id ? 'bold' : 'normal',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flex: 1,
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.backgroundColor = '#e9ecef';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== tab.id) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <span style={{ fontSize: '16px' }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default AdminTabs;