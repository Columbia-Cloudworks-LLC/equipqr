
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface InvitationErrorProps {
  error: string;
  suggestion?: string; // Added suggestion as an optional prop
}

export function InvitationError({ error, suggestion }: InvitationErrorProps) {
  const navigate = useNavigate();
  
  const handleLoginClick = () => {
    // Get any stored invitation path
    const invitationPath = sessionStorage.getItem('invitationPath');
    
    navigate('/auth', { 
      state: { 
        returnTo: invitationPath || '/',
        message: 'Please sign in or create an account to accept this invitation',
        isInvitation: true
      } 
    });
  };
  
  return (
    <div className="container mx-auto max-w-md my-12">
      <Card>
        <CardHeader>
          <CardTitle>Invitation Error</CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
          {suggestion && (
            <CardDescription className="mt-2">
              {suggestion}
            </CardDescription>
          )}
        </CardHeader>
        <CardFooter className="flex flex-col gap-2 w-full">
          <Button onClick={handleLoginClick} className="w-full">
            Sign In or Create Account
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className="w-full">
            Go to Homepage
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
