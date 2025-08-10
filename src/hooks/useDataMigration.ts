import { useContext } from 'react';
import { DataMigrationContext } from '@/components/migration/DataMigrationProvider';

export const useDataMigration = () => {
  const context = useContext(DataMigrationContext);
  if (context === undefined) {
    throw new Error('useDataMigration must be used within a DataMigrationProvider');
  }
  return context;
};