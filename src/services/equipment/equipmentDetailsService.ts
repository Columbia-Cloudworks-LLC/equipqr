
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { getEquipmentAttributes } from "./attributesService";
import { invokeEdgeFunctionWithRetry } from "@/utils/edgeFunctionUtils";

interface PermissionResponse {
  has_permission: boolean;
  reason?: string;
  role?: string;
}

/**
 * Get a single equipment by ID with its attributes
 */
export async function getEquipmentById(id: string): Promise<Equipment> {
  try {
    // Create a cache key for this specific equipment ID
    const cacheKey = `equipment_details_${id}`;
    const cachedData = sessionStorage.getItem(cacheKey);
    
    // Check if we have cached data that's less than 5 minutes old
    if (cachedData) {
      try {
        const { data, timestamp } = JSON.parse(cachedData);
        const now = Date.now();
        // Cache valid for 5 minutes
        if (now - timestamp < 5 * 60 * 1000) {
          console.log('Using cached equipment details');
          return data as Equipment;
        }
      } catch (e) {
        console.error('Error parsing cached equipment data:', e);
        // Continue with fresh fetch if cache parsing fails
      }
    }
    
    // Get current user's auth ID
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Authentication error: Please log in again');
    }
    
    if (!sessionData?.session?.user) {
      console.error('No session user found');
      throw new Error('User must be logged in to view equipment details');
    }
    
    const authUserId = sessionData.session.user.id;
    console.log('Getting equipment by ID. Auth user ID:', authUserId);
    
    // Use more reliable edge function with retry
    const result = await invokeEdgeFunctionWithRetry(
      'check_equipment_permission', 
      {
        user_id: authUserId,
        equipment_id: id,
        action: 'view'
      },
      { maxRetries: 1 }
    ).catch(async (error) => {
      console.warn('Edge function failed, falling back to direct database check:', error);
      
      // Fall back to direct database query for permissions
      const { data: permData, error: permError } = await supabase.rpc(
        'rpc_check_equipment_permission',
        { 
          user_id: authUserId, 
          action: 'view',
          equipment_id: id
        }
      );
      
      if (permError) {
        console.error('Permission check failed:', permError);
        throw new Error('Failed to verify access permissions');
      }
      
      return permData;
    });
    
    // Properly type check and cast the result
    const accessResponse: PermissionResponse = typeof result === 'object' ? 
      (result as PermissionResponse) : 
      { has_permission: false, reason: 'Invalid response format' };
    
    if (!accessResponse || !accessResponse.has_permission) {
      console.error('User does not have access to this equipment. Reason:', accessResponse?.reason);
      throw new Error('You do not have permission to view this equipment');
    }
    
    // First fetch the equipment
    const { data: equipment, error } = await supabase
      .from('equipment')
      .select(`
        *,
        team:team_id (name, org_id),
        org:org_id (name)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();
      
    if (error) {
      console.error('Error fetching equipment by id:', error);
      throw error;
    }
    
    // Get user's primary organization
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', authUserId)
      .single();
    
    const userOrgId = userProfile?.org_id;
    const isExternalOrg = equipment.team?.org_id && userOrgId && equipment.team.org_id !== userOrgId;
    
    // Check edit permissions - use the same retry function
    const editResult = await invokeEdgeFunctionWithRetry(
      'check_equipment_permission', 
      {
        user_id: authUserId,
        equipment_id: id,
        action: 'edit'
      },
      { maxRetries: 1 }
    ).catch(async (error) => {
      console.warn('Edit permission check via edge function failed, falling back:', error);
      
      // Fall back to direct database query for edit permissions
      const { data: editData, error: permError } = await supabase.rpc(
        'rpc_check_equipment_permission',
        { 
          user_id: authUserId, 
          action: 'edit',
          equipment_id: id
        }
      );
      
      if (permError) {
        console.error('Edit permission check failed:', permError);
        return { has_permission: false };
      }
      
      return editData;
    });
    
    // Properly type check and cast the edit result
    const editResponse: PermissionResponse = typeof editResult === 'object' ? 
      (editResult as PermissionResponse) : 
      { has_permission: false, reason: 'Invalid response format' };
    
    const canEdit = editResponse?.has_permission || false;
    console.log('Edit permission check result:', editResponse);
    
    // Then fetch the attributes efficiently
    const attributes = await getEquipmentAttributes(id);
    console.log('Equipment attributes fetched:', attributes);
    
    // Build the complete equipment object
    const fullEquipment = {
      ...equipment,
      team_name: equipment.team?.name || null, 
      org_name: equipment.org?.name || 'Unknown Organization',
      is_external_org: isExternalOrg,
      can_edit: canEdit,
      attributes
    } as Equipment;
    
    // Cache the result for 5 minutes
    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: fullEquipment,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Failed to cache equipment details:', e);
    }
    
    return fullEquipment;
  } catch (error) {
    console.error('Error in getEquipmentById:', error);
    throw error;
  }
}
