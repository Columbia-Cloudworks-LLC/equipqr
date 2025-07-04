import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, ExternalLink } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

interface ManageSubscriptionButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  children?: React.ReactNode;
}

const ManageSubscriptionButton: React.FC<ManageSubscriptionButtonProps> = ({
  variant = "outline",
  size = "default",
  className = "",
  children
}) => {
  const { openCustomerPortal, isSubscribed } = useSubscription();
  const [isOpening, setIsOpening] = useState(false);

  const handleManageSubscription = async () => {
    try {
      setIsOpening(true);
      toast.loading('Opening Stripe Customer Portal...');
      await openCustomerPortal();
      toast.success('Redirecting to subscription management...');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to open customer portal';
      console.error('Error opening customer portal:', err);
      toast.error(errorMessage);
    } finally {
      setIsOpening(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleManageSubscription}
      disabled={isOpening}
    >
      <Settings className="h-4 w-4 mr-2" />
      {children || (isOpening ? 'Opening...' : 'Manage Subscription')}
      <ExternalLink className="h-3 w-3 ml-2" />
    </Button>
  );
};

export default ManageSubscriptionButton;