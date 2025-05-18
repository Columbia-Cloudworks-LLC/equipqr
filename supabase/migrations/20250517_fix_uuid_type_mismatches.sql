
-- Fix the validate_team_access_with_org function to properly handle UUID types
CREATE OR REPLACE FUNCTION public.validate_team_access_with_org(p_user_id uuid, p_team_id uuid)
RETURNS TABLE(is_member boolean, has_org_access boolean, role text, team_org_id uuid, access_reason text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_app_user_id UUID;
  v_team_org_id UUID;
  v_user_org_id UUID;
  v_user_org_role TEXT;
  v_team_role TEXT;
  v_access_reason TEXT := 'none';
BEGIN
  -- Get team organization using explicit UUID casting
  SELECT org_id INTO v_team_org_id
  FROM public.team
  WHERE id = p_team_id::UUID;
  
  -- Get user organization using explicit UUID casting
  SELECT org_id INTO v_user_org_id
  FROM public.user_profiles
  WHERE id = p_user_id::UUID;
  
  -- Check organization role - use table alias to avoid ambiguity
  SELECT ur.role INTO v_user_org_role
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id::UUID
  AND ur.org_id = v_team_org_id;
  
  -- Get app_user ID with explicit UUID casting
  SELECT au.id INTO v_app_user_id
  FROM public.app_user au
  WHERE au.auth_uid::UUID = p_user_id::UUID;
  
  -- Check team role - use table aliases to avoid ambiguity and explicit UUID casting
  SELECT tr.role INTO v_team_role
  FROM public.team_member tm
  JOIN public.team_roles tr ON tr.team_member_id = tm.id
  WHERE tm.user_id = v_app_user_id
  AND tm.team_id = p_team_id::UUID
  LIMIT 1;
  
  -- Determine access reason
  IF v_team_role IS NOT NULL THEN
    v_access_reason := 'team_member';
  ELSIF v_user_org_id = v_team_org_id THEN
    v_access_reason := 'same_org';
  END IF;
  
  -- Return team access information using variables instead of direct column references
  is_member := v_team_role IS NOT NULL;
  has_org_access := v_user_org_id = v_team_org_id;
  role := COALESCE(v_team_role, v_user_org_role);
  team_org_id := v_team_org_id;
  access_reason := v_access_reason;
  
  RETURN NEXT;
END;
$$;

-- Fix the get_team_org function with explicit UUID casting
CREATE OR REPLACE FUNCTION public.get_team_org(team_id_param uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT org_id FROM public.team WHERE id = team_id_param::UUID LIMIT 1;
$$;
