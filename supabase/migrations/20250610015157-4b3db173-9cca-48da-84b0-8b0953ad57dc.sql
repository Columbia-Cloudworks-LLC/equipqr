
-- Phase 1: Critical Database Security Triggers and Validation

-- 1. Enhanced input validation for work notes
CREATE OR REPLACE FUNCTION public.validate_work_note_input_enhanced()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Validate note content
  IF NEW.note IS NULL OR trim(NEW.note) = '' THEN
    RAISE EXCEPTION 'Work note content cannot be empty';
  END IF;
  
  -- Enhanced sanitization with length limits
  NEW.note = left(sanitize_text(NEW.note), 5000);
  
  -- Validate equipment_id format
  IF NOT validate_uuid_format(NEW.equipment_id::TEXT) THEN
    RAISE EXCEPTION 'Invalid equipment ID format';
  END IF;
  
  -- Validate hours_worked with stricter bounds
  IF NEW.hours_worked IS NOT NULL AND (NEW.hours_worked < 0 OR NEW.hours_worked > 24) THEN
    RAISE EXCEPTION 'Hours worked must be between 0 and 24';
  END IF;
  
  -- Validate created_by is set (security requirement)
  IF NEW.created_by IS NULL THEN
    RAISE EXCEPTION 'Work note must have a valid creator';
  END IF;
  
  -- Validate image URLs if present
  IF NEW.image_urls IS NOT NULL THEN
    IF array_length(NEW.image_urls, 1) > 10 THEN
      RAISE EXCEPTION 'Maximum 10 images allowed per work note';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Apply the enhanced validation trigger
DROP TRIGGER IF EXISTS validate_work_note_input_trigger ON public.equipment_work_notes;
CREATE TRIGGER validate_work_note_input_enhanced_trigger
  BEFORE INSERT OR UPDATE ON public.equipment_work_notes
  FOR EACH ROW EXECUTE FUNCTION validate_work_note_input_enhanced();

-- 2. Enhanced team input validation
CREATE OR REPLACE FUNCTION public.validate_team_input_enhanced()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Validate and sanitize team name with length limit
  IF NEW.name IS NULL OR trim(NEW.name) = '' THEN
    RAISE EXCEPTION 'Team name cannot be empty';
  END IF;
  NEW.name = left(sanitize_text(NEW.name), 100);
  
  -- Validate org_id format
  IF NOT validate_uuid_format(NEW.org_id::TEXT) THEN
    RAISE EXCEPTION 'Invalid organization ID format';
  END IF;
  
  -- Validate created_by is set
  IF NEW.created_by IS NULL THEN
    RAISE EXCEPTION 'Team must have a valid creator';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Apply the enhanced team validation trigger
DROP TRIGGER IF EXISTS validate_team_input_trigger ON public.team;
CREATE TRIGGER validate_team_input_enhanced_trigger
  BEFORE INSERT OR UPDATE ON public.team
  FOR EACH ROW EXECUTE FUNCTION validate_team_input_enhanced();

-- 3. Enhanced equipment validation with better security
CREATE OR REPLACE FUNCTION public.validate_equipment_input_enhanced()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Validate and sanitize name (required) with length limit
  IF NEW.name IS NULL OR trim(NEW.name) = '' THEN
    RAISE EXCEPTION 'Equipment name cannot be empty';
  END IF;
  NEW.name = left(sanitize_text(NEW.name), 200);
  
  -- Validate and sanitize optional fields with length limits
  NEW.manufacturer = left(sanitize_text(NEW.manufacturer), 100);
  NEW.model = left(sanitize_text(NEW.model), 100);
  NEW.serial_number = left(sanitize_text(NEW.serial_number), 100);
  NEW.location = left(sanitize_text(NEW.location), 500);
  NEW.notes = left(sanitize_text(NEW.notes), 2000);
  
  -- Validate org_id format
  IF NOT validate_uuid_format(NEW.org_id::TEXT) THEN
    RAISE EXCEPTION 'Invalid organization ID format';
  END IF;
  
  -- Validate team_id format if provided
  IF NEW.team_id IS NOT NULL AND NOT validate_uuid_format(NEW.team_id::TEXT) THEN
    RAISE EXCEPTION 'Invalid team ID format';
  END IF;
  
  -- Validate created_by is set (security requirement)
  IF NEW.created_by IS NULL THEN
    RAISE EXCEPTION 'Equipment must have a valid creator';
  END IF;
  
  -- Validate status is within allowed values
  IF NEW.status NOT IN ('active', 'inactive', 'maintenance', 'decommissioned') THEN
    RAISE EXCEPTION 'Invalid equipment status';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Apply the enhanced equipment validation trigger
DROP TRIGGER IF EXISTS validate_equipment_input_trigger ON public.equipment;
CREATE TRIGGER validate_equipment_input_enhanced_trigger
  BEFORE INSERT OR UPDATE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION validate_equipment_input_enhanced();

-- 4. Enhanced organization invitation validation
CREATE OR REPLACE FUNCTION public.validate_invitation_input_enhanced()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Validate email format
  IF NOT validate_email(NEW.email) THEN
    RAISE EXCEPTION 'Invalid email address format';
  END IF;
  
  -- Normalize email to lowercase
  NEW.email = lower(trim(NEW.email));
  
  -- Validate org_id format
  IF NOT validate_uuid_format(NEW.org_id::TEXT) THEN
    RAISE EXCEPTION 'Invalid organization ID format';
  END IF;
  
  -- Validate role with enhanced check
  IF NEW.role NOT IN ('viewer', 'technician', 'manager', 'admin', 'owner') THEN
    RAISE EXCEPTION 'Invalid role specified';
  END IF;
  
  -- Validate created_by is set
  IF NEW.created_by IS NULL THEN
    RAISE EXCEPTION 'Invitation must have a valid creator';
  END IF;
  
  -- Ensure token is generated if not provided
  IF NEW.token IS NULL OR trim(NEW.token) = '' THEN
    NEW.token = gen_invitation_token();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Apply the enhanced invitation validation trigger
DROP TRIGGER IF EXISTS validate_invitation_input_trigger ON public.organization_invitations;
CREATE TRIGGER validate_invitation_input_enhanced_trigger
  BEFORE INSERT OR UPDATE ON public.organization_invitations
  FOR EACH ROW EXECUTE FUNCTION validate_invitation_input_enhanced();

-- 5. Create audit trail for sensitive operations
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  table_name TEXT := TG_TABLE_NAME;
  operation TEXT := TG_OP;
  old_data JSONB := NULL;
  new_data JSONB := NULL;
  changed_fields TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Capture old and new data
  IF operation = 'DELETE' THEN
    old_data := to_jsonb(OLD);
  ELSIF operation = 'INSERT' THEN
    new_data := to_jsonb(NEW);
  ELSIF operation = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    
    -- Identify changed fields for equipment table
    IF table_name = 'equipment' THEN
      IF OLD.name != NEW.name THEN changed_fields := array_append(changed_fields, 'name'); END IF;
      IF OLD.org_id != NEW.org_id THEN changed_fields := array_append(changed_fields, 'org_id'); END IF;
      IF OLD.team_id IS DISTINCT FROM NEW.team_id THEN changed_fields := array_append(changed_fields, 'team_id'); END IF;
      IF OLD.status != NEW.status THEN changed_fields := array_append(changed_fields, 'status'); END IF;
    END IF;
  END IF;
  
  -- Log the audit event
  INSERT INTO public.audit_log (
    action,
    entity_type,
    entity_id,
    actor_user_id,
    before_json,
    after_json,
    org_id
  ) VALUES (
    operation,
    table_name,
    COALESCE(NEW.id, OLD.id),
    COALESCE(auth.uid(), NEW.created_by, OLD.created_by),
    old_data,
    new_data,
    COALESCE(NEW.org_id, OLD.org_id)
  );
  
  -- Return appropriate record
  IF operation = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_equipment_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_changes();

CREATE TRIGGER audit_team_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.team
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_changes();

CREATE TRIGGER audit_user_role_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_changes();

-- 6. Rate limiting function for authentication attempts
CREATE OR REPLACE FUNCTION public.check_enhanced_rate_limit(
  p_identifier TEXT,
  p_attempt_type TEXT,
  p_max_attempts INTEGER DEFAULT 5,
  p_window_minutes INTEGER DEFAULT 15,
  p_escalation_factor NUMERIC DEFAULT 2.0
)
RETURNS JSONB
LANGUAGE plpgsql
AS $function$
DECLARE
  current_attempts INTEGER := 0;
  window_start TIMESTAMP WITH TIME ZONE;
  is_blocked BOOLEAN := FALSE;
  time_until_reset INTEGER := 0;
  escalated_window INTEGER;
BEGIN
  -- Clean up old entries
  DELETE FROM auth_rate_limits 
  WHERE window_start < now() - (p_window_minutes || ' minutes')::interval;
  
  -- Calculate escalated window for repeat offenders
  escalated_window := p_window_minutes;
  
  -- Check for existing rate limit record
  SELECT attempt_count, auth_rate_limits.window_start, blocked_until IS NOT NULL AND blocked_until > now()
  INTO current_attempts, window_start, is_blocked
  FROM auth_rate_limits 
  WHERE identifier = p_identifier 
  AND attempt_type = p_attempt_type
  AND window_start >= now() - (escalated_window || ' minutes')::interval;
  
  -- If no record exists, create one and allow
  IF current_attempts IS NULL THEN
    INSERT INTO auth_rate_limits (identifier, attempt_type, attempt_count)
    VALUES (p_identifier, p_attempt_type, 1);
    
    RETURN jsonb_build_object(
      'allowed', true,
      'attempts_remaining', p_max_attempts - 1,
      'time_until_reset', 0
    );
  END IF;
  
  -- If currently blocked, deny
  IF is_blocked THEN
    SELECT EXTRACT(EPOCH FROM (blocked_until - now()))::INTEGER
    INTO time_until_reset
    FROM auth_rate_limits
    WHERE identifier = p_identifier AND attempt_type = p_attempt_type;
    
    RETURN jsonb_build_object(
      'allowed', false,
      'attempts_remaining', 0,
      'time_until_reset', GREATEST(time_until_reset, 0),
      'reason', 'rate_limited'
    );
  END IF;
  
  -- Check if limit exceeded
  IF current_attempts >= p_max_attempts THEN
    -- Block for escalated time
    UPDATE auth_rate_limits 
    SET blocked_until = now() + (escalated_window * p_escalation_factor || ' minutes')::interval
    WHERE identifier = p_identifier AND attempt_type = p_attempt_type;
    
    RETURN jsonb_build_object(
      'allowed', false,
      'attempts_remaining', 0,
      'time_until_reset', escalated_window * p_escalation_factor * 60,
      'reason', 'rate_limit_exceeded'
    );
  END IF;
  
  -- Increment counter and allow
  UPDATE auth_rate_limits 
  SET attempt_count = attempt_count + 1
  WHERE identifier = p_identifier 
  AND attempt_type = p_attempt_type
  AND window_start = window_start;
  
  RETURN jsonb_build_object(
    'allowed', true,
    'attempts_remaining', p_max_attempts - (current_attempts + 1),
    'time_until_reset', EXTRACT(EPOCH FROM (window_start + (p_window_minutes || ' minutes')::interval - now()))::INTEGER
  );
END;
$function$;

-- 7. Enhanced security event logging function
CREATE OR REPLACE FUNCTION public.log_security_event_enhanced(
  p_event_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_details JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'info',
  p_source_ip INET DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO audit_log (
    action,
    entity_type,
    entity_id,
    actor_user_id,
    after_json,
    org_id,
    ip_address
  ) VALUES (
    p_event_type || '_' || p_severity,
    p_entity_type,
    p_entity_id,
    auth.uid(),
    jsonb_build_object(
      'details', p_details,
      'severity', p_severity,
      'timestamp', now(),
      'source_ip', p_source_ip
    ),
    (SELECT org_id FROM user_profiles WHERE id = auth.uid()),
    p_source_ip
  );
END;
$function$;
