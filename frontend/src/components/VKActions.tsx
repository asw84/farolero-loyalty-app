import { useState } from 'react';
import axios from 'axios';

interface VKActionsProps {
  vkId?: number;
  contactId?: number;
}

export function VKActions({ vkId }: VKActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  // ID группы VK (отрицательный для постов сообщества)
  const groupId = Number(import.meta.env.VITE_VK_GROUP_ID || '227733445');
  const ownerId = -groupId; // Отрицательный ID для постов сообщества
  
  // ID поста для тестирования (замените на реальный)
  const postId = 123;

  const verify = async (action: 'subscribe' | 'like' | 'comment' | 'repost') => {
    if (!vkId) {
      setResult('Сначала привяжите VK аккаунт');
      return;
    }

    setLoading(action);
    setResult(null);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.5425685-au70735.twc1.net';
      const response = await axios.post(`${API_BASE_URL}/api/social/vk/verify`, {
        action,
        target: { ownerId, postId }
        // user данные теперь получаются из req.user через middleware
      });

      if (response.data.ok) {
        setResult(`✅ ${response.data.message}`);
      } else {
        setResult(`❌ ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      setResult(`❌ Ошибка: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(null);
    }
  };

  if (!vkId) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        Сначала привяжите VK аккаунт для проверки действий
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ marginBottom: '20px', color: '#333' }}>
        Проверка действий в VK сообществе
      </h3>
      
      <div style={{ marginBottom: '20px', fontSize: '14px', color: '#666' }}>
        <p>VK ID: {vkId}</p>
        <p>Группа: {groupId}</p>
      </div>

      <div style={{ display: 'grid', gap: '10px', maxWidth: '300px' }}>
        <button 
          onClick={() => verify('subscribe')}
          disabled={loading === 'subscribe'}
          style={{
            padding: '12px',
            backgroundColor: '#0077FF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading === 'subscribe' ? 'not-allowed' : 'pointer',
            opacity: loading === 'subscribe' ? 0.7 : 1
          }}
        >
          {loading === 'subscribe' ? 'Проверяю...' : 'Проверить подписку (+20 баллов)'}
        </button>

        <button 
          onClick={() => verify('like')}
          disabled={loading === 'like'}
          style={{
            padding: '12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading === 'like' ? 'not-allowed' : 'pointer',
            opacity: loading === 'like' ? 0.7 : 1
          }}
        >
          {loading === 'like' ? 'Проверяю...' : 'Проверить лайк (+2 балла)'}
        </button>

        <button 
          onClick={() => verify('comment')}
          disabled={loading === 'comment'}
          style={{
            padding: '12px',
            backgroundColor: '#FF9800',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading === 'comment' ? 'not-allowed' : 'pointer',
            opacity: loading === 'comment' ? 0.7 : 1
          }}
        >
          {loading === 'comment' ? 'Проверяю...' : 'Проверить комментарий (+5 баллов)'}
        </button>

        <button 
          onClick={() => verify('repost')}
          disabled={loading === 'repost'}
          style={{
            padding: '12px',
            backgroundColor: '#9C27B0',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading === 'repost' ? 'not-allowed' : 'pointer',
            opacity: loading === 'repost' ? 0.7 : 1
          }}
        >
          {loading === 'repost' ? 'Проверяю...' : 'Проверить репост (+10 баллов)'}
        </button>
      </div>

      {result && (
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          backgroundColor: result.includes('✅') ? '#e8f5e8' : '#ffeaea',
          borderRadius: '8px',
          border: `1px solid ${result.includes('✅') ? '#4CAF50' : '#f44336'}`
        }}>
          {result}
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
        <p>💡 Для тестирования используйте реальные действия в VK сообществе</p>
        <p>📝 ID поста: {postId} (замените на реальный)</p>
      </div>
    </div>
  );
}
