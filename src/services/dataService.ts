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
  imageUrl?: string;
  customAttributes?: Record<string, string>;
  lastKnownLocation?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
}

export interface Note {
  id: string;
  equipmentId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt?: string;
  isPrivate: boolean;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  equipmentId: string;
  priority: 'low' | 'medium' | 'high';
  status: 'submitted' | 'accepted' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  assigneeId?: string;
  assigneeName?: string;
  teamId?: string;
  teamName?: string;
  createdDate: string;
  dueDate?: string;
  estimatedHours?: number;
  completedDate?: string;
}

export interface Scan {
  id: string;
  equipmentId: string;
  scannedBy: string;
  scannedAt: string;
  location?: string;
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
        status: 'active' as const,
        location: 'Warehouse A',
        installationDate: '2023-01-15',
        warrantyExpiration: '2026-01-15',
        lastMaintenance: '2024-05-15',
        notes: 'Primary warehouse forklift',
        imageUrl: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop',
        customAttributes: {
          'Load Capacity': '2500 kg',
          'Fuel Type': 'Electric',
          'Operating Hours': '1,250 hrs'
        }
      },
      {
        id: '2',
        name: 'Generator GN-001',
        manufacturer: 'Caterpillar',
        model: 'C15',
        serialNumber: 'ACME-GN001',
        status: 'maintenance' as const,
        location: 'Maintenance Bay',
        installationDate: '2022-08-20',
        warrantyExpiration: '2025-08-20',
        lastMaintenance: '2024-05-20',
        notes: 'Scheduled maintenance in progress',
        imageUrl: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&h=300&fit=crop',
        customAttributes: {
          'Power Output': '500 kW',
          'Fuel Type': 'Diesel',
          'Running Hours': '8,500 hrs'
        },
        lastKnownLocation: {
          latitude: 40.7128,
          longitude: -74.0060,
          timestamp: '2024-06-15T10:30:00Z'
        }
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
          { id: '1', name: 'John Smith', email: 'john@acme.com', role: 'manager' as const },
          { id: '2', name: 'Sarah Davis', email: 'sarah@acme.com', role: 'technician' as const },
          { id: '3', name: 'Mike Johnson', email: 'mike@acme.com', role: 'technician' as const }
        ]
      }
    ],
    stats: {
      totalEquipment: 2,
      activeEquipment: 1,
      maintenanceEquipment: 1,
      totalWorkOrders: 5
    },
    notes: [
      {
        id: '1',
        equipmentId: '1',
        content: 'Completed routine inspection. All systems operational.',
        authorId: '1',
        authorName: 'John Smith',
        createdAt: '2024-06-10T14:30:00Z',
        isPrivate: false
      },
      {
        id: '2',
        equipmentId: '1',
        content: 'Need to replace hydraulic fluid next month.',
        authorId: '2',
        authorName: 'Sarah Davis',
        createdAt: '2024-06-08T09:15:00Z',
        isPrivate: true
      },
      {
        id: '3',
        equipmentId: '2',
        content: 'Engine diagnostics show minor wear. Monitoring closely.',
        authorId: '1',
        authorName: 'John Smith',
        createdAt: '2024-06-05T16:45:00Z',
        isPrivate: false
      }
    ],
    workOrders: [
      {
        id: '1',
        title: 'Forklift Safety Inspection',
        description: 'Monthly safety inspection for Forklift FL-001',
        equipmentId: '1',
        priority: 'medium' as const,
        status: 'completed' as const,
        assigneeId: '2',
        assigneeName: 'Sarah Davis',
        teamId: '1',
        teamName: 'Maintenance Team',
        createdDate: '2024-06-01T08:00:00Z',
        dueDate: '2024-06-15T17:00:00Z',
        estimatedHours: 2,
        completedDate: '2024-06-10T14:30:00Z'
      },
      {
        id: '2',
        title: 'Generator Maintenance',
        description: 'Scheduled maintenance for Generator GN-001 including oil change, filter replacement, and comprehensive system diagnostics. This is a critical maintenance task that requires careful attention to safety protocols.',
        equipmentId: '2',
        priority: 'high' as const,
        status: 'in_progress' as const,
        assigneeId: '1',
        assigneeName: 'John Smith',
        teamId: '1',
        teamName: 'Maintenance Team',
        createdDate: '2024-05-20T10:00:00Z',
        dueDate: '2024-06-20T17:00:00Z',
        estimatedHours: 8
      },
      {
        id: '3',
        title: 'Forklift Hydraulic System Check',
        description: 'Investigate potential hydraulic leak and check fluid levels',
        equipmentId: '1',
        priority: 'medium' as const,
        status: 'assigned' as const,
        assigneeId: '3',
        assigneeName: 'Mike Johnson',
        teamId: '1',
        teamName: 'Maintenance Team',
        createdDate: '2024-06-12T09:00:00Z',
        dueDate: '2024-06-25T17:00:00Z',
        estimatedHours: 3
      }
    ],
    scans: [
      {
        id: '1',
        equipmentId: '1',
        scannedBy: 'John Smith',
        scannedAt: '2024-06-15T10:30:00Z',
        location: 'Warehouse A',
        notes: 'Pre-shift inspection'
      },
      {
        id: '2',
        equipmentId: '1',
        scannedBy: 'Mike Johnson',
        scannedAt: '2024-06-14T16:45:00Z',
        location: 'Warehouse A',
        notes: 'End of shift check'
      },
      {
        id: '3',
        equipmentId: '2',
        scannedBy: 'Sarah Davis',
        scannedAt: '2024-06-13T09:15:00Z',
        location: 'Maintenance Bay',
        notes: 'Maintenance status check'
      }
    ]
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
        status: 'active' as const,
        location: 'Construction Site Alpha',
        installationDate: '2024-01-10',
        warrantyExpiration: '2027-01-10',
        lastMaintenance: '2024-06-01',
        notes: 'Heavy-duty excavator for large projects',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=300&fit=crop',
        customAttributes: {
          'Bucket Capacity': '1.2 m³',
          'Operating Weight': '20,500 kg',
          'Engine Power': '129 kW'
        },
        lastKnownLocation: {
          latitude: 40.7589,
          longitude: -73.9851,
          timestamp: '2024-06-15T11:00:00Z'
        }
      },
      {
        id: '2',
        name: 'Crane CR-301',
        manufacturer: 'Liebherr',
        model: 'LTM 1030',
        serialNumber: 'TECH-CR301',
        status: 'active' as const,
        location: 'Construction Site Beta',
        installationDate: '2023-06-15',
        warrantyExpiration: '2026-06-15',
        lastMaintenance: '2024-05-30',
        notes: 'Mobile crane for high-rise construction',
        imageUrl: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop',
        customAttributes: {
          'Max Lifting Capacity': '30 tons',
          'Boom Length': '35 m',
          'Engine Type': 'Liebherr D924'
        }
      },
      {
        id: '3',
        name: 'Bulldozer BD-401',
        manufacturer: 'Caterpillar',
        model: 'D6T',
        serialNumber: 'TECH-BD401',
        status: 'maintenance' as const,
        location: 'Service Center',
        installationDate: '2023-03-20',
        warrantyExpiration: '2026-03-20',
        lastMaintenance: '2024-06-05',
        notes: 'Hydraulic system repair in progress',
        imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=300&fit=crop',
        customAttributes: {
          'Blade Width': '3.4 m',
          'Operating Weight': '18,500 kg',
          'Ground Pressure': '62 kPa'
        }
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
          { id: '1', name: 'Tom Brown', email: 'tom@techcorp.com', role: 'manager' as const },
          { id: '2', name: 'Emily Johnson', email: 'emily@techcorp.com', role: 'technician' as const },
          { id: '3', name: 'David Wilson', email: 'david@techcorp.com', role: 'technician' as const },
          { id: '4', name: 'Anna Lee', email: 'anna@techcorp.com', role: 'requestor' as const }
        ]
      },
      {
        id: '2',
        name: 'Safety & Inspection',
        description: 'Safety compliance and equipment inspection',
        memberCount: 4,
        workOrderCount: 3,
        members: [
          { id: '5', name: 'Robert Chen', email: 'robert@techcorp.com', role: 'manager' as const },
          { id: '6', name: 'Maria Garcia', email: 'maria@techcorp.com', role: 'technician' as const }
        ]
      }
    ],
    stats: {
      totalEquipment: 3,
      activeEquipment: 2,
      maintenanceEquipment: 1,
      totalWorkOrders: 15
    },
    notes: [],
    workOrders: [],
    scans: []
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
        status: 'active' as const,
        location: 'Headquarters',
        installationDate: '2024-02-01',
        warrantyExpiration: '2027-02-01',
        lastMaintenance: '2024-05-25',
        notes: 'Delivery van for local operations',
        imageUrl: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?w=400&h=300&fit=crop',
        customAttributes: {
          'Cargo Volume': '15.1 m³',
          'Payload': '1,616 kg',
          'Fuel Type': 'Gasoline'
        }
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
          { id: '1', name: 'Alex Parker', email: 'alex@startupfleet.com', role: 'manager' as const },
          { id: '2', name: 'Jamie Taylor', email: 'jamie@startupfleet.com', role: 'technician' as const }
        ]
      }
    ],
    stats: {
      totalEquipment: 1,
      activeEquipment: 1,
      maintenanceEquipment: 0,
      totalWorkOrders: 1
    },
    notes: [],
    workOrders: [],
    scans: []
  }
};

export const getEquipmentByOrganization = (organizationId: string): Equipment[] => {
  return organizationData[organizationId as keyof typeof organizationData]?.equipment || [];
};

export const getEquipmentById = (organizationId: string, equipmentId: string): Equipment | undefined => {
  const equipment = getEquipmentByOrganization(organizationId);
  return equipment.find(item => item.id === equipmentId);
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

export const getNotesByEquipmentId = (organizationId: string, equipmentId: string): Note[] => {
  const data = organizationData[organizationId as keyof typeof organizationData];
  return data?.notes?.filter(note => note.equipmentId === equipmentId) || [];
};

export const getWorkOrdersByEquipmentId = (organizationId: string, equipmentId: string): WorkOrder[] => {
  const data = organizationData[organizationId as keyof typeof organizationData];
  return data?.workOrders?.filter(workOrder => workOrder.equipmentId === equipmentId) || [];
};

export const getScansByEquipmentId = (organizationId: string, equipmentId: string): Scan[] => {
  const data = organizationData[organizationId as keyof typeof organizationData];
  return data?.scans?.filter(scan => scan.equipmentId === equipmentId) || [];
};

export const getWorkOrderById = (organizationId: string, workOrderId: string): WorkOrder | undefined => {
  const data = organizationData[organizationId as keyof typeof organizationData];
  return data?.workOrders?.find(workOrder => workOrder.id === workOrderId);
};

export const getAllWorkOrdersByOrganization = (organizationId: string): WorkOrder[] => {
  const data = organizationData[organizationId as keyof typeof organizationData];
  return data?.workOrders || [];
};

export const updateWorkOrderStatus = (
  organizationId: string, 
  workOrderId: string, 
  newStatus: WorkOrder['status']
): boolean => {
  const data = organizationData[organizationId as keyof typeof organizationData];
  if (!data?.workOrders) return false;
  
  const workOrderIndex = data.workOrders.findIndex(wo => wo.id === workOrderId);
  if (workOrderIndex === -1) return false;
  
  data.workOrders[workOrderIndex].status = newStatus;
  
  // Set completion date if marking as completed
  if (newStatus === 'completed') {
    data.workOrders[workOrderIndex].completedDate = new Date().toISOString();
  }
  
  return true;
};
