// frontend/src/App.tsx
// ЧИСТАЯ АРХИТЕКТУРА БЕЗ БЕСКОНЕЧНЫХ ЦИКЛОВ

import { useEffect, useCallback, useMemo, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ReferralPage from './pages/ReferralPage';
import WalkDetailsPage from './pages/WalkDetailsPage';
import AdminPage from './pages/AdminPage';
import TasksPage from './pages/TasksPage';
import { useTelegram } from './hooks/useTelegram';
import TabBar from './components/TabBar';
import { UserProvider } from './context/UserContextProvider';
import { useUser } from './hooks/useUser';
import { fetchUserData } from './api';

function AppContent() {
  const { tg, user } = useTelegram();
  const { setUserData, setLoading } = useUser();
  const [isInitialized, setIsInitialized] = useState(false);

  // Мемоизация telegramId - стабильное значение
  const telegramId = useMemo(() => user?.id || 5059160861, [user?.id]);

  // Мемоизация referrerId - стабильное значение
  const referrerId = useMemo(() => {
    const startParam = tg.initDataUnsafe?.start_param;
    if (startParam && startParam.startsWith('ref_')) {
      return startParam.replace('ref_', '');
    }
    return null;
  }, [tg.initDataUnsafe?.start_param]);

  // Инициализация Telegram (только один раз)
  useEffect(() => {
    if (!isInitialized) {
      console.log('[App] 🚀 Инициализирую Telegram WebApp');
      tg.ready();
      tg.expand();
      setIsInitialized(true);
    }
  }, [tg, isInitialized]);

  // Мемоизация загрузки данных пользователя
  const loadUserData = useCallback(async () => {
    if (!telegramId) return;

    console.log(`[App] 📡 Загружаю данные для Telegram ID: ${telegramId}`);
    setLoading(true);

    try {
      const data = await fetchUserData(telegramId, referrerId);
      if (data) {
        setUserData({ ...data, telegramId });
        console.log('[App] ✅ Данные пользователя успешно загружены');
      }
    } catch (error) {
      console.error('[App] ❌ Ошибка при загрузке данных пользователя:', error);
    } finally {
      setLoading(false);
    }
  }, [telegramId, referrerId, setUserData, setLoading]);

  // Загрузка данных пользователя (только при изменении telegramId или referrerId)
  useEffect(() => {
    if (isInitialized && telegramId) {
      loadUserData();
    }
  }, [isInitialized, telegramId, referrerId, loadUserData]);

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