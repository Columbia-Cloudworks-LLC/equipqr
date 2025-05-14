
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { diagnoseOrganizationAccess } from '@/utils/diagnosisUtils';

/**
 * Runs comprehensive diagnostics on a user's organization access
 * Returns detailed information about potential issues
 */
export async function runOrganizationDiagnostics(userId: string) {
  try {
    console.log('Running organization diagnostics for user:', userId);
    
    // Get detailed diagnosis information
    const diagnosis = await diagnoseOrganizationAccess(userId);
    
    console.log('Organization diagnosis results:', diagnosis);
    
    return {
      success: diagnosis.issues.length === 0,
      diagnosis,
      message: diagnosis.issues.length === 0 
        ? "No issues found with organization access" 
        : `Found ${diagnosis.issues.length} potential issues with organization access`
    };
  } catch (error) {
    console.error('Error running organization diagnostics:', error);
    toast({
      title: "Diagnostics Error",
      description: "Failed to run organization diagnostics",
      variant: "destructive",
    });
    
    return {
      success: false,
      diagnosis: null,
      message: "Error running organization diagnostics"
    };
  }
}

/**
 * Attempts to fix common organization access issues
 */
export async function attemptOrganizationRepair(userId: string): Promise<boolean> {
  try {
    console.log('Attempting to repair organization access for user:', userId);
    
    // First run diagnostics to identify issues
    const { diagnosis } = await runOrganizationDiagnostics(userId);
    
    if (!diagnosis) {
      console.error('Failed to run diagnostics, cannot repair');
      return false;
    }
    
    let repairAttempted = false;
    
    // If user has no profile, try to create one
    if (!diagnosis.hasValidProfile && diagnosis.orgId) {
      console.log('Attempting to repair user profile with org_id:', diagnosis.orgId);
      
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          org_id: diagnosis.orgId,
          display_name: 'User', // Default name
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Failed to repair user profile:', error);
      } else {
        console.log('Successfully repaired user profile');
        repairAttempted = true;
      }
    }
    
    // If user has no roles, try to add a viewer role
    if (!diagnosis.hasValidRoles && diagnosis.orgId) {
      console.log('Attempting to add viewer role for user in org:', diagnosis.orgId);
      
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          org_id: diagnosis.orgId,
          role: 'viewer',
          assigned_by: userId,
          assigned_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Failed to add user role:', error);
      } else {
        console.log('Successfully added viewer role to user');
        repairAttempted = true;
      }
    }
    
    if (repairAttempted) {
      toast({
        title: "Repair Attempted",
        description: "Attempted to repair organization access. Please try refreshing.",
        variant: "default",
      });
      return true;
    } else {
      toast({
        title: "No Repairs Made",
        description: "Could not identify any fixable issues with organization access.",
        variant: "destructive",
      });
      return false;
    }
  } catch (error) {
    console.error('Error attempting organization repair:', error);
    toast({
      title: "Repair Error",
      description: "Failed to repair organization access",
      variant: "destructive",
    });
    return false;
  }
}
