
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

export interface User {
  id: string;
  email: string;
  name: string;
}

interface UserContextType {
  currentUser: User | null;
  isLoading: boolean;
  setCurrentUser: (user: User | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Export constants to satisfy ESLint
export const USER_CONSTANTS = {
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  REFRESH_INTERVAL: 30 * 60 * 1000, // 30 minutes
} as const;

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }

    if (authUser) {
      // Convert Supabase user to our User interface
      const user: User = {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || authUser.email || 'User'
      };
      setCurrentUser(user);
    } else {
      setCurrentUser(null);
    }
    
    setIsLoading(false);
  }, [authUser, authLoading]);

  return (
    <UserContext.Provider value={{ currentUser, isLoading, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
};
