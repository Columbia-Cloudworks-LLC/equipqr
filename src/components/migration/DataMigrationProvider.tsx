
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from '@/contexts/SessionContext';

interface DataMigrationContextType {
  useSupabaseData: boolean;
  toggleDataSource: () => void;
  isReady: boolean;
}

const DataMigrationContext = createContext<DataMigrationContextType | undefined>(undefined);

export const useDataMigration = () => {
  const context = useContext(DataMigrationContext);
  if (context === undefined) {
    throw new Error('useDataMigration must be used within a DataMigrationProvider');
  }
  return context;
};

interface DataMigrationProviderProps {
  children: React.ReactNode;
}

export const DataMigrationProvider: React.FC<DataMigrationProviderProps> = ({ children }) => {
  const { sessionData, isLoading } = useSession();
  const [useSupabaseData, setUseSupabaseData] = useState(false);

  // Check if we have valid session data and should use Supabase
  useEffect(() => {
    if (!isLoading && sessionData?.currentOrganizationId) {
      // Only switch to Supabase if we have valid session data
      setUseSupabaseData(true);
    } else if (!isLoading && !sessionData) {
      // Fall back to mock data if no session
      setUseSupabaseData(false);
    }
  }, [isLoading, sessionData]);

  const toggleDataSource = () => {
    setUseSupabaseData(prev => !prev);
  };

  const isReady = !isLoading;

  return (
    <DataMigrationContext.Provider value={{
      useSupabaseData,
      toggleDataSource,
      isReady
    }}>
      {children}
    </DataMigrationContext.Provider>
  );
};
