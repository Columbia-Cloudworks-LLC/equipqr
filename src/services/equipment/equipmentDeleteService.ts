
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { clearDashboardCache } from "@/services/dashboard/dashboardService";

/**
 * Soft delete equipment
 */
export async function deleteEquipment(id: string): Promise<boolean> {
  try {
    if (!id) {
      throw new Error('Equipment ID is required');
    }
    
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error('Authentication error: Please sign in again');
    }
    
    if (!sessionData?.session?.user) {
      throw new Error('User must be logged in to delete equipment');
    }
    
    const authUserId = sessionData.session.user.id;
    console.log('Delete request:', { equipmentId: id, userId: authUserId });
    
    // Check delete permission using the simplified approach
    const { data: permissionCheck, error: permissionError } = await supabase.functions.invoke('permissions', {
      body: {
        userId: authUserId,
        resource: 'equipment',
        action: 'delete',
        resourceId: id
      }
    });
    
    if (permissionError) {
      console.error('Permission check failed:', permissionError);
      throw new Error(`Permission check failed: ${permissionError.message}`);
    }
    
    console.log('Delete permission result:', permissionCheck);
    
    if (!permissionCheck?.has_permission) {
      const reason = permissionCheck?.reason || 'unknown reason';
      console.error('Delete permission denied:', { reason, userId: authUserId, equipmentId: id });
      
      // Provide more specific error messages
      if (reason.includes('not found')) {
        throw new Error('Equipment not found or has been deleted');
      } else if (reason.includes('organization')) {
        throw new Error('You can only delete equipment owned by your organization');
      } else if (reason.includes('role')) {
        throw new Error('Insufficient permissions: Only organization owners, managers, and admins can delete equipment');
      } else {
        throw new Error(`Delete permission denied: ${reason}`);
      }
    }
    
    console.log('Permission granted, proceeding with deletion');
    
    // Perform the soft delete
    const { error: deleteError } = await supabase
      .from('equipment')
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq('id', id);
      
    if (deleteError) {
      console.error('Database delete error:', deleteError);
      throw new Error(`Failed to delete equipment: ${deleteError.message}`);
    }
    
    console.log('Equipment successfully deleted:', id);
    
    // Clear dashboard cache to ensure fresh data on next load
    console.log('Clearing dashboard cache after equipment deletion');
    clearDashboardCache();
    
    toast.success('Equipment deleted successfully');
    return true;
  } catch (error) {
    console.error('Equipment deletion failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    toast.error('Failed to delete equipment', {
      description: errorMessage
    });
    throw error;
  }
}
