
-- Fix Equipment Permission Parameter Conflicts and Ambiguity
-- This migration addresses the root cause of equipment loading failures

-- 1. Drop and recreate rpc_check_equipment_permission with proper parameter handling
DROP FUNCTION IF EXISTS public.rpc_check_equipment_permission(uuid, text, uuid, uuid);

CREATE OR REPLACE FUNCTION public.rpc_check_equipment_permission(
  p_user_id uuid, 
  p_action text, 
  p_team_id uuid DEFAULT NULL::uuid, 
  p_equipment_id uuid DEFAULT NULL::uuid
)
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
BEGIN
  RAISE NOTICE 'rpc_check_equipment_permission called: user_id=%, action=%, team_id=%, equipment_id=%',
    p_user_id, p_action, p_team_id, p_equipment_id;
  
  IF p_action = 'create' THEN
    -- For equipment creation
    SELECT * INTO permission_data
    FROM public.check_equipment_create_permission(p_user_id, p_team_id);
    
    result := jsonb_build_object(
      'has_permission', permission_data.has_permission, 
      'org_id', permission_data.org_id,
      'reason', permission_data.reason
    );
    
  ELSIF p_action = 'edit' AND p_equipment_id IS NOT NULL THEN
    -- Get equipment details with fully qualified column references
    SELECT eq.team_id, eq.org_id INTO v_equipment_team_id, v_equipment_org_id
    FROM public.equipment eq
    WHERE eq.id = p_equipment_id AND eq.deleted_at IS NULL;
    
    result := jsonb_build_object(
      'has_permission', public.can_edit_equipment(p_user_id, p_equipment_id),
      'org_id', v_equipment_org_id,
      'reason', CASE WHEN v_equipment_team_id IS NULL THEN 'unassigned_equipment' ELSE 'team_equipment' END
    );
    
  ELSIF p_action IN ('view', 'read', 'scan') AND p_equipment_id IS NOT NULL THEN
    -- Get equipment org for response with qualified column reference
    SELECT eq.org_id INTO v_equipment_org_id
    FROM public.equipment eq
    WHERE eq.id = p_equipment_id AND eq.deleted_at IS NULL;
    
    result := jsonb_build_object(
      'has_permission', public.can_access_equipment(p_user_id, p_equipment_id),
      'org_id', v_equipment_org_id,
      'reason', 'access_check'
    );
    
  ELSIF p_action = 'delete' AND p_equipment_id IS NOT NULL THEN
    -- For equipment deletion - check organization ownership
    SELECT eq.org_id INTO v_equipment_org_id
    FROM public.equipment eq
    WHERE eq.id = p_equipment_id AND eq.deleted_at IS NULL;
    
    -- Get user's organization with qualified column reference
    SELECT up.org_id INTO v_user_org_id
    FROM public.user_profiles up
    WHERE up.id = p_user_id;
    
    -- Only organization owners can delete equipment
    result := jsonb_build_object(
      'has_permission', v_user_org_id = v_equipment_org_id AND EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = p_user_id AND ur.org_id = v_equipment_org_id AND ur.role = 'owner'
      ),
      'org_id', v_equipment_org_id,
      'reason', 'delete_check'
    );
    
  ELSE
    -- Invalid action or missing parameters
    result := jsonb_build_object(
      'has_permission', false, 
      'reason', 'invalid_request',
      'error', 'Invalid action or missing required parameters'
    );
  END IF;
  
  RAISE NOTICE 'Permission check result: %', result;
  RETURN result;
END;
$function$;

-- 2. Update check_equipment_create_permission to use fully qualified parameter names
CREATE OR REPLACE FUNCTION public.check_equipment_create_permission(
  p_user_id uuid, 
  p_team_id uuid DEFAULT NULL::uuid, 
  p_org_id uuid DEFAULT NULL::uuid
)
 RETURNS TABLE(has_permission boolean, org_id uuid, reason text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_org_id UUID;
  v_team_org_id UUID;
  v_user_role TEXT;
  v_app_user_id UUID;
  v_team_role TEXT;
BEGIN
  -- Get user's organization with explicit table alias
  SELECT up.org_id INTO v_user_org_id
  FROM public.user_profiles up
  WHERE up.id = p_user_id;
  
  -- If no organization found for user, deny permission
  IF v_user_org_id IS NULL THEN
    has_permission := FALSE;
    org_id := NULL;
    reason := 'User not found or has no organization';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- If creating equipment not associated with a team
  IF p_team_id IS NULL THEN
    has_permission := TRUE;
    org_id := v_user_org_id;
    reason := 'User can create equipment in own organization';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Get team's organization with explicit table alias
  SELECT t.org_id INTO v_team_org_id
  FROM public.team t
  WHERE t.id = p_team_id AND t.deleted_at IS NULL;
  
  IF v_team_org_id IS NULL THEN
    has_permission := FALSE;
    org_id := NULL;
    reason := 'Team not found or deleted';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- If user belongs to same org as team
  IF v_user_org_id = v_team_org_id THEN
    has_permission := TRUE;
    org_id := v_user_org_id;
    reason := 'User in same organization as team';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Get app_user ID with explicit table alias
  SELECT au.id INTO v_app_user_id
  FROM public.app_user au
  WHERE au.auth_uid::UUID = p_user_id;
  
  IF v_app_user_id IS NULL THEN
    has_permission := FALSE;
    org_id := NULL;
    reason := 'App user record not found';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Check team role with explicit table aliases
  SELECT tr.role INTO v_team_role
  FROM public.team_member tm
  JOIN public.team_roles tr ON tr.team_member_id = tm.id
  WHERE tm.user_id = v_app_user_id
  AND tm.team_id = p_team_id
  LIMIT 1;
  
  -- Check if role allows equipment creation
  IF v_team_role IN ('manager', 'owner', 'admin', 'creator') THEN
    has_permission := TRUE;
    org_id := v_team_org_id;
    reason := 'User has team role that allows equipment creation';
  ELSE
    has_permission := FALSE;
    org_id := NULL;
    reason := COALESCE('Insufficient team role: ' || v_team_role, 'User not a team member');
  END IF;
  
  RETURN NEXT;
END;
$function$;

-- 3. Add diagnostic function for debugging permission issues
CREATE OR REPLACE FUNCTION public.debug_equipment_permission_chain(
  p_user_id uuid,
  p_equipment_id uuid
) RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result jsonb := '{}';
  v_equipment_record RECORD;
  v_user_org_id UUID;
  v_app_user_id UUID;
  v_team_role TEXT;
  v_org_role TEXT;
BEGIN
  -- Get equipment details
  SELECT eq.id, eq.name, eq.org_id, eq.team_id, eq.deleted_at
  INTO v_equipment_record
  FROM public.equipment eq
  WHERE eq.id = p_equipment_id;
  
  -- Get user organization
  SELECT up.org_id INTO v_user_org_id
  FROM public.user_profiles up
  WHERE up.id = p_user_id;
  
  -- Get app user ID
  SELECT au.id INTO v_app_user_id
  FROM public.app_user au
  WHERE au.auth_uid::UUID = p_user_id;
  
  -- Get organization role
  SELECT ur.role INTO v_org_role
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id AND ur.org_id = v_equipment_record.org_id;
  
  -- Get team role if equipment has team
  IF v_equipment_record.team_id IS NOT NULL AND v_app_user_id IS NOT NULL THEN
    SELECT tr.role INTO v_team_role
    FROM public.team_member tm
    JOIN public.team_roles tr ON tr.team_member_id = tm.id
    WHERE tm.user_id = v_app_user_id AND tm.team_id = v_equipment_record.team_id;
  END IF;
  
  -- Build comprehensive debug result
  v_result := jsonb_build_object(
    'equipment', jsonb_build_object(
      'id', v_equipment_record.id,
      'name', v_equipment_record.name,
      'org_id', v_equipment_record.org_id,
      'team_id', v_equipment_record.team_id,
      'is_deleted', v_equipment_record.deleted_at IS NOT NULL
    ),
    'user', jsonb_build_object(
      'id', p_user_id,
      'org_id', v_user_org_id,
      'app_user_id', v_app_user_id,
      'org_role', v_org_role,
      'team_role', v_team_role
    ),
    'permissions', jsonb_build_object(
      'can_access', public.can_access_equipment(p_user_id, p_equipment_id),
      'can_edit', public.can_edit_equipment(p_user_id, p_equipment_id),
      'same_org', v_user_org_id = v_equipment_record.org_id
    )
  );
  
  RETURN v_result;
END;
$function$;
