
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Home, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface InvalidInvitationProps {
  onRetry?: () => void;
  errorMessage?: string;
}

export function InvalidInvitation({ onRetry, errorMessage }: InvalidInvitationProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto max-w-md my-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Invalid Invitation</CardTitle>
          <CardDescription>
            {errorMessage || "This invitation link is invalid or has expired."}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            The invitation link you're trying to use may have been:
          </p>
          <ul className="list-disc list-inside my-2 space-y-1">
            <li>Already accepted</li>
            <li>Expired</li>
            <li>Incorrectly copied</li>
            <li>Revoked by the sender</li>
          </ul>
          <p>
            Please contact the person who invited you for a new invitation.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 w-full">
          {onRetry && (
            <Button 
              onClick={onRetry} 
              variant="default"
              className="w-full flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
          
          {!user && (
            <Button 
              onClick={() => navigate('/auth')} 
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Button>
          )}
          
          <Button 
            onClick={() => navigate('/')} 
            variant={user ? 'outline' : 'secondary'}
            className="w-full flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Homepage
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
