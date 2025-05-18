
-- Improved get_team_members_with_roles function that handles type conversions correctly

CREATE OR REPLACE FUNCTION public.get_team_members_with_roles(_team_id UUID)
RETURNS TABLE(
  id UUID,
  team_id UUID,
  user_id UUID,
  joined_at TIMESTAMP WITH TIME ZONE,
  name TEXT,
  email TEXT,
  role TEXT,
  status TEXT,
  auth_uid TEXT
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    tm.id,
    tm.team_id,
    tm.user_id,
    tm.joined_at,
    up.display_name as name,
    au.email,
    COALESCE(tr.role, 'viewer') as role,
    CASE WHEN au.last_sign_in_at IS NOT NULL THEN 'Active' ELSE 'Pending' END as status,
    app_u.auth_uid::TEXT -- Explicitly cast UUID to TEXT
  FROM
    public.team_member tm
    LEFT JOIN public.team_roles tr ON tr.team_member_id = tm.id
    JOIN public.app_user app_u ON tm.user_id = app_u.id
    JOIN auth.users au ON app_u.auth_uid = au.id::TEXT -- Explicitly handle conversion
    LEFT JOIN public.user_profiles up ON au.id = up.id
  WHERE
    tm.team_id = _team_id;
END;
$$;
