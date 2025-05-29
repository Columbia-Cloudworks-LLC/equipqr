
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface BillingRecord {
  id: string;
  overage_gb: number;
  overage_amount_cents: number;
  status: string;
  billing_period_start: string;
  billing_period_end: string;
}

interface BillingInvoicesListProps {
  billingHistory: BillingRecord[];
}

export function BillingInvoicesList({ billingHistory }: BillingInvoicesListProps) {
  const [downloadingInvoices, setDownloadingInvoices] = useState<Set<string>>(new Set());

  const handleDownloadInvoice = async (billingId: string) => {
    try {
      setDownloadingInvoices(prev => new Set(prev).add(billingId));
      
      const { data, error } = await supabase.functions.invoke('download-invoice', {
        body: { billing_id: billingId }
      });

      if (error) {
        console.error('Invoice download error:', error);
        toast.error('Failed to download invoice');
        return;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      }

    } catch (err) {
      console.error('Error downloading invoice:', err);
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingInvoices(prev => {
        const next = new Set(prev);
        next.delete(billingId);
        return next;
      });
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="font-semibold">Recent Invoices</h4>
      <div className="space-y-2">
        {billingHistory.map((record) => (
          <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium">
                    Storage Overage - {record.overage_gb.toFixed(3)} GB
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(record.billing_period_start).toLocaleDateString()} - {new Date(record.billing_period_end).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-medium">${(record.overage_amount_cents / 100).toFixed(2)}</p>
                <Badge 
                  variant={record.status === 'paid' ? 'default' : 
                           record.status === 'pending' ? 'secondary' : 'destructive'}
                  className="text-xs"
                >
                  {record.status}
                </Badge>
              </div>
              {record.status === 'paid' && (
                <Button
                  onClick={() => handleDownloadInvoice(record.id)}
                  size="sm"
                  variant="outline"
                  disabled={downloadingInvoices.has(record.id)}
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
