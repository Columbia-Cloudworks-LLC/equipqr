
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Users, CreditCard, Check, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { toast } from 'sonner';

interface FeaturePaywallProps {
  featureKey: string;
  featureName: string;
  description: string;
  benefits: string[];
  icon?: React.ReactNode;
  userRole?: string;
  gracePeriodInfo?: any;
}

export function FeaturePaywall({ 
  featureKey, 
  featureName, 
  description, 
  benefits, 
  icon,
  userRole,
  gracePeriodInfo 
}: FeaturePaywallProps) {
  const { selectedOrganization } = useOrganization();
  const [isLoading, setIsLoading] = React.useState(false);

  const handleUpgrade = async () => {
    if (!selectedOrganization) {
      toast.error('No organization selected');
      return;
    }

    if (!['owner', 'manager'].includes(userRole || '')) {
      toast.error('Only owners and managers can manage subscriptions');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Starting subscription checkout for:', { featureKey, orgId: selectedOrganization.id });

      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          feature_key: featureKey,
          org_id: selectedOrganization.id
        }
      });

      if (error) {
        console.error('Checkout error:', error);
        toast.error(error.message || 'Failed to start checkout process');
        return;
      }

      if (data?.url) {
        console.log('Redirecting to Stripe checkout:', data.url);
        window.open(data.url, '_blank');
      } else {
        toast.error('Failed to create checkout session');
      }

    } catch (err) {
      console.error('Error creating checkout:', err);
      toast.error('Failed to start subscription process');
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = () => {
    if (icon) return icon;
    if (featureKey === 'fleet_map') return <MapPin className="h-8 w-8 text-blue-600" />;
    return <CreditCard className="h-8 w-8 text-blue-600" />;
  };

  const canManage = ['owner', 'manager'].includes(userRole || '');
  const hasGracePeriod = gracePeriodInfo?.has_grace_period && gracePeriodInfo?.is_active;
  const daysRemaining = gracePeriodInfo?.days_remaining || 0;
  const isUrgent = daysRemaining <= 7;

  return (
    <Card className="max-w-2xl mx-auto">
      {hasGracePeriod && (
        <div className={`p-4 border-b ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center gap-2">
            {isUrgent ? (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            ) : (
              <Clock className="h-5 w-5 text-amber-600" />
            )}
            <div className={`flex-1 ${isUrgent ? 'text-red-800' : 'text-amber-800'}`}>
              <p className="font-semibold">Grace Period Active</p>
              <p className="text-sm">
                You have {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining to subscribe before losing access to premium features.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>
        <CardTitle className="text-2xl flex items-center justify-center gap-2">
          {featureName}
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Premium
          </Badge>
        </CardTitle>
        <p className="text-muted-foreground mt-2">
          {description}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            What you'll get:
          </h3>
          <ul className="space-y-2">
            {benefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-blue-900">Pricing</h4>
              <p className="text-blue-700 text-sm">$10 per user per month</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900">$10</div>
              <div className="text-xs text-blue-600">per user/month</div>
            </div>
          </div>
        </div>

        {canManage ? (
          <Button 
            onClick={handleUpgrade} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Starting checkout...' : `Upgrade to unlock ${featureName}`}
          </Button>
        ) : (
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <p className="text-amber-800 text-sm">
              Only organization owners and managers can upgrade features.
              Contact your administrator to unlock {featureName}.
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Secure payment processing by Stripe. Cancel anytime.
        </p>
      </CardContent>
    </Card>
  );
}
