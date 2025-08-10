import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';

interface RestrictedBillingAccessProps {
  currentOrganizationName: string;
}

const RestrictedBillingAccess: React.FC<RestrictedBillingAccessProps> = ({
  currentOrganizationName
}) => {
  const { organizations, switchOrganization } = useSimpleOrganization();
  const navigate = useNavigate();

  // Find organizations where the user is an owner
  const ownedOrganizations = organizations.filter(org => org.userRole === 'owner');

  const handleSwitchToOwnedOrganization = () => {
    if (ownedOrganizations.length > 0) {
      const firstOwnedOrg = ownedOrganizations[0];
      switchOrganization(firstOwnedOrg.id);
      // Navigate to billing page for the organization they own
      navigate('/billing');
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Card className="border-destructive/20 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="space-y-3 flex-1">
              <div className="text-sm text-foreground">
                <strong>Access Restricted:</strong> You need to be an organization owner to manage billing. 
                Billing is tied to the owner's personal Stripe account and finances.
              </div>
              <div className="text-sm text-muted-foreground">
                Contact the organization owner if you need billing information{ownedOrganizations.length > 0 ? ', or' : '.'}
                {ownedOrganizations.length > 0 && (
                  <>
                    {' '}
                    <button
                      onClick={handleSwitchToOwnedOrganization}
                      className="text-primary underline hover:no-underline"
                    >
                      manage billing for your organization
                    </button>
                    {' '}instead.
                  </>
                )}
              </div>
              {ownedOrganizations.length > 0 && (
                <Button 
                  onClick={handleSwitchToOwnedOrganization}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Switch to {ownedOrganizations[0].name}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RestrictedBillingAccess;