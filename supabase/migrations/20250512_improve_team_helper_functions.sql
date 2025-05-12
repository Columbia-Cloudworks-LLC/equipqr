
-- Create a more robust helper function to safely get a team's organization ID
CREATE OR REPLACE FUNCTION public.get_team_org(team_id_param UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.team WHERE id = team_id_param LIMIT 1;
$$;

-- Create an improved safe version of get_team_role that avoids recursion
-- This function checks if a user has a role in a team
-- It maps auth.users.id to app_user.id for proper lookups
CREATE OR REPLACE FUNCTION public.get_team_role_safe(_user_id UUID, _team_id UUID)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app_user_id UUID;
  team_member_id UUID;
  role_value TEXT;
BEGIN
  -- First get the app_user.id that corresponds to this auth.users.id
  SELECT id INTO app_user_id
  FROM public.app_user
  WHERE auth_uid = _user_id
  LIMIT 1;
  
  IF app_user_id IS NULL THEN
    RETURN NULL; -- User not found in app_user table
  END IF;
  
  -- Get the team_member record for this user and team
  SELECT id INTO team_member_id
  FROM public.team_member
  WHERE user_id = app_user_id AND team_id = _team_id
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
