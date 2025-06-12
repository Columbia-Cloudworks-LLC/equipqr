
import React from 'react';
import { Organization } from '@/types/organization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, MapPin, BarChart3, Zap } from 'lucide-react';

interface PremiumFeaturesProps {
  organization: Organization;
  onUpgrade: () => void;
}

const PremiumFeatures: React.FC<PremiumFeaturesProps> = ({
  organization,
  onUpgrade,
}) => {
  const features = [
    {
      id: 'fleet-map',
      name: 'Fleet Map',
      description: 'Interactive maps showing equipment locations in real-time',
      icon: MapPin,
      highlighted: true,
    },
    {
      id: 'advanced-analytics',
      name: 'Advanced Analytics',
      description: 'Detailed reports and insights on equipment performance',
      icon: BarChart3,
      highlighted: false,
    },
    {
      id: 'api-access',
      name: 'API Access',
      description: 'Full REST API access for custom integrations',
      icon: Zap,
      highlighted: false,
    },
  ];

  const isPremium = organization.plan === 'premium';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Premium Features
            </CardTitle>
          </div>
          <Badge variant={isPremium ? 'default' : 'secondary'}>
            {isPremium ? 'Premium' : 'Free Plan'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {features.map((feature) => {
            const IconComponent = feature.icon;
            const isAvailable = isPremium;
            
            return (
              <div
                key={feature.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  feature.highlighted && !isPremium
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
              >
                <div className={`mt-0.5 ${isAvailable ? 'text-green-600' : 'text-muted-foreground'}`}>
                  {isAvailable ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <IconComponent className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{feature.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {feature.description}
                  </div>
                </div>
                {!isPremium && feature.highlighted && (
                  <Badge variant="outline" className="text-xs">
                    Popular
                  </Badge>
                )}
              </div>
            );
          })}

          {!isPremium && (
            <div className="pt-4 border-t">
              <div className="text-center space-y-2">
                <div className="text-sm font-medium">
                  Unlock all premium features for your team
                </div>
                <div className="text-2xl font-bold">$29/month</div>
                <div className="text-xs text-muted-foreground">
                  Billed monthly • Cancel anytime
                </div>
                <Button onClick={onUpgrade} className="w-full mt-3">
                  Upgrade to Premium
                </Button>
              </div>
            </div>
          )}

          {isPremium && (
            <div className="pt-4 border-t">
              <div className="text-center space-y-2">
                <div className="text-sm font-medium text-green-600">
                  ✓ Premium Plan Active
                </div>
                <div className="text-xs text-muted-foreground">
                  Next billing: {organization.nextBillingDate}
                </div>
                <Button variant="outline" size="sm">
                  Manage Subscription
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PremiumFeatures;
