
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export function BillingPortalAccess() {
  const { selectedOrganization } = useOrganization();
  const [isManagingBilling, setIsManagingBilling] = useState(false);

  const handleManageBilling = async () => {
    if (!selectedOrganization) {
      toast.error('No organization selected');
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

  return (
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
  );
}
