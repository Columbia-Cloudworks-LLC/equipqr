
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, ExternalLink, Check } from 'lucide-react';

interface StripeSetupProps {
  isConnected: boolean;
  onSetup: () => void;
}

const StripeSetup: React.FC<StripeSetupProps> = ({ isConnected, onSetup }) => {
  const handleStripeConnect = () => {
    // In a real app, this would redirect to Stripe Connect
    window.open('https://connect.stripe.com', '_blank');
    // Simulate connection after a delay
    setTimeout(onSetup, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Account Setup
          </div>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? 'Connected' : 'Not Connected'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-4 w-4" />
              <span>Your Stripe account is connected and ready for billing</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Stripe Dashboard
              </Button>
              <Button variant="outline" size="sm">
                Update Settings
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Connect your Stripe account to start billing your organization members and enable premium features.
            </div>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">What you'll get:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Automatic billing for organization members ($10/month per active member)</li>
                <li>• Premium feature subscriptions and management</li>
                <li>• Detailed billing history and invoices</li>
                <li>• Secure payment processing with Stripe</li>
              </ul>
            </div>
            <Button onClick={handleStripeConnect} className="w-full">
              <CreditCard className="mr-2 h-4 w-4" />
              Connect Stripe Account
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StripeSetup;
