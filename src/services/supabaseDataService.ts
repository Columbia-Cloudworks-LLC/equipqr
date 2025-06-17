
import { supabase } from '@/integrations/supabase/client';

// Re-export types from the mock service to maintain compatibility
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

// Helper function to transform database equipment to our interface
const transformEquipment = (dbEquipment: any): Equipment => ({
  id: dbEquipment.id,
  name: dbEquipment.name,
  manufacturer: dbEquipment.manufacturer,
  model: dbEquipment.model,
  serialNumber: dbEquipment.serial_number,
  status: dbEquipment.status,
  location: dbEquipment.location,
  installationDate: dbEquipment.installation_date,
  warrantyExpiration: dbEquipment.warranty_expiration || '',
  lastMaintenance: dbEquipment.last_maintenance || '',
  notes: dbEquipment.notes,
  imageUrl: dbEquipment.image_url,
  customAttributes: dbEquipment.custom_attributes || {},
  lastKnownLocation: dbEquipment.last_known_location
});

// Helper function to transform database work order to our interface
const transformWorkOrder = (dbWorkOrder: any, profiles: any[], teams: any[]): WorkOrder => {
  const assignee = profiles.find(p => p.id === dbWorkOrder.assignee_id);
  const team = teams.find(t => t.id === dbWorkOrder.team_id);
  
  return {
    id: dbWorkOrder.id,
    title: dbWorkOrder.title,
    description: dbWorkOrder.description,
    equipmentId: dbWorkOrder.equipment_id,
    priority: dbWorkOrder.priority,
    status: dbWorkOrder.status,
    assigneeId: dbWorkOrder.assignee_id,
    assigneeName: assignee?.name,
    teamId: dbWorkOrder.team_id,
    teamName: team?.name,
    createdDate: dbWorkOrder.created_date,
    dueDate: dbWorkOrder.due_date,
    estimatedHours: dbWorkOrder.estimated_hours,
    completedDate: dbWorkOrder.completed_date
  };
};

// Helper function to transform database note to our interface
const transformNote = (dbNote: any, profiles: any[]): Note => {
  const author = profiles.find(p => p.id === dbNote.author_id);
  
  return {
    id: dbNote.id,
    equipmentId: dbNote.equipment_id,
    content: dbNote.content,
    authorId: dbNote.author_id,
    authorName: author?.name || 'Unknown',
    createdAt: dbNote.created_at,
    updatedAt: dbNote.updated_at,
    isPrivate: dbNote.is_private
  };
};

// Helper function to transform database scan to our interface
const transformScan = (dbScan: any, profiles: any[]): Scan => {
  const scannedByUser = profiles.find(p => p.id === dbScan.scanned_by);
  
  return {
    id: dbScan.id,
    equipmentId: dbScan.equipment_id,
    scannedBy: scannedByUser?.name || 'Unknown',
    scannedAt: dbScan.scanned_at,
    location: dbScan.location,
    notes: dbScan.notes
  };
};

// Equipment functions
export const getEquipmentByOrganization = async (organizationId: string): Promise<Equipment[]> => {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) {
      console.error('Error fetching equipment:', error);
      return [];
    }

    return (data || []).map(transformEquipment);
  } catch (error) {
    console.error('Error in getEquipmentByOrganization:', error);
    return [];
  }
};

export const getEquipmentById = async (organizationId: string, equipmentId: string): Promise<Equipment | undefined> => {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .select('*')
      .eq('id', equipmentId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      console.error('Error fetching equipment by ID:', error);
      return undefined;
    }

    return transformEquipment(data);
  } catch (error) {
    console.error('Error in getEquipmentById:', error);
    return undefined;
  }
};

// Team functions
export const getTeamsByOrganization = async (organizationId: string): Promise<Team[]> => {
  try {
    const { data: teamsData, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (teamsError) {
      console.error('Error fetching teams:', teamsError);
      return [];
    }

    if (!teamsData || teamsData.length === 0) {
      return [];
    }

    // Get team members for all teams
    const teamIds = teamsData.map(team => team.id);
    const { data: membersData, error: membersError } = await supabase
      .from('team_members')
      .select(`
        team_id,
        user_id,
        role,
        profiles:user_id (
          id,
          name,
          email
        )
      `)
      .in('team_id', teamIds);

    if (membersError) {
      console.error('Error fetching team members:', membersError);
    }

    // Get work order counts for teams
    const { data: workOrderCounts, error: workOrderError } = await supabase
      .from('work_orders')
      .select('team_id')
      .in('team_id', teamIds)
      .not('status', 'eq', 'completed');

    if (workOrderError) {
      console.error('Error fetching work order counts:', workOrderError);
    }

    return teamsData.map(team => {
      const teamMembers = (membersData || [])
        .filter(member => member.team_id === team.id)
        .map(member => ({
          id: member.user_id,
          name: (member.profiles as any)?.name || 'Unknown',
          email: (member.profiles as any)?.email || '',
          role: member.role,
        }));

      const workOrderCount = (workOrderCounts || []).filter(wo => wo.team_id === team.id).length;

      return {
        id: team.id,
        name: team.name,
        description: team.description || '',
        memberCount: teamMembers.length,
        workOrderCount,
        members: teamMembers
      };
    });
  } catch (error) {
    console.error('Error in getTeamsByOrganization:', error);
    return [];
  }
};

// Dashboard statistics
export const getDashboardStatsByOrganization = async (organizationId: string): Promise<DashboardStats> => {
  try {
    // Get equipment stats
    const { data: equipmentData, error: equipmentError } = await supabase
      .from('equipment')
      .select('status')
      .eq('organization_id', organizationId);

    if (equipmentError) {
      console.error('Error fetching equipment stats:', equipmentError);
    }

    // Get work order stats
    const { data: workOrderData, error: workOrderError } = await supabase
      .from('work_orders')
      .select('status')
      .eq('organization_id', organizationId);

    if (workOrderError) {
      console.error('Error fetching work order stats:', workOrderError);
    }

    const equipment = equipmentData || [];
    const workOrders = workOrderData || [];

    return {
      totalEquipment: equipment.length,
      activeEquipment: equipment.filter(e => e.status === 'active').length,
      maintenanceEquipment: equipment.filter(e => e.status === 'maintenance').length,
      totalWorkOrders: workOrders.length
    };
  } catch (error) {
    console.error('Error in getDashboardStatsByOrganization:', error);
    return {
      totalEquipment: 0,
      activeEquipment: 0,
      maintenanceEquipment: 0,
      totalWorkOrders: 0
    };
  }
};

// Notes functions
export const getNotesByEquipmentId = async (organizationId: string, equipmentId: string): Promise<Note[]> => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        equipment!inner (
          organization_id
        )
      `)
      .eq('equipment_id', equipmentId)
      .eq('equipment.organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return [];
    }

    // Get author profiles
    const authorIds = [...new Set((data || []).map(note => note.author_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', authorIds);

    if (profilesError) {
      console.error('Error fetching author profiles:', profilesError);
    }

    return (data || []).map(note => transformNote(note, profiles || []));
  } catch (error) {
    console.error('Error in getNotesByEquipmentId:', error);
    return [];
  }
};

// Work orders functions
export const getWorkOrdersByEquipmentId = async (organizationId: string, equipmentId: string): Promise<WorkOrder[]> => {
  try {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .eq('equipment_id', equipmentId)
      .eq('organization_id', organizationId)
      .order('created_date', { ascending: false });

    if (error) {
      console.error('Error fetching work orders:', error);
      return [];
    }

    // Get profiles and teams for transforming the data
    const assigneeIds = [...new Set((data || []).map(wo => wo.assignee_id).filter(Boolean))];
    const teamIds = [...new Set((data || []).map(wo => wo.team_id).filter(Boolean))];

    const [profilesResult, teamsResult] = await Promise.all([
      assigneeIds.length > 0 ? supabase.from('profiles').select('id, name').in('id', assigneeIds) : { data: [], error: null },
      teamIds.length > 0 ? supabase.from('teams').select('id, name').in('id', teamIds) : { data: [], error: null }
    ]);

    return (data || []).map(wo => transformWorkOrder(wo, profilesResult.data || [], teamsResult.data || []));
  } catch (error) {
    console.error('Error in getWorkOrdersByEquipmentId:', error);
    return [];
  }
};

export const getAllWorkOrdersByOrganization = async (organizationId: string): Promise<WorkOrder[]> => {
  try {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_date', { ascending: false });

    if (error) {
      console.error('Error fetching all work orders:', error);
      return [];
    }

    // Get profiles and teams for transforming the data
    const assigneeIds = [...new Set((data || []).map(wo => wo.assignee_id).filter(Boolean))];
    const teamIds = [...new Set((data || []).map(wo => wo.team_id).filter(Boolean))];

    const [profilesResult, teamsResult] = await Promise.all([
      assigneeIds.length > 0 ? supabase.from('profiles').select('id, name').in('id', assigneeIds) : { data: [], error: null },
      teamIds.length > 0 ? supabase.from('teams').select('id, name').in('id', teamIds) : { data: [], error: null }
    ]);

    return (data || []).map(wo => transformWorkOrder(wo, profilesResult.data || [], teamsResult.data || []));
  } catch (error) {
    console.error('Error in getAllWorkOrdersByOrganization:', error);
    return [];
  }
};

export const getWorkOrderById = async (organizationId: string, workOrderId: string): Promise<WorkOrder | undefined> => {
  try {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .eq('id', workOrderId)
      .eq('organization_id', organizationId)
      .single();

    if (error || !data) {
      console.error('Error fetching work order by ID:', error);
      return undefined;
    }

    // Get profiles and teams for transforming the data
    const profilesResult = data.assignee_id ? 
      await supabase.from('profiles').select('id, name').eq('id', data.assignee_id).single() : 
      { data: null, error: null };
    
    const teamsResult = data.team_id ? 
      await supabase.from('teams').select('id, name').eq('id', data.team_id).single() : 
      { data: null, error: null };

    return transformWorkOrder(
      data, 
      profilesResult.data ? [profilesResult.data] : [], 
      teamsResult.data ? [teamsResult.data] : []
    );
  } catch (error) {
    console.error('Error in getWorkOrderById:', error);
    return undefined;
  }
};

// Scans functions
export const getScansByEquipmentId = async (organizationId: string, equipmentId: string): Promise<Scan[]> => {
  try {
    const { data, error } = await supabase
      .from('scans')
      .select(`
        *,
        equipment!inner (
          organization_id
        )
      `)
      .eq('equipment_id', equipmentId)
      .eq('equipment.organization_id', organizationId)
      .order('scanned_at', { ascending: false });

    if (error) {
      console.error('Error fetching scans:', error);
      return [];
    }

    // Get scanned by user profiles
    const userIds = [...new Set((data || []).map(scan => scan.scanned_by))];
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
    }

    return (data || []).map(scan => transformScan(scan, profiles || []));
  } catch (error) {
    console.error('Error in getScansByEquipmentId:', error);
    return [];
  }
};

// Mutation functions
export const updateWorkOrderStatus = async (
  organizationId: string,
  workOrderId: string,
  newStatus: WorkOrder['status']
): Promise<boolean> => {
  try {
    const updateData: any = { status: newStatus };
    
    // Set completion date if marking as completed
    if (newStatus === 'completed') {
      updateData.completed_date = new Date().toISOString();
    }

    const { error } = await supabase
      .from('work_orders')
      .update(updateData)
      .eq('id', workOrderId)
      .eq('organization_id', organizationId);

    if (error) {
      console.error('Error updating work order status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateWorkOrderStatus:', error);
    return false;
  }
};

// Create equipment
export const createEquipment = async (
  organizationId: string,
  equipmentData: Omit<Equipment, 'id'>
): Promise<Equipment | null> => {
  try {
    const { data, error } = await supabase
      .from('equipment')
      .insert({
        organization_id: organizationId,
        name: equipmentData.name,
        manufacturer: equipmentData.manufacturer,
        model: equipmentData.model,
        serial_number: equipmentData.serialNumber,
        status: equipmentData.status,
        location: equipmentData.location,
        installation_date: equipmentData.installationDate,
        warranty_expiration: equipmentData.warrantyExpiration || null,
        last_maintenance: equipmentData.lastMaintenance || null,
        notes: equipmentData.notes,
        image_url: equipmentData.imageUrl,
        custom_attributes: equipmentData.customAttributes || {},
        last_known_location: equipmentData.lastKnownLocation || null
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating equipment:', error);
      return null;
    }

    return transformEquipment(data);
  } catch (error) {
    console.error('Error in createEquipment:', error);
    return null;
  }
};

// Create work order
export const createWorkOrder = async (
  organizationId: string,
  workOrderData: Omit<WorkOrder, 'id' | 'createdDate' | 'assigneeName' | 'teamName' | 'completedDate'>
): Promise<WorkOrder | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .from('work_orders')
      .insert({
        organization_id: organizationId,
        title: workOrderData.title,
        description: workOrderData.description,
        equipment_id: workOrderData.equipmentId,
        priority: workOrderData.priority,
        status: workOrderData.status,
        assignee_id: workOrderData.assigneeId || null,
        team_id: workOrderData.teamId || null,
        due_date: workOrderData.dueDate || null,
        estimated_hours: workOrderData.estimatedHours || null,
        created_by: userData.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating work order:', error);
      return null;
    }

    // Get profiles and teams for transforming the data
    const profilesResult = data.assignee_id ? 
      await supabase.from('profiles').select('id, name').eq('id', data.assignee_id).single() : 
      { data: null, error: null };
    
    const teamsResult = data.team_id ? 
      await supabase.from('teams').select('id, name').eq('id', data.team_id).single() : 
      { data: null, error: null };

    return transformWorkOrder(
      data, 
      profilesResult.data ? [profilesResult.data] : [], 
      teamsResult.data ? [teamsResult.data] : []
    );
  } catch (error) {
    console.error('Error in createWorkOrder:', error);
    return null;
  }
};

// Create note
export const createNote = async (
  organizationId: string,
  equipmentId: string,
  content: string,
  isPrivate: boolean = false
): Promise<Note | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    const { data, error } = await supabase
      .from('notes')
      .insert({
        equipment_id: equipmentId,
        content,
        author_id: userData.user.id,
        is_private: isPrivate
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return null;
    }

    // Get author profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', userData.user.id)
      .single();

    return transformNote(data, profile ? [profile] : []);
  } catch (error) {
    console.error('Error in createNote:', error);
    return null;
  }
};
