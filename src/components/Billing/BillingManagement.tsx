
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Download, Eye, AlertTriangle } from 'lucide-react';
import { useStorageUsage } from '@/hooks/useStorageUsage';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function BillingManagement() {
  const { selectedOrganization } = useOrganization();
  const { storageUsage, billingHistory, isLoading, error, userRole, refreshUsage } = useStorageUsage();
  const [isManagingBilling, setIsManagingBilling] = React.useState(false);

  const isOwner = userRole === 'owner';

  const handleManageBilling = async () => {
    if (!selectedOrganization || !isOwner) {
      toast.error('Only organization owners can manage billing');
      return;
    }

    try {
      setIsManagingBilling(true);
      
      const { data, error } = await supabase.functions.invoke('manage-billing-portal', {
        body: { org_id: selectedOrganization.id }
      });

      if (error) {
        console.error('Billing portal error:', error);
        toast.error(error.message || 'Failed to access billing portal');
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        toast.error('Failed to create billing portal session');
      }

    } catch (err) {
      console.error('Error accessing billing portal:', err);
      toast.error('Failed to access billing portal');
    } finally {
      setIsManagingBilling(false);
    }
  };

  const handleDownloadInvoice = async (billingId: string) => {
    if (!isOwner) {
      toast.error('Only organization owners can download invoices');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('download-invoice', {
        body: { billing_id: billingId }
      });

      if (error) {
        console.error('Invoice download error:', error);
        toast.error('Failed to download invoice');
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }

    } catch (err) {
      console.error('Error downloading invoice:', err);
      toast.error('Failed to download invoice');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Management</CardTitle>
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
          <CardTitle>Billing Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={refreshUsage} variant="outline">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Billing Management
            {!isOwner && (
              <Badge variant="secondary" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Owner Only
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isOwner ? (
            <div className="text-center p-6 bg-amber-50 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <h3 className="font-semibold text-amber-800 mb-2">Access Restricted</h3>
              <p className="text-amber-700 text-sm">
                Only organization owners can manage billing settings and view payment history.
                Contact your organization owner to make billing changes.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-blue-900">Billing Portal</h3>
                  <p className="text-blue-700 text-sm">
                    Manage payment methods, view invoices, and update billing information
                  </p>
                </div>
                <Button 
                  onClick={handleManageBilling}
                  disabled={isManagingBilling}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isManagingBilling ? 'Opening...' : 'Manage Billing'}
                </Button>
              </div>

              {billingHistory.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Recent Invoices</h4>
                  <div className="space-y-2">
                    {billingHistory.slice(0, 5).map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">
                                Storage Overage - {record.overage_gb.toFixed(3)} GB
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(record.billing_period_start).toLocaleDateString()} - {new Date(record.billing_period_end).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-medium">${(record.overage_amount_cents / 100).toFixed(2)}</p>
                            <Badge 
                              variant={record.status === 'paid' ? 'default' : 
                                       record.status === 'pending' ? 'secondary' : 'destructive'}
                              className="text-xs"
                            >
                              {record.status}
                            </Badge>
                          </div>
                          {record.status === 'paid' && (
                            <Button
                              onClick={() => handleDownloadInvoice(record.id)}
                              size="sm"
                              variant="outline"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
