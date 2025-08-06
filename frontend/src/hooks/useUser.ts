// frontend/src/hooks/useUser.ts

import { useContext } from 'react';
import { UserContext } from '../context/UserContext';
import type { UserContextType } from '../context/UserContextProvider';

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};