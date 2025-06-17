
import React, { createContext, useContext, useState, useEffect } from 'react';

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

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock user data - in a real app this would come from authentication
    const mockUser: User = {
      id: 'user-1',
      email: 'john.smith@example.com',
      name: 'John Smith'
    };
    
    setCurrentUser(mockUser);
    setIsLoading(false);
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, isLoading, setCurrentUser }}>
      {children}
    </UserContext.Provider>
  );
};
