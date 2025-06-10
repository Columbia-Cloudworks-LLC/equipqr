
-- Fix Equipment Create Permission Type Casting
-- This migration fixes the type mismatch between UUID and VARCHAR in the permission check

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
  
  -- Get app_user ID with FIXED type casting - cast UUID to TEXT
  SELECT au.id INTO v_app_user_id
  FROM public.app_user au
  WHERE au.auth_uid = p_user_id::TEXT;
  
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

-- Also fix the can_access_equipment function which has the same issue
CREATE OR REPLACE FUNCTION public.can_access_equipment(user_id uuid, equipment_id uuid)
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
  WHERE e.id = equipment_id AND e.deleted_at IS NULL;
  
  IF v_equipment_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's organization with explicit table alias
  SELECT up.org_id INTO v_user_org_id
  FROM public.user_profiles up
  WHERE up.id = user_id;
  
  -- Get user's organization role with explicit table alias
  SELECT ur.role INTO v_org_role
  FROM public.user_roles ur
  WHERE ur.user_id = user_id AND ur.org_id = v_equipment_org_id;
  
  -- Organization owners, managers, and technicians can access equipment
  IF v_org_role IN ('owner', 'manager', 'technician', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- If equipment has a team, check team access
  IF v_equipment_team_id IS NOT NULL THEN
    -- FIXED: Cast user_id to TEXT for comparison with auth_uid (VARCHAR)
    SELECT au.id INTO v_app_user_id
    FROM public.app_user au
    WHERE au.auth_uid = user_id::TEXT;
    
    IF v_app_user_id IS NOT NULL THEN
      -- Get team role with explicit table aliases
      SELECT tr.role INTO v_team_role
      FROM public.team_member tm
      JOIN public.team_roles tr ON tr.team_member_id = tm.id
      WHERE tm.user_id = v_app_user_id AND tm.team_id = v_equipment_team_id;
      
      -- Team members with appropriate roles can access equipment
      IF v_team_role IN ('manager', 'technician', 'admin', 'owner', 'viewer') THEN
        RETURN TRUE;
      END IF;
    END IF;
  END IF;
  
  -- If user is in the same organization but no specific permissions, allow basic access
  IF v_user_org_id = v_equipment_org_id THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$function$;

-- Also fix the can_edit_equipment function for consistency
CREATE OR REPLACE FUNCTION public.can_edit_equipment(user_id uuid, equipment_id uuid)
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
  WHERE e.id = equipment_id AND e.deleted_at IS NULL;
  
  IF v_equipment_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's organization with explicit table alias  
  SELECT up.org_id INTO v_user_org_id
  FROM public.user_profiles up
  WHERE up.id = user_id;
  
  -- Get user's organization role with explicit table alias
  SELECT ur.role INTO v_org_role
  FROM public.user_roles ur
  WHERE ur.user_id = user_id AND ur.org_id = v_equipment_org_id;
  
  -- Organization owners and managers can edit any equipment in their org
  IF v_org_role IN ('owner', 'manager') THEN
    RETURN TRUE;
  END IF;
  
  -- If equipment has a team, check team role
  IF v_equipment_team_id IS NOT NULL THEN
    -- FIXED: Cast user_id to TEXT for comparison with auth_uid (VARCHAR)
    SELECT au.id INTO v_app_user_id
    FROM public.app_user au
    WHERE au.auth_uid = user_id::TEXT;
    
    IF v_app_user_id IS NOT NULL THEN
      -- Get team role with explicit table aliases
      SELECT tr.role INTO v_team_role
      FROM public.team_member tm
      JOIN public.team_roles tr ON tr.team_member_id = tm.id
      WHERE tm.user_id = v_app_user_id AND tm.team_id = v_equipment_team_id;
      
      -- Team managers can edit team equipment
      IF v_team_role IN ('manager', 'owner', 'admin') THEN
        RETURN TRUE;
      END IF;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$function$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_equipment_create_permission(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_equipment(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_equipment(uuid, uuid) TO authenticated;
