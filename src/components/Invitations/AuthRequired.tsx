
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const AuthRequired = () => (
  <div className="flex-1 space-y-6 p-6">
    <Alert variant="destructive">
      <AlertTitle>Authentication Required</AlertTitle>
      <AlertDescription>
        You need to be logged in to view your invitations. Please sign in and try again.
      </AlertDescription>
    </Alert>
  </div>
);
