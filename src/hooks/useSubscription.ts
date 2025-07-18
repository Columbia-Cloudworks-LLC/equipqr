
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = async () => {
    if (!user) {
      setSubscriptionData(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      setIsLoading(true);

      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        throw new Error(error.message);
      }

      setSubscriptionData(data);
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to check subscription');
      
      // Try to get cached data from local subscribers table
      if (user) {
        const { data: cachedData } = await supabase
          .from('subscribers')
          .select('subscribed, subscription_tier, subscription_end')
          .eq('user_id', user.id)
          .single();
        
        if (cachedData) {
          setSubscriptionData(cachedData);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createCheckout = async (priceId: string, organizationId?: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('create-checkout', {
      body: { priceId, organizationId }
    });

    if (error) {
      throw new Error(error.message);
    }

    // Open Stripe checkout in a new tab
    window.open(data.url, '_blank');
    
    return data;
  };

  const openCustomerPortal = async () => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('customer-portal');

    if (error) {
      throw new Error(error.message);
    }

    // Open customer portal in a new tab
    window.open(data.url, '_blank');
  };

  const purchaseUserLicenses = async (quantity: number, organizationId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase.functions.invoke('purchase-user-licenses', {
      body: { quantity, organizationId }
    });

    if (error) {
      throw new Error(error.message);
    }

    // Open Stripe checkout in a new tab
    window.open(data.url, '_blank');
    
    return data;
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  return {
    subscriptionData,
    isLoading,
    error,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    purchaseUserLicenses,
    isSubscribed: subscriptionData?.subscribed || false,
    subscriptionTier: subscriptionData?.subscription_tier,
    subscriptionEnd: subscriptionData?.subscription_end,
  };
};
