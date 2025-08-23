
import { supabase } from "@/integrations/supabase/client";

export interface Customer {
  id: string;
  organization_id: string;
  name: string;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface CustomerContact {
  customer_id: string;
  user_id: string;
  role: 'customer_viewer' | 'customer_requestor' | 'customer_manager';
  created_at: string;
  user_profile?: {
    name: string;
    email: string;
  };
}

export interface CustomerSite {
  id: string;
  customer_id: string;
  name?: string;
  address?: any;
  created_at: string;
}

export interface CreateCustomerData {
  name: string;
  status?: 'active' | 'inactive';
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {}

class CustomerService {
  async getCustomers(organizationId: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getCustomer(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }

  async createCustomer(organizationId: string, customerData: CreateCustomerData): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        organization_id: organizationId,
        ...customerData
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateCustomer(id: string, customerData: UpdateCustomerData): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(customerData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async getCustomerContacts(customerId: string): Promise<CustomerContact[]> {
    const { data, error } = await supabase
      .from('customer_contacts')
      .select(`
        *,
        user_profile:profiles(name, email)
      `)
      .eq('customer_id', customerId);

    if (error) throw error;
    return data || [];
  }

  async addCustomerContact(customerId: string, userId: string, role: CustomerContact['role']): Promise<CustomerContact> {
    const { data, error } = await supabase
      .from('customer_contacts')
      .insert({
        customer_id: customerId,
        user_id: userId,
        role
      })
      .select(`
        *,
        user_profile:profiles(name, email)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  async removeCustomerContact(customerId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('customer_contacts')
      .delete()
      .eq('customer_id', customerId)
      .eq('user_id', userId);

    if (error) throw error;
  }

  async getCustomerSites(customerId: string): Promise<CustomerSite[]> {
    const { data, error } = await supabase
      .from('customer_sites')
      .select('*')
      .eq('customer_id', customerId)
      .order('name');

    if (error) throw error;
    return data || [];
  }
}

export const customerService = new CustomerService();
