
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, CreditCard } from 'lucide-react';
import { useGracePeriod } from '@/hooks/useGracePeriod';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

export function GracePeriodBanner() {
  const { gracePeriodInfo, isLoading } = useGracePeriod();
  const { selectedOrganization } = useOrganization();
  const [isUpgrading, setIsUpgrading] = React.useState(false);

  // Don't show banner if loading or no grace period
  if (isLoading || !gracePeriodInfo?.has_grace_period || !gracePeriodInfo?.is_active) {
    return null;
  }

  const daysRemaining = gracePeriodInfo.days_remaining || 0;
  const isUrgent = daysRemaining <= 7;

  const handleUpgrade = async () => {
    if (!selectedOrganization) {
      toast.error('No organization selected');
      return;
    }

    try {
      setIsUpgrading(true);
      
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          feature_key: 'fleet_map',
          org_id: selectedOrganization.id
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
      toast.error('Failed to start subscription process');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Alert className={`mb-6 ${isUrgent ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
      <div className="flex items-start gap-3">
        {isUrgent ? (
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
        ) : (
          <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
        )}
        <div className="flex-1">
          <AlertDescription className={isUrgent ? 'text-red-800' : 'text-amber-800'}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold mb-1">
                  {isUrgent ? 'Action Required' : 'Subscription Grace Period'}
                </p>
                <p className="text-sm">
                  You have <strong>{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</strong> remaining 
                  in your grace period to set up a subscription for premium features like Fleet Map.
                  {isUrgent && ' After this period, access to premium features will be restricted.'}
                </p>
              </div>
              <Button 
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className={`ml-4 ${isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
                size="sm"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isUpgrading ? 'Starting...' : 'Subscribe Now'}
              </Button>
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}
