
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface BillingRecord {
  id: string;
  overage_gb: number;
  overage_amount_cents: number;
  status: string;
  billing_period_start: string;
}

interface StorageBillingHistoryProps {
  billingHistory: BillingRecord[];
}

export function StorageBillingHistory({ billingHistory }: StorageBillingHistoryProps) {
  return (
    <div className="pt-4 border-t">
      <h4 className="font-semibold text-sm mb-3">Recent Billing History</h4>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {billingHistory.map((record) => (
          <div key={record.id} className="flex justify-between items-center text-sm">
            <div>
              <span className="font-medium">{record.overage_gb.toFixed(3)} GB</span>
              <span className="text-muted-foreground ml-2">
                {new Date(record.billing_period_start).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>${(record.overage_amount_cents / 100).toFixed(2)}</span>
              <Badge 
                variant={record.status === 'paid' ? 'default' : 
                         record.status === 'pending' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {record.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
