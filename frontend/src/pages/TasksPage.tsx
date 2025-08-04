// frontend/src/pages/TasksPage.tsx
// ПОЛНАЯ ВЕРСИЯ С ПРОВЕРКОЙ ЗАГРУЗКИ

import { useUser } from '../context/UserContext';
import { checkSocialSubscription } from '../api';

const TasksPage = () => {
  // --- Теперь мы берем не только userData, но и флаг `loading` ---
  const { userData, loading } = useUser();
  // -----------------------------------------------------------------

  const handleCheckSubscription = async (socialNetwork: string) => {
    // Эта проверка остается на всякий случай
    if (!userData.telegramId) {
      alert('Не удалось определить ваш ID. Попробуйте перезапустить приложение.');
      return;
    }

    alert(`Проверяем вашу подписку на ${socialNetwork}...`);
    
    const result = await checkSocialSubscription(userData.telegramId, socialNetwork);

    if (result.success) {
      alert(result.message);
    } else {
      alert(`Ошибка: ${result.message}`);
    }
  };

  // --- ДОБАВЛЯЕМ ПРОВЕРКУ ЗАГРУЗКИ ---
  // Если данные еще загружаются, показываем заглушку
  if (loading) {
    return <div>Загрузка заданий...</div>;
  }
  // ------------------------------------

  return (
    <div style={{ padding: '20px' }}>
      <h1>Задания за баллы</h1>
      <p>Выполняйте простые задания и получайте бонусные баллы!</p>
      
      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
        <h3>Подписка на Telegram-канал</h3>
        <p>Подпишитесь на наш тестовый канал и получите 100 баллов.</p>
        <button onClick={() => handleCheckSubscription('telegram')}>Я подписался!</button>
      </div>

      {/* Здесь можно будет добавить другие задания, например, VK */}
    </div>
  );
};

export default TasksPage;