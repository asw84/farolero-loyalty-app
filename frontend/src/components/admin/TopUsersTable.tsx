// frontend/src/components/admin/TopUsersTable.tsx

import { useEffect, useState } from 'react';

interface TopUser {
  id: number;
  telegram_user_id: string;
  instagram_username: string;
  vk_user_id: string;
  points: number;
  created_at: string;
}

const TopUsersTable = () => {
  const [users, setUsers] = useState<TopUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const API_BASE_URL = 'https://api.5425685-au70735.twc1.net';
        const response = await fetch(`${API_BASE_URL}/api/admin/top-users`);
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error loading top users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  if (loading) {
    return <div>Загрузка данных о топ-пользователях...</div>;
  }

  return (
    <div style={{ marginBottom: '30px' }}>
      <h3>Топ-10 пользователей по баллам</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Место</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Telegram</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Instagram</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>VK</th>
              <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Баллы</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>
                  <span style={{ 
                    display: 'inline-block', 
                    width: '24px', 
                    height: '24px', 
                    lineHeight: '24px', 
                    textAlign: 'center', 
                    borderRadius: '50%',
                    backgroundColor: index < 3 ? '#ffd700' : '#f0f0f0',
                    color: index < 3 ? '#000' : '#666',
                    fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>{user.id}</td>
                <td style={{ padding: '10px' }}>{user.telegram_user_id || '-'}</td>
                <td style={{ padding: '10px' }}>{user.instagram_username || '-'}</td>
                <td style={{ padding: '10px' }}>{user.vk_user_id || '-'}</td>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{user.points.toLocaleString('ru-RU')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopUsersTable;