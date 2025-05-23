
import { supabase } from "@/integrations/supabase/client";
import { Equipment } from "@/types";
import { getEquipmentAttributes } from "./attributesService";
import { MemoryCache, cacheItem, getCachedItem } from "@/utils/cacheUtils";
import { toast } from "sonner";

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
    
    // Check if user has permission to access this equipment
    try {
      // Try using the RPC function first
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
        throw new Error('Permission check failed: ' + permError.message);
      }
      
      // Safely handle and type the permission response
      let accessResponse: PermissionResponse;
      
      if (!permData) {
        accessResponse = { has_permission: false, reason: 'No response from permission check' };
      } else if (Array.isArray(permData)) {
        // Handle array response (unlikely but possible)
        accessResponse = permData.length > 0 && typeof permData[0] === 'object' && permData[0] !== null && 'has_permission' in permData[0]
          ? { has_permission: !!permData[0].has_permission, reason: String(permData[0].reason || '') }
          : { has_permission: false, reason: 'Invalid response format (array)' };
      } else if (typeof permData === 'object' && permData !== null) {
        // Handle object response (expected format)
        accessResponse = 'has_permission' in permData
          ? { has_permission: !!permData.has_permission, reason: String(permData.reason || '') }
          : { has_permission: false, reason: 'Invalid response format (object without has_permission)' };
      } else {
        accessResponse = { has_permission: false, reason: 'Unexpected response format: ' + typeof permData };
      }
      
      if (!accessResponse.has_permission) {
        console.error('User does not have access to this equipment. Reason:', accessResponse.reason);
        throw new Error('You do not have permission to view this equipment');
      }
    } catch (permissionError) {
      console.error('Permission check failed with error:', permissionError);
      console.log('Attempting direct fallback query without permission check...');
      
      // Check if the equipment exists at least
      const { count, error: countError } = await supabase
        .from('equipment')
        .select('*', { count: 'exact', head: true })
        .eq('id', id)
        .is('deleted_at', null);
      
      if (countError || !count) {
        console.error('Equipment not found or access denied:', countError);
        throw new Error('Equipment not found or you do not have permission to view it');
      }
      
      // We'll continue with the query, but this is a fallback that might still fail
      // if RLS policies prevent access
    }
    
    // First fetch the equipment with new location fields
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
    
    // Check edit permissions - use direct database query for better performance
    let canEdit = false;
    try {
      const { data: editData, error: editPermError } = await supabase.rpc(
        'rpc_check_equipment_permission',
        { 
          user_id: authUserId, 
          action: 'edit',
          equipment_id: id
        }
      );
      
      if (editPermError) {
        console.error('Edit permission check failed:', editPermError);
        // Don't throw, just default to no edit permission
      } else {
        // Safely handle and type the edit permission response
        let editResponse: PermissionResponse;
        
        if (!editData) {
          editResponse = { has_permission: false, reason: 'No response from edit permission check' };
        } else if (Array.isArray(editData)) {
          // Handle array response (unlikely but possible)
          editResponse = editData.length > 0 && typeof editData[0] === 'object' && editData[0] !== null && 'has_permission' in editData[0]
            ? { has_permission: !!editData[0].has_permission, reason: String(editData[0].reason || '') }
            : { has_permission: false, reason: 'Invalid edit response format (array)' };
        } else if (typeof editData === 'object' && editData !== null) {
          // Handle object response (expected format)
          editResponse = 'has_permission' in editData
            ? { has_permission: !!editData.has_permission, reason: String(editData.reason || '') }
            : { has_permission: false, reason: 'Invalid edit response format (object without has_permission)' };
        } else {
          editResponse = { has_permission: false, reason: 'Unexpected edit response format: ' + typeof editData };
        }
        
        canEdit = editResponse.has_permission || false;
        console.log('Edit permission check result:', editResponse);
      }
    } catch (editError) {
      console.error('Failed to check edit permissions:', editError);
      // Default to no edit permissions on error
      canEdit = false;
    }
    
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
