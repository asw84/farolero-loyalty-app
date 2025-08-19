// frontend/src/components/admin/UserSearch.tsx

import { useState } from 'react'; // useEffect удален, так как не используется

interface User {
  id: number;
  telegram_user_id: string;
  instagram_username: string;
  vk_user_id: string;
  points: number;
}

const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const API_BASE_URL = 'https://api.5425685-au70735.twc1.net';
      const response = await fetch(`${API_BASE_URL}/api/admin/users?username=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = async (userId: number) => {
    try {
      const API_BASE_URL = 'https://api.5425685-au70735.twc1.net';
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`);
      const data = await response.json();
      setSelectedUser(data.user);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div style={{ marginBottom: '30px' }}>
      <h3>Поиск пользователей</h3>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Введите username, Telegram ID или VK ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{ 
            padding: '10px', 
            width: '300px', 
            marginRight: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}
        />
        <button 
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Поиск...' : 'Найти'}
        </button>
      </div>

      {users.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h4>Результаты поиска:</h4>
          <div style={{ 
            maxHeight: '200px', 
            overflowY: 'auto',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            {users.map(user => (
              <div 
                key={user.id}
                onClick={() => handleUserSelect(user.id)}
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  backgroundColor: selectedUser?.id === user.id ? '#f0f0f0' : 'white'
                }}
              >
                <strong>ID: {user.id}</strong> - {user.telegram_user_id || user.instagram_username || user.vk_user_id} - {user.points} баллов
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedUser && (
        <div style={{ 
          padding: '15px',
          border: '1px solid #ddd',
          borderRadius: '4px',
          backgroundColor: '#f9f9f9'
        }}>
          <h4>Детали пользователя:</h4>
          <p><strong>ID:</strong> {selectedUser.id}</p>
          <p><strong>Telegram:</strong> {selectedUser.telegram_user_id || 'Не указан'}</p>
          <p><strong>Instagram:</strong> {selectedUser.instagram_username || 'Не указан'}</p>
          <p><strong>VK:</strong> {selectedUser.vk_user_id || 'Не указан'}</p>
          <p><strong>Баллы:</strong> {selectedUser.points.toLocaleString('ru-RU')}</p>
        </div>
      )}
    </div>
  );
};

export default UserSearch;