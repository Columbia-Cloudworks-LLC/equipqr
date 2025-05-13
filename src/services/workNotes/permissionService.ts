
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types/supabase-enums";

/**
 * Check if the current user has permission to manage work notes
 * for a specific equipment
 */
export async function canManageWorkNotes(equipmentId: string): Promise<boolean> {
  try {
    // Get current user's auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      return false;
    }
    
    const userId = sessionData.session.user.id;
    
    // Get equipment details
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select(`
        team_id,
        org_id,
        team:team_id (org_id)
      `)
      .eq('id', equipmentId)
      .maybeSingle();
      
    if (equipmentError || !equipment) {
      console.error('Error fetching equipment:', equipmentError);
      return false;
    }
    
    // Get user's organization
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError);
      return false;
    }
    
    // If user is from the same organization as the equipment
    if (userProfile.org_id === equipment.org_id) {
      // Users can manage notes for equipment in their own org
      return true;
    }
    
    // For team equipment, check if user has team access with manage permissions
    if (equipment.team_id) {
      // Get the team's organization ID
      const teamOrgId = equipment.team?.org_id;
      
      // Check if the user has an org-level role
      const { data: orgRole } = await supabase.rpc(
        'get_user_role',
        { _user_id: userId, _org_id: teamOrgId }
      );
      
      // Organization owners can manage all notes
      if (orgRole === 'owner') {
        return true;
      }
      
      // Check team role using RPC function
      try {
        const { data: teamRole } = await supabase.rpc(
          'get_team_role',
          { _user_id: userId, _team_id: equipment.team_id }
        );
        
        // Team managers can manage work notes
        if (teamRole === 'manager') {
          return true;
        }
      } catch (error) {
        console.error('Error checking team role:', error);
      }
    }
    
    // By default, deny manage access
    return false;
  } catch (error) {
    console.error('Exception in canManageWorkNotes:', error);
    return false;
  }
}

/**
 * Check if the current user has permission to create work notes
 * for a specific equipment
 */
export async function canCreateWorkNotes(equipmentId: string): Promise<boolean> {
  try {
    // Get current user's auth ID
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      return false;
    }
    
    const userId = sessionData.session.user.id;
    
    // Get equipment details
    const { data: equipment, error: equipmentError } = await supabase
      .from('equipment')
      .select(`
        team_id,
        org_id,
        team:team_id (org_id)
      `)
      .eq('id', equipmentId)
      .maybeSingle();
      
    if (equipmentError || !equipment) {
      console.error('Error fetching equipment:', equipmentError);
      return false;
    }
    
    // Get user's organization
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('org_id')
      .eq('id', userId)
      .maybeSingle();
      
    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError);
      return false;
    }
    
    // If user is from the same organization as the equipment
    if (userProfile.org_id === equipment.org_id) {
      // Users can create notes for equipment in their own org
      return true;
    }
    
    // For team equipment, check if user has team access
    if (equipment.team_id) {
      // Get the team's organization ID
      const teamOrgId = equipment.team?.org_id;
      
      // Check if the user has an org-level role
      const { data: orgRole } = await supabase.rpc(
        'get_user_role',
        { _user_id: userId, _org_id: teamOrgId }
      );
      
      // Organization owners can create notes
      if (orgRole === 'owner') {
        return true;
      }
      
      // Check team role using RPC function
      try {
        const { data: teamRole } = await supabase.rpc(
          'get_team_role',
          { _user_id: userId, _team_id: equipment.team_id }
        );
        
        // Team managers and technicians can create work notes
        if (teamRole === 'manager' || teamRole === 'technician') {
          return true;
        }
      } catch (error) {
        console.error('Error checking team role:', error);
      }
      
      // Check for cross-organization access
      const { data: crossOrgAccess } = await supabase
        .from('organization_acl')
        .select('role')
        .eq('subject_id', userId)
        .eq('subject_type', 'user')
        .eq('org_id', teamOrgId)
        .or('expires_at.gt.now,expires_at.is.null')
        .maybeSingle();
      
      // Users with cross-org access as managers or technicians can create notes
      if (crossOrgAccess && (crossOrgAccess.role === 'manager' || crossOrgAccess.role === 'technician')) {
        return true;
      }
    }
    
    // By default, deny create access
    return false;
  } catch (error) {
    console.error('Exception in canCreateWorkNotes:', error);
    return false;
  }
}
