
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Cancel a pending invitation
 */
export async function cancelInvitation(invitationId: string) {
  try {
    const { error } = await supabase
      .from('team_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId);
      
    if (error) {
      console.error('Error cancelling invitation:', error);
      throw new Error(`Failed to cancel invitation: ${error.message}`);
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error in cancelInvitation:', error);
    throw new Error(`Failed to cancel invitation: ${error.message}`);
  }
}
