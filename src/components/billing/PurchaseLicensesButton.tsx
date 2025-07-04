import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useUnifiedOrganization } from '@/contexts/UnifiedOrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PurchaseLicensesButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const PurchaseLicensesButton: React.FC<PurchaseLicensesButtonProps> = ({
  variant = "default",
  size = "default",
  className = ""
}) => {
  const { currentOrganization } = useUnifiedOrganization();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    if (!currentOrganization) {
      toast.error('No organization selected');
      return;
    }

    try {
      setIsPurchasing(true);
      toast.loading('Opening Stripe checkout...');
      
      // Use default quantity of 5 licenses for simplicity
      const { data, error } = await supabase.functions.invoke('purchase-user-licenses', {
        body: { 
          quantity: 5, 
          organizationId: currentOrganization.id 
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Open Stripe checkout in a new tab
      window.open(data.url, '_blank');
      toast.success('Redirecting to Stripe checkout...');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create checkout';
      console.error('Error creating license checkout:', err);
      toast.error(errorMessage);
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handlePurchase}
      disabled={isPurchasing}
    >
      <ShoppingCart className="h-4 w-4 mr-2" />
      {isPurchasing ? 'Processing...' : 'Purchase Licenses'}
    </Button>
  );
};

export default PurchaseLicensesButton;