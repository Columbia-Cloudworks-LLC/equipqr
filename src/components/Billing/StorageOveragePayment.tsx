
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface StorageOveragePaymentProps {
  storageUsage: {
    overage_gb: number;
    overage_amount_cents: number;
  };
  isOwner: boolean;
}

export function StorageOveragePayment({ storageUsage, isOwner }: StorageOveragePaymentProps) {
  const { selectedOrganization } = useOrganization();
  const [isPayingOverage, setIsPayingOverage] = useState(false);

  const handlePayOverage = async () => {
    if (!selectedOrganization || !storageUsage) {
      return;
    }

    if (!isOwner) {
      toast.error('Only organization owners can manage billing');
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
        if (error.message === 'access_denied' || error.message?.includes('Only organization owners')) {
          toast.error('Only organization owners can manage billing');
        } else {
          toast.error('Payment processing is temporarily unavailable. Please try again later.');
        }
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        toast.error('Payment processing is temporarily unavailable. Please try again later.');
      }

    } catch (err) {
      console.error('Error creating checkout:', err);
      toast.error('Payment processing is temporarily unavailable. Please try again later.');
    } finally {
      setIsPayingOverage(false);
    }
  };

  return (
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
          {!isOwner && (
            <p className="text-red-600 text-xs mt-2 font-medium">
              Only organization owners can pay overage charges.
            </p>
          )}
        </div>
        {isOwner && (
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
  );
}
