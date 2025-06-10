
-- Comprehensive fix for UUID/character varying casting and column ambiguity issues
-- This migration fixes all affected functions to handle type casting properly

-- Fix the can_access_equipment function with proper type casting and column aliases
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
    -- Get app_user ID with explicit casting - FIX: Cast user_id to text for comparison
    SELECT au.id INTO v_app_user_id
    FROM public.app_user au
    WHERE au.auth_uid = user_id::text;
    
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

-- Fix the record_equipment_scan function with proper type casting
CREATE OR REPLACE FUNCTION public.record_equipment_scan(
  p_equipment_id UUID,
  p_user_id UUID,
  p_scan_data JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_has_permission BOOLEAN := FALSE;
  v_scan_id UUID;
  v_equipment_record RECORD;
  v_app_user_id UUID;
BEGIN
  -- First, validate that the equipment exists and is not deleted
  SELECT * INTO v_equipment_record
  FROM public.equipment
  WHERE id = p_equipment_id AND deleted_at IS NULL;
  
  IF v_equipment_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Equipment not found or has been deleted'
    );
  END IF;
  
  -- Check equipment access permission using our existing function
  SELECT public.can_access_equipment(p_user_id, p_equipment_id) INTO v_has_permission;
  
  IF NOT v_has_permission THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Access denied: User does not have permission to access this equipment',
      'reason', 'insufficient_permissions'
    );
  END IF;
  
  -- Convert auth user ID to app_user ID - FIX: Cast UUID to text for comparison
  SELECT au.id INTO v_app_user_id
  FROM public.app_user au
  WHERE au.auth_uid = p_user_id::text;
  
  -- Insert the scan record with all available data
  INSERT INTO public.scan_history (
    equipment_id,
    scanned_by_user_id,
    user_agent,
    device_type,
    browser_name,
    browser_version,
    operating_system,
    screen_resolution,
    latitude,
    longitude,
    location_accuracy,
    session_id,
    referrer_url,
    scan_method,
    device_fingerprint,
    timezone,
    language
  ) VALUES (
    p_equipment_id,
    v_app_user_id,
    p_scan_data->>'user_agent',
    p_scan_data->>'device_type',
    p_scan_data->>'browser_name',
    p_scan_data->>'browser_version',
    p_scan_data->>'operating_system',
    p_scan_data->>'screen_resolution',
    (p_scan_data->>'latitude')::NUMERIC,
    (p_scan_data->>'longitude')::NUMERIC,
    (p_scan_data->>'location_accuracy')::NUMERIC,
    p_scan_data->>'session_id',
    p_scan_data->>'referrer_url',
    COALESCE(p_scan_data->>'scan_method', 'qr_code'),
    p_scan_data->>'device_fingerprint',
    p_scan_data->>'timezone',
    p_scan_data->>'language'
  ) RETURNING id INTO v_scan_id;
  
  -- Update equipment location if location data is available and accurate
  IF (p_scan_data->>'latitude') IS NOT NULL 
     AND (p_scan_data->>'longitude') IS NOT NULL 
     AND (p_scan_data->>'location_accuracy')::NUMERIC < 100 
     AND v_equipment_record.location_override = false THEN
    
    UPDATE public.equipment 
    SET 
      last_scan_latitude = (p_scan_data->>'latitude')::NUMERIC,
      last_scan_longitude = (p_scan_data->>'longitude')::NUMERIC,
      last_scan_accuracy = (p_scan_data->>'location_accuracy')::NUMERIC,
      last_scan_timestamp = now(),
      last_scan_by_user_id = v_app_user_id,
      location_source = 'scan'
    WHERE id = p_equipment_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'scan_id', v_scan_id,
    'location_updated', (p_scan_data->>'latitude') IS NOT NULL AND v_equipment_record.location_override = false,
    'message', 'Scan recorded successfully'
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Failed to record scan: ' || SQLERRM
  );
END;
$function$;

-- Fix the can_view_scan_history function with proper type casting
CREATE OR REPLACE FUNCTION public.can_view_scan_history(p_user_id uuid, p_equipment_id uuid)
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
  WHERE e.id = p_equipment_id AND e.deleted_at IS NULL;
  
  IF v_equipment_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's organization with explicit table alias
  SELECT up.org_id INTO v_user_org_id
  FROM public.user_profiles up
  WHERE up.id = p_user_id;
  
  -- Get user's organization role with explicit table alias
  SELECT ur.role INTO v_org_role
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id AND ur.org_id = v_equipment_org_id;
  
  -- Organization owners and managers can always view scan history
  IF v_org_role IN ('owner', 'manager', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- If equipment has a team, check team role
  IF v_equipment_team_id IS NOT NULL THEN
    -- Get app_user ID with explicit casting - FIX: Cast user_id to text for comparison
    SELECT au.id INTO v_app_user_id
    FROM public.app_user au
    WHERE au.auth_uid = p_user_id::text;
    
    IF v_app_user_id IS NOT NULL THEN
      -- Get team role with explicit table aliases
      SELECT tr.role INTO v_team_role
      FROM public.team_member tm
      JOIN public.team_roles tr ON tr.team_member_id = tm.id
      WHERE tm.user_id = v_app_user_id AND tm.team_id = v_equipment_team_id;
      
      -- Technicians and managers can view scan history
      IF v_team_role IN ('manager', 'technician', 'admin', 'owner') THEN
        RETURN TRUE;
      END IF;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$function$;

-- Fix the get_equipment_scan_history function with proper type casting
CREATE OR REPLACE FUNCTION public.get_equipment_scan_history(
  p_equipment_id UUID,
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50
) RETURNS TABLE(
  id UUID,
  ts TIMESTAMP WITH TIME ZONE,
  scanned_by_user_id UUID,
  scanned_from_ip INET,
  user_agent TEXT,
  device_type TEXT,
  browser_name TEXT,
  browser_version TEXT,
  operating_system TEXT,
  screen_resolution TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  location_accuracy NUMERIC,
  session_id TEXT,
  referrer_url TEXT,
  scan_method TEXT,
  device_fingerprint TEXT,
  timezone TEXT,
  language TEXT,
  user_display_name TEXT,
  user_org_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_has_permission BOOLEAN := FALSE;
BEGIN
  -- Check if user can view scan history for this equipment
  SELECT public.can_view_scan_history(p_user_id, p_equipment_id) INTO v_has_permission;
  
  IF NOT v_has_permission THEN
    -- Return empty result set instead of error for cleaner handling
    RETURN;
  END IF;
  
  -- Return scan history with user and organization details
  RETURN QUERY
  SELECT 
    sh.id,
    sh.ts,
    sh.scanned_by_user_id,
    sh.scanned_from_ip,
    sh.user_agent,
    sh.device_type,
    sh.browser_name,
    sh.browser_version,
    sh.operating_system,
    sh.screen_resolution,
    sh.latitude,
    sh.longitude,
    sh.location_accuracy,
    sh.session_id,
    sh.referrer_url,
    sh.scan_method,
    sh.device_fingerprint,
    sh.timezone,
    sh.language,
    up.display_name as user_display_name,
    org.name as user_org_name
  FROM public.scan_history sh
  LEFT JOIN public.app_user au ON sh.scanned_by_user_id = au.id
  LEFT JOIN public.user_profiles up ON au.auth_uid::UUID = up.id
  LEFT JOIN public.organization org ON up.org_id = org.id
  WHERE sh.equipment_id = p_equipment_id
  ORDER BY sh.ts DESC
  LIMIT p_limit;
END;
$function$;

-- Fix the remove_organization_member function with proper type casting
CREATE OR REPLACE FUNCTION public.remove_organization_member(p_org_id uuid, p_user_id uuid, p_removed_by uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_target_role TEXT;
  v_remover_role TEXT;
  v_owner_count INTEGER;
  v_manager_count INTEGER;
  v_app_user_id UUID;
  v_teams_removed INTEGER := 0;
BEGIN
  -- Get the target user's role in the organization
  SELECT role INTO v_target_role
  FROM public.user_roles
  WHERE user_id = p_user_id AND org_id = p_org_id;
  
  -- Get the remover's role in the organization
  SELECT role INTO v_remover_role
  FROM public.user_roles
  WHERE user_id = p_removed_by AND org_id = p_org_id;
  
  -- Check if target user exists in organization
  IF v_target_role IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User is not a member of this organization'
    );
  END IF;
  
  -- Check if remover has permission (only owners and managers can remove members)
  IF v_remover_role NOT IN ('owner', 'manager') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient permissions to remove organization members'
    );
  END IF;
  
  -- Prevent removal of organization owner
  IF v_target_role = 'owner' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Cannot remove organization owner'
    );
  END IF;
  
  -- If removing a manager, ensure at least one manager remains
  IF v_target_role = 'manager' THEN
    SELECT COUNT(*) INTO v_manager_count
    FROM public.user_roles
    WHERE org_id = p_org_id 
    AND role IN ('owner', 'manager')
    AND user_id != p_user_id;
    
    IF v_manager_count = 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Cannot remove the last manager from the organization'
      );
    END IF;
  END IF;
  
  -- Get app_user ID for team membership removal - FIX: Add explicit UUID casting
  SELECT id INTO v_app_user_id
  FROM public.app_user
  WHERE auth_uid = p_user_id::text;
  
  -- Remove user from all teams in the organization
  IF v_app_user_id IS NOT NULL THEN
    -- Count teams the user will be removed from
    SELECT COUNT(DISTINCT tm.team_id) INTO v_teams_removed
    FROM public.team_member tm
    JOIN public.team t ON tm.team_id = t.id
    WHERE tm.user_id = v_app_user_id 
    AND t.org_id = p_org_id
    AND t.deleted_at IS NULL;
    
    -- Remove team roles first
    DELETE FROM public.team_roles tr
    WHERE tr.team_member_id IN (
      SELECT tm.id 
      FROM public.team_member tm
      JOIN public.team t ON tm.team_id = t.id
      WHERE tm.user_id = v_app_user_id 
      AND t.org_id = p_org_id
    );
    
    -- Remove team memberships
    DELETE FROM public.team_member tm
    WHERE tm.user_id = v_app_user_id 
    AND tm.team_id IN (
      SELECT t.id 
      FROM public.team t 
      WHERE t.org_id = p_org_id
    );
  END IF;
  
  -- Remove user's organization role
  DELETE FROM public.user_roles
  WHERE user_id = p_user_id AND org_id = p_org_id;
  
  -- If this was the user's primary organization, clear it from their profile
  UPDATE public.user_profiles
  SET org_id = NULL, default_org_id = NULL
  WHERE id = p_user_id AND org_id = p_org_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'teams_removed', v_teams_removed,
    'message', 'User successfully removed from organization and all associated teams'
  );
END;
$function$;

-- Fix the validate_team_access_with_org function with proper type casting
CREATE OR REPLACE FUNCTION public.validate_team_access_with_org(p_user_id uuid, p_team_id uuid)
 RETURNS TABLE(is_member boolean, has_org_access boolean, role text, team_org_id uuid, access_reason text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  WHERE id = p_team_id;
  
  -- Get user organization using explicit UUID casting
  SELECT org_id INTO v_user_org_id
  FROM public.user_profiles
  WHERE id = p_user_id;
  
  -- Check organization role - use table alias to avoid ambiguity
  SELECT ur.role INTO v_user_org_role
  FROM public.user_roles ur
  WHERE ur.user_id = p_user_id
  AND ur.org_id = v_team_org_id;
  
  -- Get app_user ID with explicit UUID casting - FIX: Cast to text for comparison
  SELECT au.id INTO v_app_user_id
  FROM public.app_user au
  WHERE au.auth_uid = p_user_id::text;
  
  -- Check team role - use table aliases to avoid ambiguity and explicit UUID casting
  SELECT tr.role INTO v_team_role
  FROM public.team_member tm
  JOIN public.team_roles tr ON tr.team_member_id = tm.id
  WHERE tm.user_id = v_app_user_id
  AND tm.team_id = p_team_id
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
$function$;

-- Fix the check_team_access_detailed function with proper type casting
CREATE OR REPLACE FUNCTION public.check_team_access_detailed(user_id uuid, team_id uuid)
 RETURNS TABLE(has_access boolean, access_reason text, user_org_id uuid, team_org_id uuid, is_team_member boolean, is_org_owner boolean, team_role text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_org_id UUID;
  v_team_org_id UUID;
  v_is_team_member BOOLEAN;
  v_is_org_owner BOOLEAN;
  v_team_role TEXT;
  v_access_reason TEXT := 'none';
  v_app_user_id UUID;
BEGIN
  -- Get app_user ID for this auth user - FIXED: explicit text casting for type safety
  SELECT id INTO v_app_user_id
  FROM public.app_user
  WHERE auth_uid = user_id::text
  LIMIT 1;

  -- Get the user's organization
  SELECT org_id INTO v_user_org_id
  FROM public.user_profiles
  WHERE id = user_id;
  
  -- Get the team's organization using helper function to avoid recursion
  SELECT public.get_team_org(team_id) INTO v_team_org_id;
  
  -- Check if user is a team member (without causing recursion)
  IF v_app_user_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 
      FROM public.team_member tm
      WHERE tm.user_id = v_app_user_id
      AND tm.team_id = check_team_access_detailed.team_id
    ) INTO v_is_team_member;
    
    IF v_is_team_member THEN
      -- Use our safe function to get the role - don't modify this function call
      SELECT public.get_team_role_safe(user_id, check_team_access_detailed.team_id) INTO v_team_role;
      v_access_reason := 'team_member';
    END IF;
  ELSE
    v_is_team_member := FALSE;
  END IF;
  
  -- Check if user is an org owner in the team's organization
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_roles 
    WHERE user_id = check_team_access_detailed.user_id
    AND org_id = v_team_org_id
    AND role = 'owner'
  ) INTO v_is_org_owner;
  
  IF v_is_org_owner THEN
    v_team_role := 'owner';
    v_access_reason := 'org_owner';
  END IF;
  
  -- Check if user is in the same organization as the team
  IF v_user_org_id = v_team_org_id AND NOT v_is_team_member AND NOT v_is_org_owner THEN
    v_access_reason := 'same_org';
  END IF;
  
  -- Determine if the user has access and why
  has_access := (v_is_team_member OR v_is_org_owner OR (v_user_org_id = v_team_org_id));
  access_reason := v_access_reason;
  user_org_id := v_user_org_id;
  team_org_id := v_team_org_id;
  is_team_member := v_is_team_member;
  is_org_owner := v_is_org_owner;
  team_role := v_team_role;
  
  RETURN NEXT;
END;
$function$;

-- Fix the get_team_role_safe function with proper type casting
CREATE OR REPLACE FUNCTION public.get_team_role_safe(_user_id uuid, _team_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  app_user_id UUID;
  team_member_id UUID;
  role_value TEXT;
BEGIN
  -- First get the app_user.id that corresponds to this auth.users.id - FIX: Cast to text
  SELECT id INTO app_user_id
  FROM public.app_user
  WHERE auth_uid = _user_id::text
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
$function$;
