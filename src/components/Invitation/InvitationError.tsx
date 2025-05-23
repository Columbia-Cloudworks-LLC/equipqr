
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface InvitationErrorProps {
  error: string;
  suggestion?: string; // Added suggestion as an optional prop
  isAuthError?: boolean; // Flag to indicate if the error is due to authentication
  token?: string; // Invitation token if available
  invitationType?: string; // Type of invitation
}

export function InvitationError({ 
  error, 
  suggestion, 
  isAuthError = false,
  token,
  invitationType = 'team'
}: InvitationErrorProps) {
  const navigate = useNavigate();
  
  const handleLoginClick = () => {
    // Store the invitation details in session storage
    if (token) {
      sessionStorage.setItem('invitationPath', `/invitation/${token}${invitationType === 'organization' ? '?type=organization' : ''}`);
      sessionStorage.setItem('invitationType', invitationType);
    }
    
    // Navigate to auth with contextual information
    navigate('/auth', { 
      state: { 
        returnTo: token ? `/invitation/${token}${invitationType === 'organization' ? '?type=organization' : ''}` : '/',
        message: 'Please sign in or create an account to accept this invitation',
        isInvitation: true,
        invitationType: invitationType as 'team' | 'organization'
      } 
    });
  };
  
  // Customize the title based on if it's an auth error
  const title = isAuthError ? "Authentication Required" : "Invitation Error";
  
  return (
    <div className="container mx-auto max-w-md my-12">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription className={isAuthError ? "text-amber-600" : "text-destructive"}>
            {error}
          </CardDescription>
          {suggestion && (
            <CardDescription className="mt-2">
              {suggestion}
            </CardDescription>
          )}
        </CardHeader>
        <CardFooter className="flex flex-col gap-2 w-full">
          <Button onClick={handleLoginClick} className="w-full">
            {isAuthError ? "Sign In or Create Account" : "Sign In to Continue"}
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className="w-full">
            Go to Homepage
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
