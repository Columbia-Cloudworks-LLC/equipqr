
-- Create a simplified database function to check equipment creation permission
-- This function avoids recursive calls and explicitly handles type casting
CREATE OR REPLACE FUNCTION public.simplified_equipment_create_permission(
  p_user_id UUID,
  p_team_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_org_id UUID;
  v_app_user_id UUID;
  v_team_org_id UUID;
  v_team_role TEXT;
  v_result JSONB;
BEGIN
  -- Get user's organization ID directly (explicit cast for safety)
  SELECT org_id INTO v_user_org_id
  FROM public.user_profiles
  WHERE id = p_user_id;
  
  -- If no user profile found, return error
  IF v_user_org_id IS NULL THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'user_not_found'
    );
  END IF;
  
  -- Get app_user ID with explicit UUID handling
  SELECT id INTO v_app_user_id
  FROM public.app_user
  WHERE auth_uid = p_user_id::TEXT;
  
  -- Case 1: No team specified - use user's organization
  IF p_team_id IS NULL THEN
    RETURN jsonb_build_object(
      'can_create', true,
      'org_id', v_user_org_id,
      'reason', 'default_org'
    );
  END IF;
  
  -- Case 2: Team specified - check team permissions
  -- Get team's organization ID
  SELECT org_id INTO v_team_org_id
  FROM public.team
  WHERE id = p_team_id;
  
  IF v_team_org_id IS NULL THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'team_not_found'
    );
  END IF;
  
  -- Same organization check (fastest path)
  IF v_user_org_id = v_team_org_id THEN
    RETURN jsonb_build_object(
      'can_create', true,
      'org_id', v_team_org_id,
      'reason', 'same_org'
    );
  END IF;
  
  -- Team role check for external team
  -- Explicitly handle the join to avoid UUID comparison issues
  SELECT tr.role INTO v_team_role
  FROM public.team_member tm
  JOIN public.team_roles tr ON tr.team_member_id = tm.id
  WHERE tm.user_id = v_app_user_id
  AND tm.team_id = p_team_id;
  
  -- Check if role allows equipment creation
  IF v_team_role IN ('manager', 'owner', 'admin', 'creator') THEN
    RETURN jsonb_build_object(
      'can_create', true,
      'org_id', v_team_org_id,
      'reason', 'team_role'
    );
  END IF;
  
  -- Default: No permission
  RETURN jsonb_build_object(
    'can_create', false,
    'reason', 'insufficient_permission'
  );
END;
$$;
