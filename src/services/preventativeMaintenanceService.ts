
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

export type PreventativeMaintenance = Tables<'preventative_maintenance'>;

export interface PMChecklistItem {
  id: string;
  title: string;
  description?: string;
  condition: 1 | 2 | 3 | 4 | 5 | null | undefined;
  required: boolean;
  notes?: string;
  section: string;
}

export interface CreatePMData {
  workOrderId: string;
  equipmentId: string;
  organizationId: string;
  checklistData: PMChecklistItem[];
  notes?: string;
}

export interface UpdatePMData {
  checklistData: PMChecklistItem[];
  notes?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

// Comprehensive forklift PM checklist with undefined conditions (unrated)
export const defaultForkliftChecklist: PMChecklistItem[] = [
  // 1. Engine/Motor System
  {
    id: 'engine-1',
    title: 'Engine Oil Level and Condition',
    description: 'Check oil level and inspect for contamination or metal particles',
    condition: undefined,
    required: true,
    section: 'Engine/Motor System'
  },
  {
    id: 'engine-2',
    title: 'Engine Oil Filter',
    description: 'Inspect and replace if necessary',
    condition: undefined,
    required: true,
    section: 'Engine/Motor System'
  },
  {
    id: 'engine-3',
    title: 'Air Filter',
    description: 'Check for dirt, debris, or damage',
    condition: undefined,
    required: true,
    section: 'Engine/Motor System'
  },
  {
    id: 'engine-4',
    title: 'Fuel Filter',
    description: 'Inspect and replace if clogged',
    condition: undefined,
    required: true,
    section: 'Engine/Motor System'
  },
  {
    id: 'engine-5',
    title: 'Cooling System',
    description: 'Check coolant level, hoses, and radiator condition',
    condition: undefined,
    required: true,
    section: 'Engine/Motor System'
  },
  {
    id: 'engine-6',
    title: 'Belt Tension and Condition',
    description: 'Inspect all belts for proper tension, cracks, or fraying',
    condition: undefined,
    required: true,
    section: 'Engine/Motor System'
  },

  // 2. Hydraulic System
  {
    id: 'hydraulic-1',
    title: 'Hydraulic Fluid Level',
    description: 'Check fluid level in reservoir',
    condition: undefined,
    required: true,
    section: 'Hydraulic System'
  },
  {
    id: 'hydraulic-2',
    title: 'Hydraulic Fluid Condition',
    description: 'Inspect for contamination, color, and consistency',
    condition: undefined,
    required: true,
    section: 'Hydraulic System'
  },
  {
    id: 'hydraulic-3',
    title: 'Hydraulic Filter',
    description: 'Check and replace hydraulic filter',
    condition: undefined,
    required: true,
    section: 'Hydraulic System'
  },
  {
    id: 'hydraulic-4',
    title: 'Hydraulic Hoses and Fittings',
    description: 'Inspect for leaks, cracks, or damage',
    condition: undefined,
    required: true,
    section: 'Hydraulic System'
  },
  {
    id: 'hydraulic-5',
    title: 'Lift Cylinder Operation',
    description: 'Test lift, lower, and tilt functions',
    condition: undefined,
    required: true,
    section: 'Hydraulic System'
  },
  {
    id: 'hydraulic-6',
    title: 'Hydraulic Pump Performance',
    description: 'Check pump operation and pressure',
    condition: undefined,
    required: true,
    section: 'Hydraulic System'
  },

  // 3. Mast and Forks
  {
    id: 'mast-1',
    title: 'Mast Wear Pads',
    description: 'Inspect for excessive wear or damage',
    condition: undefined,
    required: true,
    section: 'Mast and Forks'
  },
  {
    id: 'mast-2',
    title: 'Lift Chains',
    description: 'Check for stretch, broken links, or wear',
    condition: undefined,
    required: true,
    section: 'Mast and Forks'
  },
  {
    id: 'mast-3',
    title: 'Fork Inspection',
    description: 'Check for cracks, bends, or wear on heel and blade',
    condition: undefined,
    required: true,
    section: 'Mast and Forks'
  },
  {
    id: 'mast-4',
    title: 'Carriage and Attachments',
    description: 'Inspect carriage rails and attachment mounting',
    condition: undefined,
    required: true,
    section: 'Mast and Forks'
  },
  {
    id: 'mast-5',
    title: 'Mast Alignment',
    description: 'Check mast for straightness and proper alignment',
    condition: undefined,
    required: true,
    section: 'Mast and Forks'
  },

  // 4. Transmission and Drive Train
  {
    id: 'transmission-1',
    title: 'Transmission Fluid',
    description: 'Check level and condition of transmission fluid',
    condition: undefined,
    required: true,
    section: 'Transmission and Drive Train'
  },
  {
    id: 'transmission-2',
    title: 'Drive Axle Operation',
    description: 'Test forward and reverse operation',
    condition: undefined,
    required: true,
    section: 'Transmission and Drive Train'
  },
  {
    id: 'transmission-3',
    title: 'Differential',
    description: 'Check differential fluid level and operation',
    condition: undefined,
    required: true,
    section: 'Transmission and Drive Train'
  },
  {
    id: 'transmission-4',
    title: 'Drive Chain/Belt',
    description: 'Inspect drive chain or belt for wear and tension',
    condition: undefined,
    required: false,
    section: 'Transmission and Drive Train'
  },

  // 5. Steering System
  {
    id: 'steering-1',
    title: 'Steering Wheel Play',
    description: 'Check for excessive play in steering wheel',
    condition: undefined,
    required: true,
    section: 'Steering System'
  },
  {
    id: 'steering-2',
    title: 'Steering Cylinder',
    description: 'Inspect steering cylinder for leaks and operation',
    condition: undefined,
    required: true,
    section: 'Steering System'
  },
  {
    id: 'steering-3',
    title: 'Steering Linkage',
    description: 'Check all steering linkage components',
    condition: undefined,
    required: true,
    section: 'Steering System'
  },
  {
    id: 'steering-4',
    title: 'Power Steering Fluid',
    description: 'Check fluid level and condition',
    condition: undefined,
    required: true,
    section: 'Steering System'
  },

  // 6. Brake System
  {
    id: 'brake-1',
    title: 'Service Brake Operation',
    description: 'Test service brake effectiveness',
    condition: undefined,
    required: true,
    section: 'Brake System'
  },
  {
    id: 'brake-2',
    title: 'Parking Brake',
    description: 'Test parking brake engagement and holding ability',
    condition: undefined,
    required: true,
    section: 'Brake System'
  },
  {
    id: 'brake-3',
    title: 'Brake Fluid Level',
    description: 'Check brake fluid reservoir level',
    condition: undefined,
    required: true,
    section: 'Brake System'
  },
  {
    id: 'brake-4',
    title: 'Brake Lines and Hoses',
    description: 'Inspect for leaks, cracks, or damage',
    condition: undefined,
    required: true,
    section: 'Brake System'
  },

  // 7. Tires and Wheels
  {
    id: 'tires-1',
    title: 'Tire Condition',
    description: 'Inspect for wear, cuts, or embedded objects',
    condition: undefined,
    required: true,
    section: 'Tires and Wheels'
  },
  {
    id: 'tires-2',
    title: 'Tire Pressure',
    description: 'Check and adjust tire pressure to specifications',
    condition: undefined,
    required: true,
    section: 'Tires and Wheels'
  },
  {
    id: 'tires-3',
    title: 'Wheel Mounting',
    description: 'Check wheel lug nuts and mounting hardware',
    condition: undefined,
    required: true,
    section: 'Tires and Wheels'
  },
  {
    id: 'tires-4',
    title: 'Rim Condition',
    description: 'Inspect rims for cracks, bends, or damage',
    condition: undefined,
    required: true,
    section: 'Tires and Wheels'
  },

  // 8. Electrical System
  {
    id: 'electrical-1',
    title: 'Battery Condition',
    description: 'Check battery terminals, cables, and charge level',
    condition: undefined,
    required: true,
    section: 'Electrical System'
  },
  {
    id: 'electrical-2',
    title: 'Lights and Indicators',
    description: 'Test all lights, beacons, and warning indicators',
    condition: undefined,
    required: true,
    section: 'Electrical System'
  },
  {
    id: 'electrical-3',
    title: 'Horn Operation',
    description: 'Test horn functionality',
    condition: undefined,
    required: true,
    section: 'Electrical System'
  },
  {
    id: 'electrical-4',
    title: 'Backup Alarm',
    description: 'Test backup alarm operation',
    condition: undefined,
    required: true,
    section: 'Electrical System'
  },
  {
    id: 'electrical-5',
    title: 'Wiring Harness',
    description: 'Inspect wiring for damage, chafing, or loose connections',
    condition: undefined,
    required: true,
    section: 'Electrical System'
  },

  // 9. Safety Systems
  {
    id: 'safety-1',
    title: 'Overhead Guard',
    description: 'Inspect overhead guard for damage or loose mounting',
    condition: undefined,
    required: true,
    section: 'Safety Systems'
  },
  {
    id: 'safety-2',
    title: 'Load Backrest',
    description: 'Check load backrest condition and mounting',
    condition: undefined,
    required: true,
    section: 'Safety Systems'
  },
  {
    id: 'safety-3',
    title: 'Seat Belt',
    description: 'Inspect seat belt for proper operation and condition',
    condition: undefined,
    required: true,
    section: 'Safety Systems'
  },
  {
    id: 'safety-4',
    title: 'Operator Presence System',
    description: 'Test operator presence sensing system',
    condition: undefined,
    required: true,
    section: 'Safety Systems'
  },
  {
    id: 'safety-5',
    title: 'Load Handling Attachments',
    description: 'Inspect all load handling attachments',
    condition: undefined,
    required: false,
    section: 'Safety Systems'
  },

  // 10. Operator Compartment
  {
    id: 'operator-1',
    title: 'Seat Condition',
    description: 'Check seat adjustment, cushioning, and mounting',
    condition: undefined,
    required: true,
    section: 'Operator Compartment'
  },
  {
    id: 'operator-2',
    title: 'Control Linkages',
    description: 'Test all control levers and pedals for proper operation',
    condition: undefined,
    required: true,
    section: 'Operator Compartment'
  },
  {
    id: 'operator-3',
    title: 'Instruments and Gauges',
    description: 'Check all gauges and warning lights',
    condition: undefined,
    required: true,
    section: 'Operator Compartment'
  },
  {
    id: 'operator-4',
    title: 'Mirrors',
    description: 'Inspect mirrors for clarity and proper adjustment',
    condition: undefined,
    required: true,
    section: 'Operator Compartment'
  },

  // 11. Frame and Body
  {
    id: 'frame-1',
    title: 'Frame Inspection',
    description: 'Check frame for cracks, bends, or structural damage',
    condition: undefined,
    required: true,
    section: 'Frame and Body'
  },
  {
    id: 'frame-2',
    title: 'Counterweight',
    description: 'Inspect counterweight mounting and condition',
    condition: undefined,
    required: true,
    section: 'Frame and Body'
  },
  {
    id: 'frame-3',
    title: 'Body Panels',
    description: 'Check body panels for damage or loose mounting',
    condition: undefined,
    required: false,
    section: 'Frame and Body'
  },
  {
    id: 'frame-4',
    title: 'Access Panels',
    description: 'Ensure all access panels are secure and functional',
    condition: undefined,
    required: false,
    section: 'Frame and Body'
  },

  // 12. Lubrication Points
  {
    id: 'lubrication-1',
    title: 'Mast Lubrication',
    description: 'Lubricate all mast grease fittings',
    condition: undefined,
    required: true,
    section: 'Lubrication Points'
  },
  {
    id: 'lubrication-2',
    title: 'Steering Lubrication',
    description: 'Lubricate steering linkage grease fittings',
    condition: undefined,
    required: true,
    section: 'Lubrication Points'
  },
  {
    id: 'lubrication-3',
    title: 'Drive Axle Lubrication',
    description: 'Lubricate drive axle components',
    condition: undefined,
    required: true,
    section: 'Lubrication Points'
  },
  {
    id: 'lubrication-4',
    title: 'General Lubrication',
    description: 'Apply lubrication to all other specified points',
    condition: undefined,
    required: true,
    section: 'Lubrication Points'
  }
];

// Create a new PM record
export const createPM = async (data: CreatePMData): Promise<PreventativeMaintenance | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    const { data: pm, error } = await supabase
      .from('preventative_maintenance')
      .insert({
        work_order_id: data.workOrderId,
        equipment_id: data.equipmentId,
        organization_id: data.organizationId,
        created_by: userData.user.id,
        checklist_data: data.checklistData as any, // Cast to any to satisfy Json type
        notes: data.notes,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating PM:', error);
      return null;
    }

    return pm;
  } catch (error) {
    console.error('Error in createPM:', error);
    return null;
  }
};

// Get PM by work order ID
export const getPMByWorkOrderId = async (workOrderId: string): Promise<PreventativeMaintenance | null> => {
  try {
    const { data, error } = await supabase
      .from('preventative_maintenance')
      .select('*')
      .eq('work_order_id', workOrderId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching PM:', error);
      return null;
    }

    return data || null;
  } catch (error) {
    console.error('Error in getPMByWorkOrderId:', error);
    return null;
  }
};

// Update PM record
export const updatePM = async (pmId: string, data: UpdatePMData): Promise<PreventativeMaintenance | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.error('User not authenticated');
      return null;
    }

    const updateData: any = {
      checklist_data: data.checklistData as any, // Cast to any to satisfy Json type
      notes: data.notes,
    };

    if (data.status) {
      updateData.status = data.status;
      
      if (data.status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        updateData.completed_by = userData.user.id;
      }
    }

    const { data: pm, error } = await supabase
      .from('preventative_maintenance')
      .update(updateData)
      .eq('id', pmId)
      .select()
      .single();

    if (error) {
      console.error('Error updating PM:', error);
      return null;
    }

    return pm;
  } catch (error) {
    console.error('Error in updatePM:', error);
    return null;
  }
};

// Get latest completed PM for equipment
export const getLatestCompletedPM = async (equipmentId: string) => {
  try {
    const { data, error } = await supabase
      .rpc('get_latest_completed_pm', { equipment_uuid: equipmentId });

    if (error) {
      console.error('Error fetching latest PM:', error);
      return null;
    }

    return data?.[0] || null;
  } catch (error) {
    console.error('Error in getLatestCompletedPM:', error);
    return null;
  }
};

// Delete PM record
export const deletePM = async (pmId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('preventative_maintenance')
      .delete()
      .eq('id', pmId);

    if (error) {
      console.error('Error deleting PM:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deletePM:', error);
    return false;
  }
};
