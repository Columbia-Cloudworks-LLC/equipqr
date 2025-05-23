
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

export function InvitationValidating() {
  return (
    <div className="container mx-auto max-w-md my-12">
      <Card>
        <CardHeader>
          <CardTitle>Checking Invitation</CardTitle>
          <CardDescription>Please wait while we validate your invitation...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}

export function InvitationProcessing() {
  return (
    <div className="container mx-auto max-w-md my-12">
      <Card>
        <CardHeader>
          <CardTitle>Processing Invitation</CardTitle>
          <CardDescription>Please wait while we add you to the team...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
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
          <CardTitle className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
            Rate Limit Reached
          </CardTitle>
          <CardDescription>
            We've detected too many requests in a short period of time. This can happen when rapidly 
            refreshing the page or when multiple processes are attempting to validate this invitation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Please wait a moment before trying again. This helps ensure our systems remain responsive for everyone.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            variant="default" 
            className="w-full" 
            onClick={onRetry}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
