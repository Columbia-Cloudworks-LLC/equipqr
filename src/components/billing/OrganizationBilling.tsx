
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, HardDrive, Map, CreditCard } from 'lucide-react';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useUnifiedOrganization } from '@/contexts/UnifiedOrganizationContext';

interface OrganizationBillingProps {
  storageUsedGB: number;
  fleetMapEnabled: boolean;
  onToggleFleetMap: (enabled: boolean) => void;
}

const OrganizationBilling: React.FC<OrganizationBillingProps> = ({
  storageUsedGB,
  fleetMapEnabled,
  onToggleFleetMap
}) => {
  const { currentOrganization } = useUnifiedOrganization();
  const { data: members = [] } = useOrganizationMembers(currentOrganization?.id || '');

  // Calculate billing
  const activeMembersCount = members.filter(member => member.status === 'active').length;
  const billableMembers = Math.max(0, activeMembersCount - 1); // First user is free
  const membersCost = billableMembers * 10; // $10 per user after first

  const storageOverage = Math.max(0, storageUsedGB - 5); // 5GB free
  const storageCost = storageOverage * 0.10; // $0.10 per GB

  const fleetMapCost = fleetMapEnabled ? 10 : 0; // $10/month for Fleet Map

  const totalMonthlyCost = membersCost + storageCost + fleetMapCost;

  return (
    <div className="space-y-6">
      {/* Billing Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Monthly Billing Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">${membersCost.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">User Licenses</div>
              <div className="text-xs text-muted-foreground mt-1">
                {billableMembers} billable users × $10
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">${storageCost.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Storage Overage</div>
              <div className="text-xs text-muted-foreground mt-1">
                {storageOverage.toFixed(1)}GB × $0.10
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">${fleetMapCost.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Fleet Map Add-on</div>
              <div className="text-xs text-muted-foreground mt-1">
                {fleetMapEnabled ? 'Active' : 'Inactive'}
              </div>
            </div>
            
            <div className="text-center p-4 border-2 border-primary rounded-lg">
              <div className="text-2xl font-bold text-primary">${totalMonthlyCost.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Monthly</div>
              <div className="text-xs text-muted-foreground mt-1">
                Next billing: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Licenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Licenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Active Users</div>
                <div className="text-sm text-muted-foreground">
                  First user is free, additional users are $10/month each
                </div>
              </div>
              <Badge variant="outline">{activeMembersCount} active</Badge>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span>Free user (1st user)</span>
                <span className="font-mono">$0.00</span>
              </div>
              {billableMembers > 0 && (
                <div className="flex justify-between items-center">
                  <span>Additional users ({billableMembers})</span>
                  <span className="font-mono">${membersCost.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2 flex justify-between items-center font-semibold">
                <span>Total User Licenses</span>
                <span className="font-mono">${membersCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Current Usage</div>
                <div className="text-sm text-muted-foreground">
                  5GB included free, $0.10/GB for additional storage
                </div>
              </div>
              <Badge variant="outline">{storageUsedGB.toFixed(1)} GB used</Badge>
            </div>
            
            <div className="w-full bg-muted h-2 rounded-full">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (storageUsedGB / 10) * 100)}%` }}
              />
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span>Free storage (5GB)</span>
                <span className="font-mono">$0.00</span>
              </div>
              {storageOverage > 0 && (
                <div className="flex justify-between items-center">
                  <span>Additional storage ({storageOverage.toFixed(1)}GB)</span>
                  <span className="font-mono">${storageCost.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2 flex justify-between items-center font-semibold">
                <span>Total Storage Cost</span>
                <span className="font-mono">${storageCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Map Add-on */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Fleet Map Add-on
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Fleet Map Visualization</div>
                <div className="text-sm text-muted-foreground">
                  Interactive map showing equipment locations - $10/month
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={fleetMapEnabled ? 'default' : 'secondary'}>
                  {fleetMapEnabled ? 'Active' : 'Inactive'}
                </Badge>
                <Button
                  variant={fleetMapEnabled ? 'destructive' : 'default'}
                  size="sm"
                  onClick={() => onToggleFleetMap(!fleetMapEnabled)}
                >
                  {fleetMapEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <div className="flex justify-between items-center font-semibold">
                <span>Fleet Map Add-on</span>
                <span className="font-mono">${fleetMapCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationBilling;
