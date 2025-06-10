
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

-- Add a debug function to help track permission issues
CREATE OR REPLACE FUNCTION public.log_permission_debug(
  p_function_name TEXT,
  p_user_id UUID,
  p_equipment_id UUID DEFAULT NULL,
  p_team_id UUID DEFAULT NULL,
  p_result BOOLEAN DEFAULT NULL,
  p_details TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Log debug information to audit_log table
  INSERT INTO public.audit_log (
    action,
    entity_type,
    entity_id,
    actor_user_id,
    after_json
  ) VALUES (
    'permission_debug',
    'permission_check',
    COALESCE(p_equipment_id, p_team_id, gen_random_uuid()),
    p_user_id,
    jsonb_build_object(
      'function_name', p_function_name,
      'equipment_id', p_equipment_id,
      'team_id', p_team_id,
      'result', p_result,
      'details', p_details,
      'timestamp', now()
    )
  );
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors in debug logging
  NULL;
END;
$function$;
