// frontend/src/pages/TasksPage.tsx
import { useUser } from '../context/UserContext'; // Импортируем, чтобы знать ID пользователя

const TasksPage = () => {
  const { userData } = useUser(); // Получаем данные пользователя из хранилища

  const handleCheckSubscription = (socialNetwork: string) => {
    if (!userData.telegramId) {
      alert('Не удалось определить ваш ID. Попробуйте перезапустить приложение.');
      return;
    }
    alert(`Проверяем вашу подписку на ${socialNetwork}... (это заглушка)`);
    
    // В будущем здесь будет вызов API:
    // const response = await checkSocialSubscription(userData.telegramId, socialNetwork);
    // alert(response.message);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Задания за баллы</h1>
      <p>Выполняйте простые задания и получайте бонусные баллы!</p>
      
      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
        <h3>Подписка на Telegram-канал</h3>
        <p>Подпишитесь на наш <a href="https://t.me/farolero_world" target="_blank" rel="noopener noreferrer">Telegram-канал</a> и получите 100 баллов.</p>
        <button onClick={() => handleCheckSubscription('telegram')}>Я подписался!</button>
      </div>

      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
        <h3>Подписка на VK</h3>
        <p>Подпишитесь на нашу <a href="https://vk.com/farolero.world" target="_blank" rel="noopener noreferrer">группу ВКонтакте</a> и получите 100 баллов.</p>
        <button onClick={() => handleCheckSubscription('vk')}>Я подписался!</button>
      </div>
    </div>
  );
};
export default TasksPage;