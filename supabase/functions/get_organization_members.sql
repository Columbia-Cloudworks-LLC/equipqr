
-- This function retrieves all members of an organization with their user details and roles
CREATE OR REPLACE FUNCTION public.get_organization_members(org_id UUID)
RETURNS TABLE (
  id UUID,
  team_id UUID,
  user_id UUID,
  joined_at TIMESTAMPTZ,
  name TEXT,
  email TEXT,
  role TEXT,
  status TEXT
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    NULL::UUID as team_id, -- Not using teams for org members
    r.user_id,
    r.assigned_at as joined_at,
    p.display_name as name,
    au.email,
    r.role::TEXT,
    CASE WHEN au.last_sign_in_at IS NOT NULL THEN 'Active' ELSE 'Pending' END as status
  FROM
    public.user_roles r
    JOIN public.user_profiles p ON r.user_id = p.id
    JOIN auth.users au ON r.user_id = au.id
  WHERE
    r.org_id = get_organization_members.org_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_organization_members(UUID) TO authenticated;
