
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface OrganizationErrorProps {
  errorMessage: string;
  handleRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export function OrganizationError({ errorMessage, handleRefresh, isRefreshing }: OrganizationErrorProps) {
  const { user } = useAuth();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-amber-600">
          <AlertTriangle className="h-5 w-5 mr-2" /> 
          Organization Not Found
        </CardTitle>
        <CardDescription>
          {errorMessage}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error Details</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>We couldn't find an organization associated with your account or there may be an issue with your permissions.</p>
              <p className="text-sm text-muted-foreground">Possible reasons:</p>
              <ul className="text-sm list-disc pl-5 mt-1">
                <li>Your account hasn't been properly set up with an organization</li>
                <li>The organization data is missing or corrupted</li>
                <li>You need to log out and log back in to refresh your session</li>
                <li>There might be a database configuration issue</li>
              </ul>
              {user && <p className="text-sm mt-2">User ID: {user.id}</p>}
            </div>
          </AlertDescription>
        </Alert>
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} disabled={isRefreshing} className="mr-2">
            {isRefreshing ? 'Refreshing...' : 'Try Again'}
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/profile"}>
            Go to Profile
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/auth"} className="ml-auto">
            Sign Out and Back In
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
