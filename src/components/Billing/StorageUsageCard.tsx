
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { HardDrive, AlertTriangle, CreditCard, RefreshCw, Info } from 'lucide-react';
import { useStorageUsage } from '@/hooks/useStorageUsage';
import { StorageOveragePayment } from './StorageOveragePayment';
import { StorageBillingHistory } from './StorageBillingHistory';

export function StorageUsageCard() {
  const { storageUsage, billingHistory, isLoading, error, userRole, isFallback, refreshUsage } = useStorageUsage();

  const isOwner = userRole === 'owner';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-8 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!storageUsage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">Unable to load storage information</p>
            <Button onClick={refreshUsage} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isNearLimit = storageUsage.used_percentage > 80;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Storage Usage
          </div>
          <div className="flex items-center gap-2">
            {!isOwner && (
              <Badge variant="secondary" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Owner Only Billing
              </Badge>
            )}
            {isFallback && (
              <Badge variant="outline" className="text-xs">
                <Info className="h-3 w-3 mr-1" />
                Demo Mode
              </Badge>
            )}
            <Button onClick={refreshUsage} variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Used: {storageUsage.total_gb.toFixed(2)} GB</span>
            <span>Limit: {storageUsage.free_gb} GB</span>
          </div>
          <Progress 
            value={Math.min(storageUsage.used_percentage, 100)} 
            className={`h-2 ${storageUsage.has_overage ? 'bg-red-100' : isNearLimit ? 'bg-amber-100' : ''}`}
          />
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{storageUsage.used_percentage.toFixed(1)}% used</span>
            {storageUsage.has_overage && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Over Limit
              </Badge>
            )}
          </div>
        </div>

        {isFallback && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 text-sm">Demo Mode</h4>
            <p className="text-blue-700 text-sm mt-1">
              Storage billing is currently in demo mode. Actual usage calculation is temporarily unavailable.
            </p>
          </div>
        )}

        {!isFallback && storageUsage.has_overage && (
          <StorageOveragePayment 
            storageUsage={storageUsage}
            isOwner={isOwner}
          />
        )}

        {!isFallback && isNearLimit && !storageUsage.has_overage && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-semibold text-amber-900 text-sm">Approaching Limit</h4>
            <p className="text-amber-700 text-sm mt-1">
              You're using {storageUsage.used_percentage.toFixed(1)}% of your storage. 
              Consider managing your images to avoid overage charges.
            </p>
          </div>
        )}

        {!isFallback && billingHistory.length > 0 && (
          <StorageBillingHistory billingHistory={billingHistory.slice(0, 3)} />
        )}
      </CardContent>
    </Card>
  );
}
