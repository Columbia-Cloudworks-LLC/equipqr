
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  getBillingContext, 
  calculateInvitationImpact,
  BillingContext,
  InvitationBillingImpact 
} from '@/services/billing/billingContextService';
import { useOrganization } from '@/contexts/OrganizationContext';

export function useBillingAwareInvitations() {
  const { selectedOrganization } = useOrganization();
  const [billingContext, setBillingContext] = useState<BillingContext | null>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [pendingInvitation, setPendingInvitation] = useState<{
    callback: () => Promise<void>;
    roles: string[];
    count: number;
  } | null>(null);

  const loadBillingContext = useCallback(async () => {
    if (!selectedOrganization?.id) return null;

    setIsLoadingBilling(true);
    try {
      const context = await getBillingContext(selectedOrganization.id);
      setBillingContext(context);
      return context;
    } catch (error) {
      console.error('Error loading billing context:', error);
      toast.error('Failed to load billing information');
      return null;
    } finally {
      setIsLoadingBilling(false);
    }
  }, [selectedOrganization?.id]);

  const checkBillingImpact = useCallback(async (
    invitationCallback: () => Promise<void>,
    invitedRoles: string[] = ['manager'],
    invitationCount: number = 1
  ): Promise<void> => {
    // Load billing context if not already loaded
    let context = billingContext;
    if (!context) {
      context = await loadBillingContext();
      if (!context) return;
    }

    // Calculate billing impact
    const impact = calculateInvitationImpact(context, invitationCount, invitedRoles);

    // If no billing impact or user is on free tier, proceed directly
    if (!impact.will_be_charged && impact.total_monthly_increase === 0) {
      await invitationCallback();
      return;
    }

    // Show billing confirmation dialog
    setPendingInvitation({
      callback: invitationCallback,
      roles: invitedRoles,
      count: invitationCount
    });
    setShowBillingDialog(true);
  }, [billingContext, loadBillingContext]);

  const confirmInvitation = useCallback(async () => {
    if (!pendingInvitation) return;

    try {
      await pendingInvitation.callback();
      setShowBillingDialog(false);
      setPendingInvitation(null);
    } catch (error) {
      console.error('Error sending invitation:', error);
      // Don't close dialog on error so user can retry
    }
  }, [pendingInvitation]);

  const cancelInvitation = useCallback(() => {
    setShowBillingDialog(false);
    setPendingInvitation(null);
  }, []);

  const getBillingImpact = useCallback((): InvitationBillingImpact | null => {
    if (!billingContext || !pendingInvitation) return null;

    return calculateInvitationImpact(
      billingContext,
      pendingInvitation.count,
      pendingInvitation.roles
    );
  }, [billingContext, pendingInvitation]);

  return {
    billingContext,
    isLoadingBilling,
    showBillingDialog,
    pendingInvitation,
    billingImpact: getBillingImpact(),
    loadBillingContext,
    checkBillingImpact,
    confirmInvitation,
    cancelInvitation
  };
}
