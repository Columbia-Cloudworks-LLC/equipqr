import React from 'react';
import { Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import Customers from '@/pages/Customers';
import { useCustomersFeature } from '@/hooks/useCustomersFeature';

export const ConditionalCustomersRoute: React.FC = () => {
  const { isEnabled: customersEnabled } = useCustomersFeature();
  
  if (!customersEnabled) {
    return <Navigate to="/" replace />;
  }
  
  return (
    <AppLayout>
      <Customers />
    </AppLayout>
  );
};