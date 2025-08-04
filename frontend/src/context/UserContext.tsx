// frontend/src/context/UserContext.tsx
// ИСПРАВЛЕННАЯ ВЕРСИЯ

import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react'; // <-- Импортируем ReactNode как тип

// Описываем, какие данные мы будем хранить
interface UserData {
  telegramId: number | string | null;
  points: number;
  status: string;
  referralLink: string;
}

// Описываем, что будет доступно из нашего хранилища
interface UserContextType {
  userData: UserData;
  setUserData: (data: Partial<UserData>) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

// Создаем сам Контекст (хранилище)
const UserContext = createContext<UserContextType | undefined>(undefined);

// Создаем "Провайдер" - компонент, который будет "раздавать" эти данные
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userData, setUserDataState] = useState<UserData>({
    telegramId: null,
    points: 0,
    status: '...',
    referralLink: ''
  });
  const [loading, setLoading] = useState(true);

  const setUserData = (data: Partial<UserData>) => {
    setUserDataState(prev => ({ ...prev, ...data }));
  };

  return (
    <UserContext.Provider value={{ userData, setUserData, loading, setLoading }}>
      {children}
    </UserContext.Provider>
  );
};

// Создаем кастомный хук для удобного получения данных в других компонентах
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};