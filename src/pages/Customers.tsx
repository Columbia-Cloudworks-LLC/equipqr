
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { CustomerDialog } from '@/components/customers/CustomerDialog';
import { CustomerContactsDialog } from '@/components/customers/CustomerContactsDialog';
import { customerService, Customer } from '@/services/customerService';
import { useOrganization } from '@/hooks/useOrganization';

export default function Customers() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isContactsDialogOpen, setIsContactsDialogOpen] = useState(false);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', currentOrganization?.id],
    queryFn: () => customerService.getCustomers(currentOrganization!.id),
    enabled: !!currentOrganization?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customerService.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error) => {
      console.error('Delete customer error:', error);
      toast.error('Failed to delete customer');
    },
  });

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleManageContacts = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsContactsDialogOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    if (confirm(`Are you sure you want to delete "${customer.name}"?`)) {
      deleteMutation.mutate(customer.id);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Customers</h1>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Customers</h1>
          <Badge variant="outline" className="text-xs">BETA</Badge>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by adding your first customer to track equipment assignments and service requests.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{customer.name}</span>
                  <Badge variant={customer.status === 'active' ? 'default' : 'secondary'}>
                    {customer.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleManageContacts(customer)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Contacts
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(customer)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(customer)}
                      disabled={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CustomerDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        organizationId={currentOrganization?.id || ''}
      />

      {selectedCustomer && (
        <>
          <CustomerDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            organizationId={currentOrganization?.id || ''}
            customer={selectedCustomer}
          />
          <CustomerContactsDialog
            open={isContactsDialogOpen}
            onOpenChange={setIsContactsDialogOpen}
            customer={selectedCustomer}
          />
        </>
      )}
    </div>
  );
}
