// frontend/src/components/admin/UserManagement.tsx

import { useState } from 'react';

interface User {
  id: number;
  telegram_user_id: string;
  instagram_username: string;
  vk_user_id: string;
  points: number;
  created_at: string;
}

const UserManagement = () => {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkPoints, setBulkPoints] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Пример данных пользователей (в реальном приложении они будут загружаться с API)
  const [users] = useState<User[]>([
    {
      id: 1,
      telegram_user_id: 'user1',
      instagram_username: 'insta_user1',
      vk_user_id: 'vk1',
      points: 1000,
      created_at: '2025-01-01'
    },
    {
      id: 2,
      telegram_user_id: 'user2',
      instagram_username: 'insta_user2',
      vk_user_id: 'vk2',
      points: 1500,
      created_at: '2025-01-02'
    }
  ]);

  const handleUserSelect = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleBulkAction = async () => {
    if (selectedUsers.length === 0) {
      setMessage({ text: 'Пожалуйста, выберите хотя бы одного пользователя', type: 'error' });
      return;
    }

    if (bulkAction === 'adjustPoints' && (!bulkPoints || !bulkReason)) {
      setMessage({ text: 'Пожалуйста, укажите количество баллов и причину', type: 'error' });
      return;
    }

    setIsProcessing(true);
    setMessage({ text: '', type: '' });

    try {
      // Здесь будет вызов API для выполнения массовых операций
      const API_BASE_URL = 'https://api.5425685-au70735.twc1.net';
      
      if (bulkAction === 'adjustPoints') {
        // Массовая корректировка баллов
        for (const userId of selectedUsers) {
          const response = await fetch(`${API_BASE_URL}/api/admin/adjust-points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              telegramId: userId, 
              points: Number(bulkPoints), 
              reason: bulkReason 
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Ошибка при обработке пользователя ${userId}`);
          }
        }
        
        setMessage({ 
          text: `Баллы успешно обновлены для ${selectedUsers.length} пользователей`, 
          type: 'success' 
        });
      } else if (bulkAction === 'resetPoints') {
        // Сброс баллов
        for (const userId of selectedUsers) {
          const response = await fetch(`${API_BASE_URL}/api/admin/adjust-points`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              telegramId: userId,
              points: -(users.find(u => u.id === userId)?.points || 0),
              reason: 'Массовый сброс баллов'
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Ошибка при обработке пользователя ${userId}`);
          }
        }
        
        setMessage({ 
          text: `Баллы сброшены для ${selectedUsers.length} пользователей`, 
          type: 'success' 
        });
      }

      // Очищаем форму
      setSelectedUsers([]);
      setBulkAction('');
      setBulkPoints('');
      setBulkReason('');
    } catch (error) {
      setMessage({
        text: `Ошибка при выполнении операции: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`,
        type: 'error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exportUsers = () => {
    // Экспорт выбранных пользователей в CSV
    const headers = ['ID', 'Telegram', 'Instagram', 'VK', 'Баллы', 'Дата регистрации'];
    const csvContent = [
      headers.join(','),
      ...users
        .filter(user => selectedUsers.includes(user.id))
        .map(user => [
          user.id,
          user.telegram_user_id || '',
          user.instagram_username || '',
          user.vk_user_id || '',
          user.points,
          user.created_at
        ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div style={{ 
      padding: '24px',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e9ecef'
    }}>
      <h3 style={{ marginBottom: '20px', color: '#333' }}>
        🛠️ Управление пользователями
      </h3>

      {message.text && (
        <div style={{
          backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
          color: message.type === 'success' ? '#155724' : '#721c24',
          padding: '12px',
          borderRadius: '6px',
          marginBottom: '16px',
          border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Панель массовых операций */}
      <div style={{ 
        backgroundColor: '#f8f9fa',
        padding: '16px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ marginTop: 0, marginBottom: '12px' }}>
          Массовые операции ({selectedUsers.length} выбрано)
        </h4>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            style={{
              padding: '8px',
              border: '1px solid #ced4da',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          >
            <option value="">Выберите действие...</option>
            <option value="adjustPoints">Изменить баллы</option>
            <option value="resetPoints">Сбросить баллы</option>
          </select>

          {bulkAction === 'adjustPoints' && (
            <>
              <input
                type="number"
                placeholder="Баллы (+/-)"
                value={bulkPoints}
                onChange={(e) => setBulkPoints(e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '120px'
                }}
              />
              <input
                type="text"
                placeholder="Причина"
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                style={{
                  padding: '8px',
                  border: '1px solid #ced4da',
                  borderRadius: '4px',
                  fontSize: '14px',
                  width: '200px'
                }}
              />
            </>
          )}

          <button
            onClick={handleBulkAction}
            disabled={isProcessing || !bulkAction || selectedUsers.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: (isProcessing || !bulkAction || selectedUsers.length === 0) ? 'not-allowed' : 'pointer'
            }}
          >
            {isProcessing ? '⏳ Выполняется...' : '✅ Применить'}
          </button>

          <button
            onClick={exportUsers}
            disabled={selectedUsers.length === 0}
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '14px',
              cursor: selectedUsers.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            📊 Экспорт CSV
          </button>
        </div>
      </div>

      {/* Таблица пользователей */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={handleSelectAll}
                  style={{ marginRight: '8px' }}
                />
                Выбрать все
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Telegram</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Instagram</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>VK</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Баллы</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Дата регистрации</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr 
                key={user.id} 
                style={{ 
                  borderBottom: '1px solid #dee2e6',
                  backgroundColor: selectedUsers.includes(user.id) ? '#f8f9fa' : 'white'
                }}
              >
                <td style={{ padding: '12px' }}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleUserSelect(user.id)}
                  />
                </td>
                <td style={{ padding: '12px' }}>{user.id}</td>
                <td style={{ padding: '12px' }}>{user.telegram_user_id || '-'}</td>
                <td style={{ padding: '12px' }}>{user.instagram_username || '-'}</td>
                <td style={{ padding: '12px' }}>{user.vk_user_id || '-'}</td>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>
                  {user.points.toLocaleString('ru-RU')}
                </td>
                <td style={{ padding: '12px' }}>{user.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px',
          color: '#6c757d'
        }}>
          Пользователи не найдены
        </div>
      )}
    </div>
  );
};

export default UserManagement;