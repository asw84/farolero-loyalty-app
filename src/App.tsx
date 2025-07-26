// src/App.tsx
import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ReferralPage from './pages/ReferralPage';
import WalkDetailsPage from './pages/WalkDetailsPage'; // <--- Импортируем новую страницу
import { useTelegram } from './hooks/useTelegram';
import TabBar from './components/TabBar';

function App() {
  const { tg } = useTelegram();

  useEffect(() => {
    tg.ready();
    tg.expand();
  }, [tg]);

  return (
    <div className="app">
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/referral" element={<ReferralPage />} />
          <Route path="/walk/:id" element={<WalkDetailsPage />} /> {/* <--- Добавляем новый маршрут */}
        </Routes>
      </main>
      <TabBar />
    </div>
  );
}

export default App;