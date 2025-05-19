
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function InvalidInvitation() {
  const navigate = useNavigate();
  
  return (
    <div className="container mx-auto max-w-md my-12">
      <Card>
        <CardHeader>
          <CardTitle>Invalid Invitation</CardTitle>
          <CardDescription>The invitation could not be found or has expired.</CardDescription>
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
