
-- Fix RPC Check Equipment Permission Function
-- This migration fixes the incomplete function and type casting issues

CREATE OR REPLACE FUNCTION public.rpc_check_equipment_permission(user_id uuid, action text, team_id uuid DEFAULT NULL::uuid, equipment_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
  permission_data RECORD;
  v_equipment_team_id UUID;
  v_equipment_org_id UUID;
  v_user_org_id UUID;
  v_user_role TEXT;
BEGIN
  RAISE NOTICE 'rpc_check_equipment_permission called: user_id=%, action=%, team_id=%, equipment_id=%',
    user_id, action, team_id, equipment_id;
  
  IF action = 'create' THEN
    -- For equipment creation - use the fixed function
    SELECT * INTO permission_data
    FROM public.check_equipment_create_permission(user_id, team_id);
    
    result := jsonb_build_object(
      'has_permission', permission_data.has_permission, 
      'org_id', permission_data.org_id,
      'reason', permission_data.reason
    );
    
    RAISE NOTICE 'Create permission result: %', result;
    
  ELSIF action = 'edit' AND equipment_id IS NOT NULL THEN
    -- Get equipment details
    SELECT e.team_id, e.org_id INTO v_equipment_team_id, v_equipment_org_id
    FROM public.equipment e
    WHERE e.id = equipment_id AND e.deleted_at IS NULL;
    
    -- If unassigned equipment, use the specialized function
    IF v_equipment_team_id IS NULL THEN
      result := jsonb_build_object(
        'has_permission', public.can_edit_unassigned_equipment(user_id, equipment_id),
        'reason', 'unassigned_equipment'
      );
    ELSE
      result := jsonb_build_object(
        'has_permission', public.can_edit_equipment(user_id, equipment_id),
        'reason', 'team_equipment'
      );
    END IF;
    
    RAISE NOTICE 'Edit permission result: %', result;
    
  ELSIF action = 'delete' AND equipment_id IS NOT NULL THEN
    -- For equipment deletion - check organization ownership
    SELECT e.org_id INTO v_equipment_org_id
    FROM public.equipment e
    WHERE e.id = equipment_id AND e.deleted_at IS NULL;
    
    IF v_equipment_org_id IS NULL THEN
      result := jsonb_build_object(
        'has_permission', false,
        'reason', 'equipment_not_found'
      );
    ELSE
      -- Get user's organization and role
      SELECT up.org_id INTO v_user_org_id
      FROM public.user_profiles up
      WHERE up.id = user_id;
      
      SELECT ur.role INTO v_user_role
      FROM public.user_roles ur
      WHERE ur.user_id = user_id AND ur.org_id = v_equipment_org_id;
      
      -- Only owners and managers can delete equipment
      result := jsonb_build_object(
        'has_permission', (v_user_org_id = v_equipment_org_id AND v_user_role IN ('owner', 'manager')),
        'reason', 'delete_permission_check'
      );
    END IF;
    
    RAISE NOTICE 'Delete permission result: %', result;
    
  ELSIF action = 'view' OR action = 'read' THEN
    -- For viewing equipment
    IF equipment_id IS NOT NULL THEN
      result := jsonb_build_object(
        'has_permission', public.can_access_equipment(user_id, equipment_id),
        'reason', 'view_permission_check'
      );
    ELSE
      -- Generic view permission - check if user belongs to any organization
      SELECT up.org_id INTO v_user_org_id
      FROM public.user_profiles up
      WHERE up.id = user_id;
      
      result := jsonb_build_object(
        'has_permission', (v_user_org_id IS NOT NULL),
        'reason', 'general_view_permission'
      );
    END IF;
    
    RAISE NOTICE 'View permission result: %', result;
    
  ELSE
    -- Unsupported action
    result := jsonb_build_object(
      'has_permission', false,
      'reason', 'unsupported_action'
    );
    
    RAISE NOTICE 'Unsupported action: %', action;
  END IF;
  
  RETURN result;
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.rpc_check_equipment_permission(uuid, text, uuid, uuid) TO authenticated;
