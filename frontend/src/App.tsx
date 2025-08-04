// frontend/src/App.tsx
// ПОЛНАЯ ВЕРСИЯ С НОВЫМИ МАРШРУТАМИ

import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ReferralPage from './pages/ReferralPage';
import WalkDetailsPage from './pages/WalkDetailsPage';
import AdminPage from './pages/AdminPage';   // <-- Импорт новой страницы
import TasksPage from './pages/TasksPage';   // <-- Импорт новой страницы
import { useTelegram } from './hooks/useTelegram';
import TabBar from './components/TabBar';
import { UserProvider, useUser } from './context/UserContext';
import { fetchUserData } from './api';

function AppContent() {
  const { tg, user } = useTelegram();
  const { setUserData, setLoading } = useUser();

  useEffect(() => {
    tg.ready();
    tg.expand();
    const telegramId = user?.id || 5059160861;
    if (telegramId) {
      console.log(`[App] Загружаю данные для Telegram ID: ${telegramId}`);
      fetchUserData(telegramId)
        .then(data => {
          if (data) {
            setUserData({ ...data, telegramId: telegramId });
            console.log(`[App] ✅ Данные пользователя успешно сохранены в хранилище.`);
          }
        })
        .catch(error => {
          console.error('[App] ❌ Ошибка при загрузке данных пользователя:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [tg, user]);

  return (
    <div className="app">
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/referral" element={<ReferralPage />} />
          <Route path="/walk/:id" element={<WalkDetailsPage />} />
          <Route path="/tasks" element={<TasksPage />} /> {/* <-- Новый маршрут */}
          <Route path="/admin" element={<AdminPage />} /> {/* <-- Новый маршрут */}
        </Routes>
      </main>
      <TabBar />
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <AppContent />
    </UserProvider>
  );
}

export default App;