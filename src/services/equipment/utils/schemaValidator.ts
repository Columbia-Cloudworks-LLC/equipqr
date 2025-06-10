
import { supabase } from '@/integrations/supabase/client';

/**
 * Validate that the current user can access the equipment system
 */
export async function validateUserAccess(): Promise<{
  isValid: boolean;
  userId?: string;
  userOrg?: string;
  error?: string;
}> {
  try {
    // Check authentication
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.session?.user) {
      return {
        isValid: false,
        error: 'User not authenticated'
      };
    }
    
    const userId = session.session.user.id;
    
    // Check user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, org_id, display_name')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile) {
      return {
        isValid: false,
        userId,
        error: 'User profile not found'
      };
    }
    
    return {
      isValid: true,
      userId,
      userOrg: profile.org_id
    };
  } catch (error: any) {
    return {
      isValid: false,
      error: error.message
    };
  }
}

/**
 * Test basic database connectivity and permissions
 */
export async function testDatabaseAccess(): Promise<{
  canRead: boolean;
  canWrite: boolean;
  error?: string;
}> {
  try {
    const validation = await validateUserAccess();
    if (!validation.isValid) {
      return {
        canRead: false,
        canWrite: false,
        error: validation.error
      };
    }
    
    // Test read access
    const { error: readError } = await supabase
      .from('equipment')
      .select('id')
      .limit(1);
    
    const canRead = !readError;
    
    // Test basic function access
    const { error: functionError } = await supabase.rpc('can_create_equipment_safe', {
      p_user_id: validation.userId!,
      p_team_id: null
    });
    
    const canWrite = !functionError;
    
    return {
      canRead,
      canWrite,
      error: readError?.message || functionError?.message
    };
  } catch (error: any) {
    return {
      canRead: false,
      canWrite: false,
      error: error.message
    };
  }
}
