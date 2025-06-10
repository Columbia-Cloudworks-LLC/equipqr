
-- Phase 1: Comprehensive Equipment Function Cleanup
-- Fix all parameter naming conflicts and table alias issues

-- Drop problematic functions that have parameter conflicts
DROP FUNCTION IF EXISTS public.can_access_equipment(uuid, uuid);
DROP FUNCTION IF EXISTS public.can_edit_equipment(uuid, uuid);
DROP FUNCTION IF EXISTS public.record_equipment_scan(uuid, uuid, jsonb);
DROP FUNCTION IF EXISTS public.get_equipment_scan_history(uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.can_view_scan_history(uuid, uuid);

-- 1. Fixed can_access_equipment function with proper parameter naming
CREATE OR REPLACE FUNCTION public.can_access_equipment(p_user_id uuid, p_equipment_id uuid)
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
  
  -- Organization owners, managers, and technicians can access equipment
  IF v_org_role IN ('owner', 'manager', 'technician', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- If equipment has a team, check team access
  IF v_equipment_team_id IS NOT NULL THEN
    -- Get app_user ID with explicit casting
    SELECT au.id INTO v_app_user_id
    FROM public.app_user au
    WHERE au.auth_uid = p_user_id::text;
    
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

-- 2. Fixed record_equipment_scan function with proper parameter naming
CREATE OR REPLACE FUNCTION public.record_equipment_scan(
  p_equipment_id UUID,
  p_user_id UUID,
  p_scan_data JSONB DEFAULT '{}'::jsonb
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
  
  -- Convert auth user ID to app_user ID
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

-- 3. Fixed can_view_scan_history function with proper parameter naming
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
    -- Get app_user ID with explicit casting
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

-- 4. Fixed get_equipment_scan_history function with proper parameter naming
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

-- 5. Update the unified RPC function to handle all actions properly
CREATE OR REPLACE FUNCTION public.rpc_check_equipment_permission(
  p_user_id uuid, 
  p_action text, 
  p_team_id uuid DEFAULT NULL::uuid, 
  p_equipment_id uuid DEFAULT NULL::uuid
)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result JSONB;
  permission_data RECORD;
  v_equipment_team_id UUID;
  v_equipment_org_id UUID;
  v_user_org_id UUID;
BEGIN
  RAISE NOTICE 'rpc_check_equipment_permission called: user_id=%, action=%, team_id=%, equipment_id=%',
    p_user_id, p_action, p_team_id, p_equipment_id;
  
  IF p_action = 'create' THEN
    -- For equipment creation
    SELECT * INTO permission_data
    FROM public.check_equipment_create_permission(p_user_id, p_team_id);
    
    result := jsonb_build_object(
      'has_permission', permission_data.has_permission, 
      'org_id', permission_data.org_id,
      'reason', permission_data.reason
    );
    
  ELSIF p_action = 'edit' AND p_equipment_id IS NOT NULL THEN
    -- For equipment editing
    SELECT e.team_id, e.org_id INTO v_equipment_team_id, v_equipment_org_id
    FROM public.equipment e
    WHERE e.id = p_equipment_id AND e.deleted_at IS NULL;
    
    IF v_equipment_team_id IS NULL THEN
      result := jsonb_build_object(
        'has_permission', public.can_edit_unassigned_equipment(p_user_id, p_equipment_id),
        'reason', 'unassigned_equipment'
      );
    ELSE
      result := jsonb_build_object(
        'has_permission', public.can_edit_equipment(p_user_id, p_equipment_id),
        'reason', 'team_equipment'
      );
    END IF;
    
  ELSIF p_action = 'view' AND p_equipment_id IS NOT NULL THEN
    -- For equipment viewing
    result := jsonb_build_object(
      'has_permission', public.can_access_equipment(p_user_id, p_equipment_id),
      'reason', 'access_check'
    );
    
  ELSIF p_action = 'scan' AND p_equipment_id IS NOT NULL THEN
    -- For equipment scanning (same as view)
    result := jsonb_build_object(
      'has_permission', public.can_access_equipment(p_user_id, p_equipment_id),
      'reason', 'scan_access'
    );
    
  ELSE
    result := jsonb_build_object(
      'has_permission', false,
      'reason', 'invalid_action_or_missing_parameters'
    );
  END IF;
  
  RAISE NOTICE 'Permission result: %', result;
  RETURN result;
END;
$function$;

-- 6. Create enhanced scan recording function
CREATE OR REPLACE FUNCTION public.enhanced_record_equipment_scan(
  p_equipment_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_scan_method TEXT DEFAULT 'qr_code',
  p_additional_data JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_current_user_id UUID;
  v_scan_data JSONB;
BEGIN
  -- Use provided user ID or current authenticated user
  v_current_user_id := COALESCE(p_user_id, auth.uid());
  
  IF v_current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Authentication required'
    );
  END IF;
  
  -- Collect browser/device information from headers if available
  v_scan_data := jsonb_build_object(
    'scan_method', p_scan_method,
    'user_agent', current_setting('request.headers', true)::json->>'user-agent',
    'session_id', current_setting('request.headers', true)::json->>'x-session-id'
  ) || p_additional_data;
  
  -- Call the main scan recording function
  RETURN public.record_equipment_scan(p_equipment_id, v_current_user_id, v_scan_data);
END;
$function$;

-- 7. Clean up old migration functions that are no longer needed
DROP FUNCTION IF EXISTS public.can_access_equipment(user_id uuid, equipment_id uuid);
DROP FUNCTION IF EXISTS public.record_equipment_scan(equipment_id uuid, user_id uuid, scan_data jsonb);
DROP FUNCTION IF EXISTS public.simplified_equipment_create_permission(uuid, uuid);
