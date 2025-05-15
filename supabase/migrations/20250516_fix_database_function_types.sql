
-- Fix the check_team_access_nonrecursive function to handle proper UUID types
CREATE OR REPLACE FUNCTION public.check_team_access_nonrecursive(p_user_id uuid, p_team_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_org_id UUID;
  v_team_org_id UUID;
  v_team_role TEXT;
  v_app_user_id UUID;
BEGIN
  -- Get user's org ID safely
  SELECT org_id INTO v_user_org_id
  FROM public.user_profiles
  WHERE id = p_user_id::UUID;
  
  -- Get team's org ID safely
  SELECT org_id INTO v_team_org_id
  FROM public.team
  WHERE id = p_team_id::UUID;
  
  -- Same org is simplest check
  IF v_user_org_id = v_team_org_id THEN
    RETURN TRUE;
  END IF;
  
  -- Get app_user ID
  SELECT id INTO v_app_user_id
  FROM public.app_user
  WHERE auth_uid = p_user_id::UUID;
  
  IF v_app_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check team membership
  RETURN EXISTS (
    SELECT 1
    FROM public.team_member
    WHERE user_id = v_app_user_id::UUID AND team_id = p_team_id::UUID
  );
END;
$$;

-- Fix the get_team_role_safe function to properly handle UUID types
CREATE OR REPLACE FUNCTION public.get_team_role_safe(_user_id uuid, _team_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  app_user_id UUID;
  team_member_id UUID;
  role_value TEXT;
BEGIN
  -- First get the app_user.id that corresponds to this auth.users.id
  SELECT id INTO app_user_id
  FROM public.app_user
  WHERE auth_uid = _user_id::UUID
  LIMIT 1;
  
  IF app_user_id IS NULL THEN
    RETURN NULL; -- User not found in app_user table
  END IF;
  
  -- Get the team_member record for this user and team
  SELECT id INTO team_member_id
  FROM public.team_member
  WHERE user_id = app_user_id::UUID AND team_id = _team_id::UUID
  LIMIT 1;
  
  IF team_member_id IS NULL THEN
    RETURN NULL; -- User is not a member of this team
  END IF;
  
  -- Get the role for this team member
  SELECT role INTO role_value
  FROM public.team_roles
  WHERE team_member_id = team_member_id
  LIMIT 1;
  
  RETURN role_value; -- Will be NULL if no role found
END;
$$;

-- Fix the rpc_check_equipment_permission function's signature
CREATE OR REPLACE FUNCTION public.rpc_check_equipment_permission(user_id uuid, action text, team_id uuid DEFAULT NULL::uuid, equipment_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSONB;
  permission_data RECORD;
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
    -- For equipment editing - direct call without circular reference
    result := jsonb_build_object(
      'has_permission', public.can_edit_equipment(user_id, equipment_id)
    );
    
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
$$;

-- Fix the check_equipment_create_permission function to handle UUID types properly
CREATE OR REPLACE FUNCTION public.check_equipment_create_permission(p_user_id uuid, p_team_id uuid DEFAULT NULL::uuid, p_org_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(has_permission boolean, org_id uuid, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_org_id UUID;
  v_team_org_id UUID;
  v_app_user_id UUID;
  v_role TEXT;
  v_reason TEXT := 'unknown';
BEGIN  
  -- Get user's organization and app_user ID directly with proper UUID handling
  SELECT up.org_id INTO v_user_org_id
  FROM public.user_profiles up
  WHERE up.id = p_user_id::UUID;
  
  SELECT au.id INTO v_app_user_id
  FROM public.app_user au
  WHERE au.auth_uid = p_user_id::UUID;
  
  -- If user doesn't have a profile, deny access
  IF v_user_org_id IS NULL OR v_app_user_id IS NULL THEN
    has_permission := FALSE;
    reason := 'invalid_user';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Case 1: Using provided org_id
  IF p_org_id IS NOT NULL THEN
    -- Check if user is in this org
    IF v_user_org_id = p_org_id THEN
      -- Check if user has manager or owner role directly
      IF EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = p_user_id::UUID
        AND ur.org_id = p_org_id::UUID
        AND ur.role IN ('owner', 'manager', 'admin')
      ) THEN
        has_permission := TRUE;
        org_id := p_org_id;
        reason := 'org_role';
        RETURN NEXT;
        RETURN;
      END IF;
    END IF;
  END IF;
  
  -- Case 2: Using team_id
  IF p_team_id IS NOT NULL THEN
    -- Get team's organization directly
    SELECT t.org_id INTO v_team_org_id
    FROM public.team t
    WHERE t.id = p_team_id::UUID;
    
    IF v_team_org_id IS NULL THEN
      has_permission := FALSE;
      reason := 'invalid_team';
      RETURN NEXT;
      RETURN;
    END IF;
    
    -- If user belongs to same org as team
    IF v_user_org_id = v_team_org_id THEN
      has_permission := TRUE;
      org_id := v_team_org_id;
      reason := 'same_org';
      RETURN NEXT;
      RETURN;
    END IF;
    
    -- Check team role directly without circular refs
    SELECT tr.role INTO v_role
    FROM public.team_member tm
    JOIN public.team_roles tr ON tr.team_member_id = tm.id
    WHERE tm.user_id = v_app_user_id::UUID
    AND tm.team_id = p_team_id::UUID
    LIMIT 1;
    
    -- Check if role allows equipment creation
    IF v_role IN ('manager', 'owner', 'admin', 'creator') THEN
      has_permission := TRUE;
      org_id := v_team_org_id;
      reason := 'team_role';
      RETURN NEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Case 3: No team_id or org_id - use user's org
  IF p_team_id IS NULL AND p_org_id IS NULL THEN
    has_permission := TRUE;
    org_id := v_user_org_id;
    reason := 'default_org';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Default deny
  has_permission := FALSE;
  reason := 'no_permission';
  RETURN NEXT;
END;
$$;

-- Fix the get_team_org function to specify the correct parameter type
CREATE OR REPLACE FUNCTION public.get_team_org(team_id_param uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT org_id FROM public.team WHERE id = team_id_param::UUID LIMIT 1;
$$;
