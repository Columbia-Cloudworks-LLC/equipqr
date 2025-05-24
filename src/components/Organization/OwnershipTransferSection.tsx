
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Users, Crown, Clock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface Manager {
  user_id: string;
  display_name: string;
  email: string;
  role: string;
  is_current_user: boolean;
}

interface Transfer {
  id: string;
  to_user_id: string;
  status: string;
  initiated_at: string;
  expires_at: string;
  transfer_reason: string;
}

export function OwnershipTransferSection() {
  const { selectedOrganization } = useOrganization();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<Transfer[]>([]);
  const [selectedManager, setSelectedManager] = useState<string>('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (selectedOrganization?.id) {
      fetchManagers();
      fetchPendingTransfers();
    }
  }, [selectedOrganization?.id]);

  const fetchManagers = async () => {
    if (!selectedOrganization?.id) return;

    try {
      const { data, error } = await supabase
        .rpc('get_org_managers', { p_org_id: selectedOrganization.id });

      if (error) throw error;
      setManagers(data || []);
    } catch (error) {
      console.error('Error fetching managers:', error);
      toast.error('Failed to load organization managers');
    }
  };

  const fetchPendingTransfers = async () => {
    if (!selectedOrganization?.id) return;

    try {
      const { data, error } = await supabase
        .from('organization_transfers')
        .select('*')
        .eq('org_id', selectedOrganization.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (error) throw error;
      setPendingTransfers(data || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateTransfer = async () => {
    if (!selectedManager) {
      toast.error('Please select a manager to transfer ownership to');
      return;
    }

    setIsTransferring(true);
    try {
      const { data, error } = await supabase.functions.invoke('transfer_organization', {
        body: {
          action: 'initiate',
          newOwnerId: selectedManager,
          reason: reason.trim() || null
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Ownership transfer initiated. The new owner will receive a notification.');
        setSelectedManager('');
        setReason('');
        fetchPendingTransfers();
      }
    } catch (error) {
      console.error('Error initiating transfer:', error);
      toast.error(error.message || 'Failed to initiate ownership transfer');
    } finally {
      setIsTransferring(false);
    }
  };

  const availableManagers = managers.filter(m => !m.is_current_user);
  const currentUser = managers.find(m => m.is_current_user);
  const isOwner = currentUser?.role === 'owner';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Ownership Transfer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isOwner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Ownership Transfer
          </CardTitle>
          <CardDescription>
            Only organization owners can transfer ownership.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to transfer organization ownership.
              Contact your organization owner if you need to transfer ownership.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Ownership Transfer
        </CardTitle>
        <CardDescription>
          Transfer ownership of your organization to another manager.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {pendingTransfers.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Pending Transfers</h4>
            {pendingTransfers.map((transfer) => {
              const manager = managers.find(m => m.user_id === transfer.to_user_id);
              return (
                <div key={transfer.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      Transfer to {manager?.display_name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Initiated {new Date(transfer.initiated_at).toLocaleDateString()}
                    </p>
                    {transfer.transfer_reason && (
                      <p className="text-xs text-muted-foreground">
                        Reason: {transfer.transfer_reason}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {availableManagers.length === 0 ? (
          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              No other managers found. You need at least one other manager in your organization
              to transfer ownership. Add managers through the team management section first.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-manager">Select new owner</Label>
              <Select value={selectedManager} onValueChange={setSelectedManager}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a manager to transfer ownership to" />
                </SelectTrigger>
                <SelectContent>
                  {availableManagers.map((manager) => (
                    <SelectItem key={manager.user_id} value={manager.user_id}>
                      <div className="flex items-center gap-2">
                        <span>{manager.display_name}</span>
                        <Badge variant="outline">{manager.role}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-reason">Reason for transfer (optional)</Label>
              <Textarea
                id="transfer-reason"
                placeholder="Explain why you're transferring ownership..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {reason.length}/500 characters
              </p>
            </div>

            <Button 
              onClick={handleInitiateTransfer}
              disabled={!selectedManager || isTransferring}
              className="w-full"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initiating Transfer...
                </>
              ) : (
                'Initiate Ownership Transfer'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
