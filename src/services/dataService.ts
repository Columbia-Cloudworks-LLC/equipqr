
import { UserOrganization } from '@/types/organizationContext';

// Mock data for different organizations
export interface Equipment {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  status: 'active' | 'maintenance' | 'inactive';
  location: string;
  installationDate: string;
  warrantyExpiration: string;
  lastMaintenance: string;
  notes?: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  workOrderCount: number;
  members: TeamMember[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'technician' | 'requestor' | 'viewer';
  avatar?: string;
}

export interface DashboardStats {
  totalEquipment: number;
  activeEquipment: number;
  maintenanceEquipment: number;
  totalWorkOrders: number;
}

// Organization-specific data
const organizationData = {
  'org-1': {
    // Acme Fleet Management (Free plan)
    equipment: [
      {
        id: '1',
        name: 'Forklift FL-001',
        manufacturer: 'Toyota',
        model: 'FG25',
        serialNumber: 'ACME-FL001',
        status: 'active',
        location: 'Warehouse A',
        installationDate: '2023-01-15',
        warrantyExpiration: '2026-01-15',
        lastMaintenance: '2024-05-15',
        notes: 'Primary warehouse forklift'
      },
      {
        id: '2',
        name: 'Generator GN-001',
        manufacturer: 'Caterpillar',
        model: 'C15',
        serialNumber: 'ACME-GN001',
        status: 'maintenance',
        location: 'Maintenance Bay',
        installationDate: '2022-08-20',
        warrantyExpiration: '2025-08-20',
        lastMaintenance: '2024-05-20',
        notes: 'Scheduled maintenance in progress'
      }
    ],
    teams: [
      {
        id: '1',
        name: 'Maintenance Team',
        description: 'Equipment maintenance and repairs',
        memberCount: 3,
        workOrderCount: 5,
        members: [
          { id: '1', name: 'John Smith', email: 'john@acme.com', role: 'manager' },
          { id: '2', name: 'Sarah Davis', email: 'sarah@acme.com', role: 'technician' },
          { id: '3', name: 'Mike Johnson', email: 'mike@acme.com', role: 'technician' }
        ]
      }
    ],
    stats: {
      totalEquipment: 2,
      activeEquipment: 1,
      maintenanceEquipment: 1,
      totalWorkOrders: 5
    }
  },
  'org-2': {
    // TechCorp Industries (Premium plan)
    equipment: [
      {
        id: '1',
        name: 'Excavator EX-201',
        manufacturer: 'John Deere',
        model: '320E',
        serialNumber: 'TECH-EX201',
        status: 'active',
        location: 'Construction Site Alpha',
        installationDate: '2024-01-10',
        warrantyExpiration: '2027-01-10',
        lastMaintenance: '2024-06-01',
        notes: 'Heavy-duty excavator for large projects'
      },
      {
        id: '2',
        name: 'Crane CR-301',
        manufacturer: 'Liebherr',
        model: 'LTM 1030',
        serialNumber: 'TECH-CR301',
        status: 'active',
        location: 'Construction Site Beta',
        installationDate: '2023-06-15',
        warrantyExpiration: '2026-06-15',
        lastMaintenance: '2024-05-30',
        notes: 'Mobile crane for high-rise construction'
      },
      {
        id: '3',
        name: 'Bulldozer BD-401',
        manufacturer: 'Caterpillar',
        model: 'D6T',
        serialNumber: 'TECH-BD401',
        status: 'maintenance',
        location: 'Service Center',
        installationDate: '2023-03-20',
        warrantyExpiration: '2026-03-20',
        lastMaintenance: '2024-06-05',
        notes: 'Hydraulic system repair in progress'
      }
    ],
    teams: [
      {
        id: '1',
        name: 'Heavy Equipment Team',
        description: 'Specialized in heavy machinery operations',
        memberCount: 8,
        workOrderCount: 12,
        members: [
          { id: '1', name: 'Tom Brown', email: 'tom@techcorp.com', role: 'manager' },
          { id: '2', name: 'Emily Johnson', email: 'emily@techcorp.com', role: 'technician' },
          { id: '3', name: 'David Wilson', email: 'david@techcorp.com', role: 'technician' },
          { id: '4', name: 'Anna Lee', email: 'anna@techcorp.com', role: 'requestor' }
        ]
      },
      {
        id: '2',
        name: 'Safety & Inspection',
        description: 'Safety compliance and equipment inspection',
        memberCount: 4,
        workOrderCount: 3,
        members: [
          { id: '5', name: 'Robert Chen', email: 'robert@techcorp.com', role: 'manager' },
          { id: '6', name: 'Maria Garcia', email: 'maria@techcorp.com', role: 'technician' }
        ]
      }
    ],
    stats: {
      totalEquipment: 3,
      activeEquipment: 2,
      maintenanceEquipment: 1,
      totalWorkOrders: 15
    }
  },
  'org-3': {
    // StartupFleet (Free plan)
    equipment: [
      {
        id: '1',
        name: 'Van VN-101',
        manufacturer: 'Ford',
        model: 'Transit',
        serialNumber: 'STARTUP-VN101',
        status: 'active',
        location: 'Headquarters',
        installationDate: '2024-02-01',
        warrantyExpiration: '2027-02-01',
        lastMaintenance: '2024-05-25',
        notes: 'Delivery van for local operations'
      }
    ],
    teams: [
      {
        id: '1',
        name: 'Operations',
        description: 'Small operations team',
        memberCount: 2,
        workOrderCount: 1,
        members: [
          { id: '1', name: 'Alex Parker', email: 'alex@startupfleet.com', role: 'manager' },
          { id: '2', name: 'Jamie Taylor', email: 'jamie@startupfleet.com', role: 'technician' }
        ]
      }
    ],
    stats: {
      totalEquipment: 1,
      activeEquipment: 1,
      maintenanceEquipment: 0,
      totalWorkOrders: 1
    }
  }
};

export const getEquipmentByOrganization = (organizationId: string): Equipment[] => {
  return organizationData[organizationId as keyof typeof organizationData]?.equipment || [];
};

export const getTeamsByOrganization = (organizationId: string): Team[] => {
  return organizationData[organizationId as keyof typeof organizationData]?.teams || [];
};

export const getDashboardStatsByOrganization = (organizationId: string): DashboardStats => {
  return organizationData[organizationId as keyof typeof organizationData]?.stats || {
    totalEquipment: 0,
    activeEquipment: 0,
    maintenanceEquipment: 0,
    totalWorkOrders: 0
  };
};
