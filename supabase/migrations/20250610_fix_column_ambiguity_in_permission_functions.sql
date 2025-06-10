
-- Fix column ambiguity issues in equipment permission functions
-- This resolves the "column reference 'user_id' is ambiguous" PostgreSQL errors

-- Fix the check_equipment_create_permission function with proper table aliases
CREATE OR REPLACE FUNCTION public.check_equipment_create_permission(p_user_id uuid, p_team_id uuid DEFAULT NULL::uuid, p_org_id uuid DEFAULT NULL::uuid)
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

-- Also fix any other functions that might have similar ambiguity issues
-- Update the can_edit_equipment function with proper table aliases
CREATE OR REPLACE FUNCTION public.can_edit_equipment(p_user_id uuid, p_equipment_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_equipment_org_id UUID;
  v_equipment_team_id UUID;
  v_user_org_id UUID;
  v_app_user_id UUID;
  v_team_role TEXT;
  v_org_role TEXT;
BEGIN
  -- Get equipment details with explicit table alias
  SELECT e.org_id, e.team_id INTO v_equipment_org_id, v_equipment_team_id
  FROM public.equipment e
  WHERE e.id = p_equipment_id AND e.deleted_at IS NULL;
  
  IF v_equipment_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's organization with explicit table alias
  SELECT up.org_id INTO v_user_org_id
  FROM public.user_profiles up
  WHERE up.id = p_user_id;
  
  -- Get user's organization role with explicit table aliases
  SELECT ur.role INTO v_org_role
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id AND ur.org_id = v_equipment_org_id;
  
  -- Organization owners and managers can edit any equipment
  IF v_org_role IN ('owner', 'manager', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- If equipment is unassigned, use the dedicated function
  IF v_equipment_team_id IS NULL THEN
    RETURN public.can_edit_unassigned_equipment(p_user_id, p_equipment_id);
  END IF;
  
  -- Get app_user ID with explicit table alias
  SELECT au.id INTO v_app_user_id
  FROM public.app_user au
  WHERE au.auth_uid::UUID = p_user_id;
  
  IF v_app_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check team role with explicit table aliases
  SELECT tr.role INTO v_team_role
  FROM public.team_member tm
  JOIN public.team_roles tr ON tr.team_member_id = tm.id
  WHERE tm.user_id = v_app_user_id AND tm.team_id = v_equipment_team_id;
  
  -- Team managers and above can edit equipment
  RETURN v_team_role IN ('manager', 'owner', 'admin');
END;
$function$;

-- Update the can_access_equipment function with proper table aliases
CREATE OR REPLACE FUNCTION public.can_access_equipment(p_user_id uuid, p_equipment_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_equipment_org_id UUID;
  v_equipment_team_id UUID;
  v_user_org_id UUID;
  v_app_user_id UUID;
  v_team_role TEXT;
  v_org_role TEXT;
BEGIN
  -- Get equipment details with explicit table alias
  SELECT e.org_id, e.team_id INTO v_equipment_org_id, v_equipment_team_id
  FROM public.equipment e
  WHERE e.id = p_equipment_id AND e.deleted_at IS NULL;
  
  IF v_equipment_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's organization with explicit table alias
  SELECT up.org_id INTO v_user_org_id
  FROM public.user_profiles up
  WHERE up.id = p_user_id;
  
  -- Get user's organization role with explicit table aliases
  SELECT ur.role INTO v_org_role
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id AND ur.org_id = v_equipment_org_id;
  
  -- Organization members can view equipment in their org
  IF v_org_role IS NOT NULL THEN
    RETURN TRUE;
  END IF;
  
  -- If equipment has a team, check team membership
  IF v_equipment_team_id IS NOT NULL THEN
    -- Get app_user ID with explicit table alias
    SELECT au.id INTO v_app_user_id
    FROM public.app_user au
    WHERE au.auth_uid::UUID = p_user_id;
    
    IF v_app_user_id IS NOT NULL THEN
      -- Check if user is a team member with explicit table aliases
      RETURN EXISTS (
        SELECT 1
        FROM public.team_member tm
        WHERE tm.user_id = v_app_user_id AND tm.team_id = v_equipment_team_id
      );
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$function$;

-- Add a new enhanced logging function for debugging permission issues
CREATE OR REPLACE FUNCTION public.log_permission_debug(
  p_function_name text,
  p_user_id uuid,
  p_equipment_id uuid DEFAULT NULL,
  p_team_id uuid DEFAULT NULL,
  p_result boolean DEFAULT NULL,
  p_details jsonb DEFAULT NULL
) RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Log permission check details for debugging
  INSERT INTO public.audit_log (
    action,
    entity_type,
    entity_id,
    actor_user_id,
    after_json
  ) VALUES (
    'permission_debug',
    'permission_check',
    COALESCE(p_equipment_id, p_team_id, gen_random_uuid()),
    p_user_id,
    jsonb_build_object(
      'function_name', p_function_name,
      'user_id', p_user_id,
      'equipment_id', p_equipment_id,
      'team_id', p_team_id,
      'result', p_result,
      'details', p_details,
      'timestamp', now()
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Silently fail if logging doesn't work
  NULL;
END;
$function$;

