
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Users, AlertTriangle, Info } from 'lucide-react';
import { InvitationBillingImpact } from '@/services/billing/billingContextService';

interface BillingConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  billingImpact: InvitationBillingImpact;
  invitationCount: number;
  isLoading?: boolean;
}

export function BillingConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  billingImpact,
  invitationCount,
  isLoading = false
}: BillingConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Billing Impact
          </DialogTitle>
          <DialogDescription>
            Review the billing implications of sending {invitationCount} invitation{invitationCount !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert variant={billingImpact.will_be_charged ? "destructive" : "default"}>
            <div className="flex items-center gap-2">
              {billingImpact.will_be_charged ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Info className="h-4 w-4" />
              )}
            </div>
            <AlertDescription>
              {billingImpact.message}
            </AlertDescription>
          </Alert>
          
          {billingImpact.total_monthly_increase > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Monthly increase:</span>
                <span className="font-semibold text-gray-900">
                  ${billingImpact.total_monthly_increase}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Per user cost:</span>
                <span className="text-gray-700">
                  ${billingImpact.cost_per_invitation}/month
                </span>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>Viewer roles are always free</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            variant={billingImpact.will_be_charged ? "destructive" : "default"}
          >
            {isLoading ? 'Sending...' : 'Send Invitation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
