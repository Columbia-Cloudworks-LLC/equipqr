
-- Fix the check_equipment_create_permission function to avoid ambiguous column references
CREATE OR REPLACE FUNCTION public.check_equipment_create_permission(p_user_id uuid, p_team_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(has_permission boolean, org_id uuid, reason text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_org_id UUID;
  v_team_org_id UUID;
  v_app_user_id UUID;
  v_team_role TEXT;
BEGIN
  -- Get user's organization ID with explicit table alias
  SELECT up.org_id INTO v_user_org_id
  FROM public.user_profiles up
  WHERE up.id = p_user_id;
  
  -- If no user profile found, return error
  IF v_user_org_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 'user_not_found'::text;
    RETURN;
  END IF;
  
  -- Case 1: No team specified - use user's organization
  IF p_team_id IS NULL THEN
    RETURN QUERY SELECT true, v_user_org_id, 'default_org'::text;
    RETURN;
  END IF;
  
  -- Case 2: Team specified - check team permissions
  -- Get team's organization ID with explicit table alias
  SELECT t.org_id INTO v_team_org_id
  FROM public.team t
  WHERE t.id = p_team_id AND t.deleted_at IS NULL;
  
  IF v_team_org_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 'team_not_found'::text;
    RETURN;
  END IF;
  
  -- Same organization check (fastest path)
  IF v_user_org_id = v_team_org_id THEN
    RETURN QUERY SELECT true, v_team_org_id, 'same_org'::text;
    RETURN;
  END IF;
  
  -- Get app_user ID with explicit table alias
  SELECT au.id INTO v_app_user_id
  FROM public.app_user au
  WHERE au.auth_uid::uuid = p_user_id;
  
  IF v_app_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 'app_user_not_found'::text;
    RETURN;
  END IF;
  
  -- Team role check for external team with explicit table aliases
  SELECT tr.role INTO v_team_role
  FROM public.team_member tm
  JOIN public.team_roles tr ON tr.team_member_id = tm.id
  WHERE tm.user_id = v_app_user_id
  AND tm.team_id = p_team_id;
  
  -- Check if role allows equipment creation
  IF v_team_role IN ('manager', 'owner', 'admin', 'creator') THEN
    RETURN QUERY SELECT true, v_team_org_id, 'team_role'::text;
    RETURN;
  END IF;
  
  -- Default: No permission
  RETURN QUERY SELECT false, NULL::uuid, 'insufficient_permission'::text;
END;
$function$;

-- Fix can_edit_equipment function to avoid ambiguous column references
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
  v_user_org_role TEXT;
BEGIN
  -- Get equipment details with explicit table alias
  SELECT e.org_id, e.team_id INTO v_equipment_org_id, v_equipment_team_id
  FROM public.equipment e
  WHERE e.id = p_equipment_id AND e.deleted_at IS NULL;
  
  -- If equipment doesn't exist or is deleted, deny access
  IF v_equipment_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's organization with explicit table alias
  SELECT up.org_id INTO v_user_org_id
  FROM public.user_profiles up
  WHERE up.id = p_user_id;
  
  -- Same organization check with admin role verification
  IF v_user_org_id = v_equipment_org_id THEN
    -- Get user's organization role with explicit table alias
    SELECT ur.role INTO v_user_org_role
    FROM public.user_roles ur
    WHERE ur.user_id = p_user_id AND ur.org_id = v_equipment_org_id;
    
    -- Organization owners and managers can edit equipment in their org
    IF v_user_org_role IN ('owner', 'manager', 'admin') THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- If equipment is not assigned to a team, only org admins can edit
  IF v_equipment_team_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get app_user ID with explicit table alias
  SELECT au.id INTO v_app_user_id
  FROM public.app_user au
  WHERE au.auth_uid::uuid = p_user_id;
  
  IF v_app_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check team role with explicit table aliases
  SELECT tr.role INTO v_team_role
  FROM public.team_member tm
  JOIN public.team_roles tr ON tr.team_member_id = tm.id
  WHERE tm.user_id = v_app_user_id
  AND tm.team_id = v_equipment_team_id;
  
  -- Check if role allows equipment editing
  RETURN v_team_role IN ('manager', 'owner', 'admin', 'creator');
END;
$function$;

-- Fix can_access_equipment function to avoid ambiguous column references
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
BEGIN
  -- Get equipment details with explicit table alias
  SELECT e.org_id, e.team_id INTO v_equipment_org_id, v_equipment_team_id
  FROM public.equipment e
  WHERE e.id = p_equipment_id AND e.deleted_at IS NULL;
  
  -- If equipment doesn't exist or is deleted, deny access
  IF v_equipment_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's organization with explicit table alias
  SELECT up.org_id INTO v_user_org_id
  FROM public.user_profiles up
  WHERE up.id = p_user_id;
  
  -- Same organization check (fastest path for access)
  IF v_user_org_id = v_equipment_org_id THEN
    RETURN TRUE;
  END IF;
  
  -- If equipment is not assigned to a team, only same org can access
  IF v_equipment_team_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get app_user ID with explicit table alias
  SELECT au.id INTO v_app_user_id
  FROM public.app_user au
  WHERE au.auth_uid::uuid = p_user_id;
  
  IF v_app_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check team membership with explicit table aliases
  SELECT tr.role INTO v_team_role
  FROM public.team_member tm
  JOIN public.team_roles tr ON tr.team_member_id = tm.id
  WHERE tm.user_id = v_app_user_id
  AND tm.team_id = v_equipment_team_id;
  
  -- Any team member can view equipment
  RETURN v_team_role IS NOT NULL;
END;
$function$;
