
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { HardDrive, AlertTriangle, CreditCard, RefreshCw } from 'lucide-react';
import { useStorageUsage } from '@/hooks/useStorageUsage';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export function StorageUsageCard() {
  const { selectedOrganization } = useOrganization();
  const { storageUsage, billingHistory, isLoading, error, userRole, refreshUsage } = useStorageUsage();
  const [isPayingOverage, setIsPayingOverage] = React.useState(false);

  const handlePayOverage = async () => {
    if (!selectedOrganization || !storageUsage?.has_overage) {
      return;
    }

    if (!['owner', 'manager'].includes(userRole || '')) {
      toast.error('Only owners and managers can manage billing');
      return;
    }

    try {
      setIsPayingOverage(true);
      
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data, error } = await supabase.functions.invoke('create-storage-overage-checkout', {
        body: {
          org_id: selectedOrganization.id,
          overage_gb: storageUsage.overage_gb,
          billing_period_start: periodStart.toISOString(),
          billing_period_end: periodEnd.toISOString()
        }
      });

      if (error) {
        console.error('Checkout error:', error);
        toast.error(error.message || 'Failed to start checkout process');
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        toast.error('Failed to create checkout session');
      }

    } catch (err) {
      console.error('Error creating checkout:', err);
      toast.error('Failed to start payment process');
    } finally {
      setIsPayingOverage(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refreshUsage} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!storageUsage) {
    return null;
  }

  const isNearLimit = storageUsage.used_percentage > 80;
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Usage
          </div>
          <Button onClick={refreshUsage} variant="ghost" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Used: {storageUsage.total_gb.toFixed(2)} GB</span>
            <span>Limit: {storageUsage.free_gb} GB</span>
          </div>
          <Progress 
            value={Math.min(storageUsage.used_percentage, 100)} 
            className={`h-2 ${storageUsage.has_overage ? 'bg-red-100' : isNearLimit ? 'bg-amber-100' : ''}`}
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{storageUsage.used_percentage.toFixed(1)}% used</span>
            {storageUsage.has_overage && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Over Limit
              </Badge>
            )}
          </div>
        </div>

        {storageUsage.has_overage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-red-900 text-sm">Storage Overage</h4>
                <p className="text-red-700 text-sm mt-1">
                  You've exceeded your 5GB storage limit by {storageUsage.overage_gb.toFixed(3)} GB.
                </p>
                <p className="text-red-600 text-xs mt-1">
                  Overage charge: ${(storageUsage.overage_amount_cents / 100).toFixed(2)} ($0.10 per GB)
                </p>
              </div>
              {['owner', 'manager'].includes(userRole || '') && (
                <Button 
                  onClick={handlePayOverage}
                  disabled={isPayingOverage}
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isPayingOverage ? 'Processing...' : 'Pay Overage'}
                </Button>
              )}
            </div>
          </div>
        )}

        {isNearLimit && !storageUsage.has_overage && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-amber-900 text-sm">Approaching Limit</h4>
            <p className="text-amber-700 text-sm mt-1">
              You're using {storageUsage.used_percentage.toFixed(1)}% of your storage. 
              Consider managing your images to avoid overage charges.
            </p>
          </div>
        )}

        {billingHistory.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-sm mb-3">Recent Billing History</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {billingHistory.slice(0, 3).map((record) => (
                <div key={record.id} className="flex justify-between items-center text-sm">
                  <div>
                    <span className="font-medium">{record.overage_gb.toFixed(3)} GB</span>
                    <span className="text-muted-foreground ml-2">
                      {new Date(record.billing_period_start).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>${(record.overage_amount_cents / 100).toFixed(2)}</span>
                    <Badge 
                      variant={record.status === 'paid' ? 'default' : 
                               record.status === 'pending' ? 'secondary' : 'destructive'}
                      className="text-xs"
                    >
                      {record.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
