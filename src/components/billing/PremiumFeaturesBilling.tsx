
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, MapPin, BarChart3, Zap, Plus, Minus } from 'lucide-react';
import { Organization } from '@/types/organization';

interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  monthlyCost: number;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
}

interface PremiumFeaturesBillingProps {
  organization: Organization;
  onFeatureToggle: (featureId: string, enabled: boolean) => void;
}

const PremiumFeaturesBilling: React.FC<PremiumFeaturesBillingProps> = ({
  organization,
  onFeatureToggle,
}) => {
  const [features, setFeatures] = useState<PremiumFeature[]>([
    {
      id: 'fleet-map',
      name: 'Fleet Map',
      description: 'Interactive maps showing equipment locations in real-time with GPS tracking and route optimization.',
      monthlyCost: 29,
      icon: MapPin,
      enabled: false,
    },
    {
      id: 'advanced-analytics',
      name: 'Advanced Analytics',
      description: 'Detailed reports, performance insights, predictive maintenance alerts, and custom dashboards.',
      monthlyCost: 19,
      icon: BarChart3,
      enabled: false,
    },
    {
      id: 'api-access',
      name: 'API Access',
      description: 'Full REST API access for custom integrations, webhooks, and third-party system connections.',
      monthlyCost: 15,
      icon: Zap,
      enabled: false,
    },
  ]);

  const totalFeaturesCost = features
    .filter(feature => feature.enabled)
    .reduce((sum, feature) => sum + feature.monthlyCost, 0);

  const handleToggleFeature = (featureId: string) => {
    setFeatures(prev => 
      prev.map(feature => 
        feature.id === featureId 
          ? { ...feature, enabled: !feature.enabled }
          : feature
      )
    );
    
    const feature = features.find(f => f.id === featureId);
    if (feature) {
      onFeatureToggle(featureId, !feature.enabled);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Premium Features
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Monthly Subtotal</div>
            <div className="text-lg font-bold">${totalFeaturesCost}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Add premium features to enhance your fleet management capabilities. Features can be enabled or disabled at any time.
          </div>

          <div className="grid gap-4">
            {features.map((feature) => {
              const IconComponent = feature.icon;
              
              return (
                <div
                  key={feature.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    feature.enabled ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className={`mt-1 ${feature.enabled ? 'text-primary' : 'text-muted-foreground'}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{feature.name}</h4>
                          <Badge variant={feature.enabled ? 'default' : 'outline'}>
                            {feature.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="font-mono text-sm font-medium">
                            ${feature.monthlyCost}/month
                          </span>
                          {feature.enabled && (
                            <span className="text-xs text-muted-foreground">
                              (Currently active)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant={feature.enabled ? 'destructive' : 'default'}
                      size="sm"
                      onClick={() => handleToggleFeature(feature.id)}
                      className="ml-4"
                    >
                      {feature.enabled ? (
                        <>
                          <Minus className="mr-2 h-4 w-4" />
                          Unsubscribe
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Subscribe
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {features.filter(f => f.enabled).length} premium features enabled
            </div>
            <div className="text-lg font-bold">
              Features Subtotal: ${totalFeaturesCost}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PremiumFeaturesBilling;
