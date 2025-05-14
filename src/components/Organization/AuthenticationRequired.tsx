
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export function AuthenticationRequired() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-amber-600">
          <AlertTriangle className="h-5 w-5 mr-2" /> 
          Authentication Required
        </CardTitle>
        <CardDescription>
          You need to be logged in to view organization settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Not Authenticated</AlertTitle>
          <AlertDescription>
            Please sign in to access your organization settings.
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.href = "/auth"}>
          Go to Login
        </Button>
      </CardContent>
    </Card>
  );
}
