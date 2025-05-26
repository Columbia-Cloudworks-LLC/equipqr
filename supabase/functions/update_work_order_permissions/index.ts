
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
    
    console.log('Updating work order permission functions...');
    
    // Update can_submit_work_orders function to include requestor role
    const { error: submitError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.can_submit_work_orders(p_user_id uuid, p_equipment_id uuid)
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path TO 'public'
        AS $function$
        DECLARE
            v_equipment_org_id UUID;
            v_equipment_team_id UUID;
            v_app_user_id UUID;
            v_team_role TEXT;
        BEGIN
            -- Get equipment details
            SELECT org_id, team_id INTO v_equipment_org_id, v_equipment_team_id
            FROM equipment
            WHERE id = p_equipment_id AND deleted_at IS NULL;
            
            IF v_equipment_org_id IS NULL THEN
                RETURN FALSE;
            END IF;
            
            -- Check org-level permissions
            IF EXISTS (
                SELECT 1 FROM user_roles
                WHERE user_id = p_user_id
                AND org_id = v_equipment_org_id
                AND role IN ('owner', 'manager', 'technician')
            ) THEN
                RETURN TRUE;
            END IF;
            
            -- Check team-level permissions if equipment is assigned to a team
            IF v_equipment_team_id IS NOT NULL THEN
                SELECT id INTO v_app_user_id
                FROM app_user
                WHERE auth_uid = p_user_id;
                
                IF v_app_user_id IS NOT NULL THEN
                    SELECT tr.role INTO v_team_role
                    FROM team_member tm
                    JOIN team_roles tr ON tr.team_member_id = tm.id
                    WHERE tm.user_id = v_app_user_id
                    AND tm.team_id = v_equipment_team_id;
                    
                    RETURN v_team_role IN ('manager', 'owner', 'admin', 'technician', 'requestor');
                END IF;
            END IF;
            
            RETURN FALSE;
        END;
        $function$
      `
    });

    if (submitError) {
      console.error('Error updating can_submit_work_orders:', submitError);
      throw submitError;
    }

    // Create new can_view_work_orders function for viewing work orders
    const { error: viewError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION public.can_view_work_orders(p_user_id uuid, p_equipment_id uuid)
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path TO 'public'
        AS $function$
        DECLARE
            v_equipment_org_id UUID;
            v_equipment_team_id UUID;
            v_app_user_id UUID;
            v_team_role TEXT;
        BEGIN
            -- Get equipment details
            SELECT org_id, team_id INTO v_equipment_org_id, v_equipment_team_id
            FROM equipment
            WHERE id = p_equipment_id AND deleted_at IS NULL;
            
            IF v_equipment_org_id IS NULL THEN
                RETURN FALSE;
            END IF;
            
            -- Check org-level permissions
            IF EXISTS (
                SELECT 1 FROM user_roles
                WHERE user_id = p_user_id
                AND org_id = v_equipment_org_id
                AND role IN ('owner', 'manager', 'technician')
            ) THEN
                RETURN TRUE;
            END IF;
            
            -- Check team-level permissions if equipment is assigned to a team
            IF v_equipment_team_id IS NOT NULL THEN
                SELECT id INTO v_app_user_id
                FROM app_user
                WHERE auth_uid = p_user_id;
                
                IF v_app_user_id IS NOT NULL THEN
                    SELECT tr.role INTO v_team_role
                    FROM team_member tm
                    JOIN team_roles tr ON tr.team_member_id = tm.id
                    WHERE tm.user_id = v_app_user_id
                    AND tm.team_id = v_equipment_team_id;
                    
                    -- Requestors can view work orders but not manage them
                    RETURN v_team_role IN ('manager', 'owner', 'admin', 'technician', 'requestor', 'viewer');
                END IF;
            END IF;
            
            RETURN FALSE;
        END;
        $function$
      `
    });

    if (viewError) {
      console.error('Error creating can_view_work_orders:', viewError);
      throw viewError;
    }

    console.log('Work order permission functions updated successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Work order permission functions updated successfully' 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error('Error updating work order permissions:', error);
    return new Response(
      JSON.stringify({ 
        error: `Failed to update work order permissions: ${error.message}` 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    );
  }
});
