import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { customerService, Customer, CustomerContact } from '@/services/customerService';
import { useOrganization } from '@/hooks/useOrganization';
import { supabase } from '@/integrations/supabase/client';

interface CustomerContactsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

interface OrganizationMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function CustomerContactsDialog({ open, onOpenChange, customer }: CustomerContactsDialogProps) {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<CustomerContact['role']>('customer_viewer');

  const { data: contacts = [], isLoading: contactsLoading } = useQuery({
    queryKey: ['customer-contacts', customer.id],
    queryFn: () => customerService.getCustomerContacts(customer.id),
    enabled: open && !!customer.id,
  });

  const { data: orgMembers = [] } = useQuery({
    queryKey: ['organization-members', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          role,
          profiles:user_id (
            id,
            name,
            email
          )
        `)
        .eq('organization_id', currentOrganization!.id)
        .eq('status', 'active');

      if (error) throw error;
      
      return data.map(member => ({
        id: member.profiles.id,
        name: member.profiles.name || 'Unknown',
        email: member.profiles.email || '',
        role: member.role,
      }));
    },
    enabled: open && !!currentOrganization?.id,
  });

  const addContactMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: CustomerContact['role'] }) =>
      customerService.addCustomerContact(customer.id, userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-contacts'] });
      toast.success('Contact added successfully');
      setSelectedUserId('');
      setSelectedRole('customer_viewer');
    },
    onError: (error) => {
      console.error('Add contact error:', error);
      toast.error('Failed to add contact');
    },
  });

  const removeContactMutation = useMutation({
    mutationFn: (userId: string) => customerService.removeCustomerContact(customer.id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-contacts'] });
      toast.success('Contact removed successfully');
    },
    onError: (error) => {
      console.error('Remove contact error:', error);
      toast.error('Failed to remove contact');
    },
  });

  const handleAddContact = () => {
    if (!selectedUserId || !selectedRole) {
      toast.error('Please select a user and role');
      return;
    }

    addContactMutation.mutate({ userId: selectedUserId, role: selectedRole });
  };

  const handleRemoveContact = (userId: string) => {
    if (confirm('Are you sure you want to remove this contact?')) {
      removeContactMutation.mutate(userId);
    }
  };

  // Filter out users who are already contacts
  const availableMembers = orgMembers.filter(
    member => !contacts.some(contact => contact.user_id === member.id)
  );

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'customer_viewer': return 'Viewer';
      case 'customer_requestor': return 'Requestor';
      case 'customer_manager': return 'Manager';
      default: return role;
    }
  };

  const getRoleVariant = (role: string) => {
    switch (role) {
      case 'customer_manager': return 'default';
      case 'customer_requestor': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {customer.name} - Contacts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Contact Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Add Contact</h4>
            <div className="flex gap-2">
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select organization member" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map(member => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedRole} onValueChange={(value: CustomerContact['role']) => setSelectedRole(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer_viewer">Viewer</SelectItem>
                  <SelectItem value="customer_requestor">Requestor</SelectItem>
                  <SelectItem value="customer_manager">Manager</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleAddContact}
                disabled={!selectedUserId || addContactMutation.isPending || availableMembers.length === 0}
                size="sm"
              >
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>

            {availableMembers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                All organization members are already contacts for this customer.
              </p>
            )}
          </div>

          {/* Existing Contacts */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Current Contacts</h4>
            
            {contactsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-6 bg-muted rounded w-20"></div>
                    </div>
                    <div className="h-8 bg-muted rounded w-8"></div>
                  </div>
                ))}
              </div>
            ) : contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No contacts added yet. Add organization members as contacts to manage customer access.
              </p>
            ) : (
              <div className="space-y-2">
                {contacts.map(contact => (
                  <div key={contact.user_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium">{contact.user_profile?.name || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">{contact.user_profile?.email}</p>
                      </div>
                      <Badge variant={getRoleVariant(contact.role)}>
                        {getRoleLabel(contact.role)}
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveContact(contact.user_id)}
                      disabled={removeContactMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
