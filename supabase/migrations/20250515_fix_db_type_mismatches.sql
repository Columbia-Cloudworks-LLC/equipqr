
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
  
  -- Get team's org ID safely (not through a join that could trigger RLS)
  SELECT org_id INTO v_team_org_id
  FROM public.team
  WHERE id = p_team_id::UUID;
  
  -- Same org is simplest check
  IF v_user_org_id = v_team_org_id THEN
    RETURN TRUE;
  END IF;
  
  -- Check team role using our safe function
  v_team_role := get_team_role_safe(p_user_id::UUID, p_team_id::UUID);
  
  -- If we got a role back, they can access the team
  RETURN v_team_role IS NOT NULL;
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

-- Fix the validate_team_access edge function SQL execution to properly cast UUID
CREATE OR REPLACE FUNCTION public.get_team_org(team_id_param uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT org_id FROM public.team WHERE id = team_id_param::UUID LIMIT 1;
$$;
