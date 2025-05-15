
-- Create a non-recursive function for checking team access
CREATE OR REPLACE FUNCTION public.check_team_access_nonrecursive(p_user_id UUID, p_team_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
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
  WHERE id = p_user_id;
  
  -- Get team's org ID safely (not through a join that could trigger RLS)
  SELECT org_id INTO v_team_org_id
  FROM public.team
  WHERE id = p_team_id;
  
  -- Same org is simplest check
  IF v_user_org_id = v_team_org_id THEN
    RETURN TRUE;
  END IF;
  
  -- Get app_user ID
  SELECT id INTO v_app_user_id 
  FROM public.app_user 
  WHERE auth_uid = p_user_id;
  
  IF v_app_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user is a team member directly
  RETURN EXISTS (
    SELECT 1 
    FROM public.team_member 
    WHERE user_id = v_app_user_id AND team_id = p_team_id
  );
END;
$$;
