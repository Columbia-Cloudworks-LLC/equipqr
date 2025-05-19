
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface InvitationErrorProps {
  error: string;
}

export function InvitationError({ error }: InvitationErrorProps) {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto max-w-md my-12">
      <Card>
        <CardHeader>
          <CardTitle>Invitation Error</CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" onClick={() => navigate('/')} className="w-full">
            Go to Homepage
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
