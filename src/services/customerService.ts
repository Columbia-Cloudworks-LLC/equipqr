import { supabase } from '@/integrations/supabase/client';

export interface Customer {
  id: string;
  organization_id: string;
  name: string;
  status: 'active' | 'inactive';
  created_at?: string;
}

export interface CustomerContact {
  customer_id: string;
  user_id: string;
  role: 'customer_viewer' | 'customer_requestor' | 'customer_manager';
  user_profile?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

export const customerService = {
  // List customers for an organization
  async getCustomers(organizationId: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('id, organization_id, name, status, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row: any) => ({
      id: row.id,
      organization_id: row.organization_id,
      name: row.name,
      status: row.status as 'active' | 'inactive',
      created_at: row.created_at,
    }));
  },

  // Create a customer
  async createCustomer(
    organizationId: string,
    payload: { name: string; status: 'active' | 'inactive' }
  ): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        organization_id: organizationId,
        name: payload.name,
        status: payload.status,
      })
      .select('id, organization_id, name, status, created_at')
      .single();

    if (error) throw error;
    const row: any = data;
    return {
      id: row.id,
      organization_id: row.organization_id,
      name: row.name,
      status: row.status as 'active' | 'inactive',
      created_at: row.created_at,
    };
  },

  // Update a customer
  async updateCustomer(
    id: string,
    payload: Partial<Pick<Customer, 'name' | 'status'>>
  ): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(payload)
      .eq('id', id)
      .select('id, organization_id, name, status, created_at')
      .single();

    if (error) throw error;
    const row: any = data;
    return {
      id: row.id,
      organization_id: row.organization_id,
      name: row.name,
      status: row.status as 'active' | 'inactive',
      created_at: row.created_at,
    };
  },

  // Delete a customer
  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // List contacts for a customer (includes profile data)
  async getCustomerContacts(customerId: string): Promise<CustomerContact[]> {
    const { data, error } = await supabase
      .from('customer_contacts')
      .select(`
        customer_id,
        user_id,
        role,
        user_profile:profiles!customer_contacts_user_id_fkey ( id, name, email )
      `)
      .eq('customer_id', customerId);

    if (error) throw error;

    return (data || []).map((row: any) => ({
      customer_id: row.customer_id,
      user_id: row.user_id,
      role: row.role,
      user_profile: row.user_profile,
    }));
  },

  // Add a contact to a customer
  async addCustomerContact(
    customerId: string,
    userId: string,
    role: CustomerContact['role']
  ): Promise<CustomerContact> {
    const { data, error } = await supabase
      .from('customer_contacts')
      .insert({ customer_id: customerId, user_id: userId, role })
      .select(`
        customer_id,
        user_id,
        role,
        user_profile:profiles!customer_contacts_user_id_fkey ( id, name, email )
      `)
      .single();

    if (error) throw error;

    return {
      customer_id: data.customer_id,
      user_id: data.user_id,
      role: data.role,
      user_profile: data.user_profile,
    } as CustomerContact;
  },

  // Remove a contact from a customer
  async removeCustomerContact(customerId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('customer_contacts')
      .delete()
      .eq('customer_id', customerId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};
