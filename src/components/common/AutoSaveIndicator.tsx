import React from 'react';
import { SaveStatus } from '@/components/ui/SaveStatus';

interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  hasChanges?: boolean;
  className?: string;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  status,
  lastSaved,
  hasChanges,
  className
}) => {
  // Don't show indicator if there are no changes and not in a save state
  if (!hasChanges && status === 'idle') {
    return null;
  }

  // Map internal status to SaveStatus component props
  const getSaveStatus = () => {
    if (status === 'saving') return 'saving';
    if (status === 'error') return 'error';
    if (status === 'saved') return 'saved';
    return navigator.onLine ? 'saved' : 'offline';
  };

  return (
    <SaveStatus
      status={getSaveStatus()}
      lastSaved={lastSaved}
      className={className}
    />
  );
};