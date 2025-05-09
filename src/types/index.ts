
export interface Equipment {
  id: string;
  name: string;
  category: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  assignedTo: string;
  status: 'Available' | 'In Use' | 'Under Maintenance' | 'Retired';
  location: string;
  notes: string;
  lastUpdated: string;
}

export interface WorkNote {
  id: string;
  equipmentId: string;
  authorId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Editor' | 'Viewer';
  status: 'Active' | 'Pending';
  joinedAt: string;
}

export interface DashboardStat {
  label: string;
  value: number;
  change?: number;
  icon: React.ElementType;
}
