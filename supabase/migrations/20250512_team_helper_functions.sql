
-- Create helper function to safely get a team's organization ID without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_team_org(team_id_param UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.team WHERE id = team_id_param LIMIT 1;
$$;

-- Create a safe version of get_team_role that doesn't trigger recursion
CREATE OR REPLACE FUNCTION public.get_team_role_safe(_user_id UUID, _team_id UUID)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tr.role
  FROM (
    SELECT id FROM public.app_user WHERE auth_uid = _user_id LIMIT 1
  ) au
  JOIN public.team_member tm ON tm.user_id = au.id
  JOIN public.team_roles tr ON tr.team_member_id = tm.id
  WHERE tm.team_id = _team_id
  LIMIT 1;
$$;
