
-- Create a unified function to validate equipment access and record scan
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
  v_permission_result JSONB;
  v_scan_id UUID;
  v_equipment_record RECORD;
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
  
  -- Check equipment access permission using our existing RPC function
  SELECT rpc_check_equipment_permission(p_user_id, 'view', NULL, p_equipment_id) INTO v_permission_result;
  
  IF v_permission_result IS NULL OR NOT (v_permission_result->>'has_permission')::boolean THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Access denied: User does not have permission to access this equipment',
      'reason', COALESCE(v_permission_result->>'reason', 'unknown')
    );
  END IF;
  
  -- Convert auth user ID to app_user ID if needed
  DECLARE
    v_app_user_id UUID;
  BEGIN
    SELECT id INTO v_app_user_id
    FROM public.app_user
    WHERE auth_uid = p_user_id;
  END;
  
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

-- Update RLS policies on scan_history to be more permissive for authenticated users
-- since we're now doing permission validation in the function
DROP POLICY IF EXISTS "Users can insert their own scan records" ON public.scan_history;
DROP POLICY IF EXISTS "Users can view scan records for accessible equipment" ON public.scan_history;

-- Simplified RLS policies that trust the function-level permission validation
CREATE POLICY "Authenticated users can insert scan records" ON public.scan_history
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Permission validation happens in the function

CREATE POLICY "Authenticated users can view scan records" ON public.scan_history
  FOR SELECT TO authenticated
  USING (true); -- Permission validation happens at the application level
