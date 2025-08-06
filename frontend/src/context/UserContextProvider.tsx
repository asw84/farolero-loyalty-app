// frontend/src/context/UserContextProvider.tsx

import { useState } from 'react';
import type { ReactNode } from 'react';
import { UserContext } from './UserContext';

export interface UserData {
  telegramId: number | string | null;
  points: number;
  status: string;
  referralLink: string;
}

export interface UserContextType {
  userData: UserData;
  setUserData: (data: Partial<UserData>) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

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