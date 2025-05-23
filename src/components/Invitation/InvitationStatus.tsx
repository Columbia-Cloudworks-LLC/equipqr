
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function InvitationValidating() {
  return (
    <div className="container mx-auto max-w-md my-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Validating Invitation
          </CardTitle>
          <CardDescription>
            Please wait while we validate your invitation...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            This should only take a moment. If it continues for too long, try refreshing the page.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function RateLimitedState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="container mx-auto max-w-md my-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-5 w-5" />
            Request Rate Limited
          </CardTitle>
          <CardDescription>
            Too many requests were made in a short period of time.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            This can happen when the system processes too many requests at once. Please wait a moment before trying again.
          </div>
          <Button onClick={onRetry} className="w-full flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProcessingInvitation() {
  return (
    <div className="container mx-auto max-w-md my-12">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Processing Invitation
          </CardTitle>
          <CardDescription>
            Please wait while we process your invitation...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            This should only take a moment. We're setting up your access.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
