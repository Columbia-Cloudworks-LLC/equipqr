
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, MapPin, Users, Zap } from 'lucide-react';
import { useEnhancedFeatureAccess } from '@/hooks/useEnhancedFeatureAccess';
import { useOrganization } from '@/contexts/OrganizationContext';
import { OrganizationTransitionLoader } from '@/components/Organization/OrganizationTransitionLoader';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useState } from 'react';

interface FeaturePaywallProps {
  featureKey: string;
  featureName: string;
  children: React.ReactNode;
}

export function FeaturePaywall({ featureKey, featureName, children }: FeaturePaywallProps) {
  const { selectedOrganization } = useOrganization();
  const { hasAccess, isLoading, isOrgTransitioning } = useEnhancedFeatureAccess(featureKey);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  if (isLoading || isOrgTransitioning) {
    return <OrganizationTransitionLoader message="Checking feature access..." showCard={false} />;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  const handleUpgrade = async () => {
    if (!selectedOrganization) {
      toast.error('Please select an organization first');
      return;
    }

    setIsCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          feature_key: featureKey,
          org_id: selectedOrganization.id
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to start upgrade process. Please try again.');
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const getFeatureDetails = () => {
    switch (featureKey) {
      case 'fleet_map':
        return {
          icon: <MapPin className="h-8 w-8 text-blue-500" />,
          description: 'Advanced fleet mapping with real-time equipment tracking and location analytics',
          price: '$10/month',
          priceDescription: 'Flat organizational fee',
          benefits: [
            'Real-time equipment location tracking',
            'Interactive fleet map visualization',
            'Location-based equipment analytics',
            'Advanced mapping features'
          ]
        };
      default:
        return {
          icon: <Zap className="h-8 w-8 text-yellow-500" />,
          description: 'Unlock premium features for your organization',
          price: 'Contact Sales',
          priceDescription: 'Custom pricing',
          benefits: ['Premium features', 'Advanced functionality', 'Enhanced capabilities']
        };
    }
  };

  const featureDetails = getFeatureDetails();

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {featureDetails.icon}
          </div>
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="h-5 w-5" />
            {featureName}
          </CardTitle>
          <CardDescription>
            {featureDetails.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">
              {featureDetails.price}
            </div>
            <div className="text-sm text-muted-foreground">
              {featureDetails.priceDescription}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-sm">What you'll get:</h4>
            <ul className="space-y-2">
              {featureDetails.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <Button 
            onClick={handleUpgrade}
            className="w-full"
            disabled={isCheckoutLoading}
          >
            {isCheckoutLoading ? 'Setting up...' : `Upgrade to ${featureName}`}
          </Button>

          <div className="text-center">
            <Badge variant="outline" className="text-xs">
              <Users className="h-3 w-3 mr-1" />
              Organization Add-on
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
