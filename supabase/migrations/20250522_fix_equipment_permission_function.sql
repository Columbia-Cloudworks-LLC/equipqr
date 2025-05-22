
-- Fix the rpc_check_equipment_permission function to properly qualify column references
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
BEGIN
  RAISE NOTICE 'rpc_check_equipment_permission called: user_id=%, action=%, team_id=%, equipment_id=%',
    user_id, action, team_id, equipment_id;
  
  IF action = 'create' THEN
    -- For equipment creation - direct call without circular reference
    SELECT * INTO permission_data
    FROM public.check_equipment_create_permission(user_id, team_id);
    
    -- Build result object with explicit keys
    result := jsonb_build_object(
      'has_permission', permission_data.has_permission, 
      'org_id', permission_data.org_id,
      'reason', permission_data.reason
    );
    
    RAISE NOTICE 'Create permission result: %', result;
  ELSIF action = 'edit' AND equipment_id IS NOT NULL THEN
    -- First check if this is unassigned equipment
    -- Explicitly qualify the team_id column with table alias to avoid ambiguity
    SELECT e.team_id INTO v_equipment_team_id
    FROM public.equipment e
    WHERE e.id = equipment_id AND e.deleted_at IS NULL;
    
    -- If unassigned equipment, use the specialized function
    IF v_equipment_team_id IS NULL THEN
      result := jsonb_build_object(
        'has_permission', public.can_edit_unassigned_equipment(user_id, equipment_id),
        'reason', 'unassigned_equipment'
      );
    ELSE
      -- For equipment editing with team - direct call without circular reference
      result := jsonb_build_object(
        'has_permission', public.can_edit_equipment(user_id, equipment_id),
        'reason', 'team_equipment'
      );
    END IF;
    
    RAISE NOTICE 'Edit permission result: %', result;
  ELSIF action = 'view' AND equipment_id IS NOT NULL THEN
    -- For equipment viewing - direct call without circular reference
    result := jsonb_build_object(
      'has_permission', public.can_access_equipment(user_id, equipment_id)
    );
    
    RAISE NOTICE 'View permission result: %', result;
  ELSE
    -- Invalid action or missing parameters
    result := jsonb_build_object('has_permission', false, 'reason', 'invalid_request');
    RAISE NOTICE 'Invalid request: %', result;
  END IF;
  
  RETURN result;
END;
$function$;

-- Ensure we handle the ambiguous column reference in other functions too
CREATE OR REPLACE FUNCTION public.can_edit_unassigned_equipment(user_id uuid, equipment_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_org_id UUID;
  v_equipment_org_id UUID;
  v_equipment_team_id UUID;
  v_user_role TEXT;
BEGIN
  -- Get user's organization
  SELECT org_id INTO v_user_org_id
  FROM public.user_profiles
  WHERE id = user_id;
  
  -- Get equipment details with explicit table alias
  SELECT e.org_id, e.team_id INTO v_equipment_org_id, v_equipment_team_id
  FROM public.equipment e
  WHERE e.id = equipment_id AND e.deleted_at IS NULL;
  
  -- If equipment doesn't exist or is deleted, deny access
  IF v_equipment_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If equipment is assigned to a team, use regular permission checks
  IF v_equipment_team_id IS NOT NULL THEN
    RETURN FALSE; -- Let the regular team permission check handle this
  END IF;
  
  -- For unassigned equipment, check if user is in the same org
  IF v_user_org_id != v_equipment_org_id THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's role in the organization
  SELECT role INTO v_user_role
  FROM public.user_roles
  WHERE user_id = user_id AND org_id = v_equipment_org_id;
  
  -- Only owners and managers can edit unassigned equipment
  RETURN v_user_role IN ('owner', 'manager');
END;
$function$;
