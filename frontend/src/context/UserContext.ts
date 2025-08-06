// frontend/src/context/UserContext.ts

import { createContext } from 'react';
import type { UserContextType } from './UserContextProvider'; // Adjust path as needed

export const UserContext = createContext<UserContextType | undefined>(undefined);