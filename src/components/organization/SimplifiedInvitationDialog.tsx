
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from '@/contexts/SessionContext';
import { useSimpleOrganization } from '@/contexts/SimpleOrganizationContext';
import { useCreateInvitation } from '@/hooks/useOrganizationInvitations';
import { useSimplifiedOrganizationRestrictions } from '@/hooks/useSimplifiedOrganizationRestrictions';
import { useFleetMapSubscription } from '@/hooks/useFleetMapSubscription';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PurchaseLicensesLink from '@/components/billing/PurchaseLicensesLink';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const invitationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'member'], {
    required_error: 'Please select a role',
  }),
  message: z.string().optional(),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

interface SimplifiedInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const SimplifiedInvitationDialog: React.FC<SimplifiedInvitationDialogProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const { getCurrentOrganization } = useSession();
  const { currentOrganization } = useSimpleOrganization();
  const { data: fleetMapSubscription } = useFleetMapSubscription(currentOrganization?.id || '');
  const { restrictions } = useSimplifiedOrganizationRestrictions(fleetMapSubscription?.enabled || false);
  const { mutate: createInvitation, isPending } = useCreateInvitation(currentOrganization?.id || '');
  
  const sessionOrganization = getCurrentOrganization();
  const userRole = sessionOrganization?.userRole;
  const canInviteMembers = ['owner', 'admin'].includes(userRole || '');

  const form = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      email: '',
      role: 'member',
      message: '',
    },
  });

  const handleSubmit = (data: InvitationFormData) => {
    if (!canInviteMembers) {
      toast.error('Only organization owners and admins can invite members');
      return;
    }

    if (!restrictions.canInviteMembers) {
      toast.error('Your organization cannot invite members at this time');
      return;
    }

    if (!restrictions.hasAvailableSlots) {
      toast.error('No available user licenses. Purchase more licenses to invite members.');
      return;
    }

    if (!currentOrganization?.id) {
      toast.error('Organization not found');
      return;
    }

    createInvitation(
      {
        email: data.email,
        role: data.role,
        message: data.message || undefined,
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
          onSuccess?.();
          toast.success('Invitation sent successfully');
        },
        onError: (error) => {
          console.error('Failed to create invitation:', error);
          toast.error('Failed to send invitation');
        },
      }
    );
  };

  // Don't render dialog if user doesn't have permission
  if (!canInviteMembers) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join your organization. They'll receive an email
            with instructions to get started.
          </DialogDescription>
        </DialogHeader>

        {!restrictions.hasAvailableSlots && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No available user licenses. <PurchaseLicensesLink>Purchase more licenses</PurchaseLicensesLink> before inviting members.
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="colleague@company.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="member">
                        <div>
                          <div className="font-medium">Member</div>
                          <div className="text-xs text-muted-foreground">
                            Can view and edit equipment, work orders
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div>
                          <div className="font-medium">Admin</div>
                          <div className="text-xs text-muted-foreground">
                            Can manage members and organization settings
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Message (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Welcome to our team! Looking forward to working with you."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isPending || !restrictions.hasAvailableSlots}
              >
                {isPending ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SimplifiedInvitationDialog;
