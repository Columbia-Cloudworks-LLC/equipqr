
import React from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface AdminAccessControlProps {
  children: React.ReactNode;
  requiredRole?: 'owner' | 'manager';
}

export function AdminAccessControl({ children, requiredRole = 'owner' }: AdminAccessControlProps) {
  const { selectedOrganization } = useOrganization();

  // Check if user has required permissions
  const hasAccess = selectedOrganization?.role === requiredRole || 
    (requiredRole === 'manager' && selectedOrganization?.role === 'owner');

  if (!hasAccess) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Access denied. You must be an organization {requiredRole} to access this admin feature.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
