// Test-specific TypeScript interfaces

export interface DashboardStats {
  totalEquipment: number;
  activeEquipment: number;
  maintenanceEquipment: number;
  totalWorkOrders: number;
}

export interface Equipment {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serial_number?: string;
  status: 'active' | 'maintenance' | 'inactive';
  location?: string;
  organization_id?: string;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  equipment_id: string;
  status: 'submitted' | 'accepted' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  organization_id?: string;
  created_date?: string;
  due_date?: string;
}

export interface TestOrganization {
  id: string;
  name: string;
  memberCount: number;
  plan: string;
  maxMembers: number;
  features: string[];
  userRole: string;
  userStatus: string;
}

export interface TestUser {
  id: string;
  email: string;
  name: string;
}

export interface TestSessionData {
  organizations: TestOrganization[];
  currentOrganizationId: string | null;
  teamMemberships: Array<{
    teamId: string;
    teamName: string;
    role: string;
    joinedDate: string;
  }>;
}

export interface PermissionContext {
  userRole?: string;
  organizationId?: string;
  teamId?: string;
}