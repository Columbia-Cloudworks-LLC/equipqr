
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface InvitationStatusCheckerProps {
  orgId?: string;
}

export function InvitationStatusChecker({ orgId }: InvitationStatusCheckerProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const checkInvitations = async () => {
    try {
      setLoading(true);
      setResults(null);

      const { data, error } = await supabase.functions.invoke('check_invitation_status', {
        body: orgId ? { org_id: orgId } : {}
      });

      if (error) {
        console.error('Error checking invitation status:', error);
        toast.error('Error', {
          description: 'Failed to check invitation status'
        });
        return;
      }

      setResults(data);
      console.log('Invitation status:', data);
      
      if (data.count === 0) {
        toast.info('No Invitations Found', {
          description: 'There are no pending invitations for your account'
        });
      } else {
        toast.success('Invitations Found', {
          description: `Found ${data.count} invitations`
        });
      }
    } catch (error) {
      console.error('Error in checkInvitations:', error);
      toast.error('Error', {
        description: 'An unexpected error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>Invitation Status Debug</CardTitle>
        <CardDescription>Check for pending invitations in the database</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={checkInvitations} 
          disabled={loading} 
          variant="secondary"
        >
          {loading ? 'Checking...' : 'Check Invitation Status'}
        </Button>
        
        {results && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Results:</h3>
            <div className="bg-muted p-3 rounded-md overflow-auto max-h-48">
              <pre className="text-xs">{JSON.stringify(results, null, 2)}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
