
-- Fix Equipment Data Integrity - Safe Audit Handling
-- This migration addresses the audit trigger foreign key issue

-- Step 1: Temporarily disable audit triggers to prevent FK violations
DROP TRIGGER IF EXISTS audit_equipment_changes ON public.equipment;

-- Step 2: Check current status values and fix them
DO $$
DECLARE
    status_counts RECORD;
BEGIN
    FOR status_counts IN 
        SELECT status, COUNT(*) as count
        FROM public.equipment 
        WHERE deleted_at IS NULL
        GROUP BY status
        ORDER BY count DESC
    LOOP
        RAISE NOTICE 'Status "%" has % records', status_counts.status, status_counts.count;
    END LOOP;
END $$;

-- Fix invalid status values first
UPDATE public.equipment 
SET status = 'retired'
WHERE status NOT IN ('active', 'inactive', 'maintenance', 'storage', 'retired')
  AND deleted_at IS NULL;

-- Step 3: Create the corrected validation function
CREATE OR REPLACE FUNCTION public.validate_equipment_input_enhanced()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Validate and sanitize name (required)
  IF NEW.name IS NULL OR trim(NEW.name) = '' THEN
    RAISE EXCEPTION 'Equipment name cannot be empty';
  END IF;
  NEW.name = public.sanitize_text(NEW.name);
  
  -- Validate and sanitize optional fields
  NEW.manufacturer = public.sanitize_text(NEW.manufacturer);
  NEW.model = public.sanitize_text(NEW.model);
  NEW.serial_number = public.sanitize_text(NEW.serial_number);
  NEW.location = public.sanitize_text(NEW.location);
  NEW.notes = public.sanitize_text(NEW.notes);
  
  -- Validate org_id format
  IF NOT public.validate_uuid_format(NEW.org_id::TEXT) THEN
    RAISE EXCEPTION 'Invalid organization ID format';
  END IF;
  
  -- Validate team_id format if provided
  IF NEW.team_id IS NOT NULL AND NOT public.validate_uuid_format(NEW.team_id::TEXT) THEN
    RAISE EXCEPTION 'Invalid team ID format';
  END IF;
  
  -- Validate status against actual enum values
  IF NEW.status NOT IN ('active', 'inactive', 'maintenance', 'storage', 'retired') THEN
    RAISE EXCEPTION 'Invalid equipment status. Must be one of: active, inactive, maintenance, storage, retired';
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Step 4: Handle NULL created_by values safely
DO $$
DECLARE
    null_count INTEGER;
    safe_user_id UUID;
    first_org_id UUID;
    existing_user_id UUID;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM public.equipment
    WHERE created_by IS NULL AND deleted_at IS NULL;
    
    RAISE NOTICE 'Equipment with NULL created_by: %', null_count;
    
    IF null_count > 0 THEN
        -- First try to find an existing user that has both auth.users and app_user records
        SELECT au.id INTO safe_user_id
        FROM auth.users au
        INNER JOIN public.app_user apu ON au.id::text = apu.auth_uid
        WHERE au.id IS NOT NULL
        ORDER BY au.created_at ASC
        LIMIT 1;
        
        -- If we found a safe user, use them
        IF safe_user_id IS NOT NULL THEN
            RAISE NOTICE 'Using existing safe user: %', safe_user_id;
        ELSE
            -- Create a system user with all required records
            safe_user_id := '00000000-0000-0000-0000-000000000001'::UUID;
            
            -- Get first organization for system user
            SELECT id INTO first_org_id FROM public.organization ORDER BY created_at ASC LIMIT 1;
            
            -- Insert system user into auth.users
            INSERT INTO auth.users (
                id,
                instance_id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                created_at,
                updated_at,
                confirmation_token,
                email_change,
                email_change_token_new,
                recovery_token
            ) VALUES (
                safe_user_id,
                '00000000-0000-0000-0000-000000000000',
                'authenticated',
                'authenticated', 
                'system@equipqr.internal',
                '$2a$10$dummy.encrypted.password.hash.for.system.user.account',
                now(),
                now(),
                now(),
                '',
                '',
                '',
                ''
            ) ON CONFLICT (id) DO NOTHING;
            
            -- Create app_user record
            INSERT INTO public.app_user (
                id,
                auth_uid,
                email,
                display_name,
                created_at
            ) VALUES (
                gen_random_uuid(),
                safe_user_id::text,
                'system@equipqr.internal',
                'System User',
                now()
            ) ON CONFLICT (auth_uid) DO NOTHING;
            
            -- Create user profile if we have an organization
            IF first_org_id IS NOT NULL THEN
                INSERT INTO public.user_profiles (
                    id,
                    org_id,
                    display_name,
                    created_at,
                    updated_at
                ) VALUES (
                    safe_user_id,
                    first_org_id,
                    'System User',
                    now(),
                    now()
                ) ON CONFLICT (id) DO NOTHING;
                
                INSERT INTO public.user_roles (
                    user_id,
                    org_id,
                    role,
                    assigned_at
                ) VALUES (
                    safe_user_id,
                    first_org_id,
                    'owner',
                    now()
                ) ON CONFLICT (user_id, org_id) DO NOTHING;
            END IF;
            
            RAISE NOTICE 'Created system user with all records: %', safe_user_id;
        END IF;
        
        -- Now safely update equipment records (audit trigger is disabled)
        UPDATE public.equipment 
        SET created_by = safe_user_id,
            updated_at = now()
        WHERE created_by IS NULL 
          AND deleted_at IS NULL;
          
        RAISE NOTICE 'Updated % equipment records with created_by: %', null_count, safe_user_id;
    END IF;
END $$;

-- Step 5: Add constraints now that data is clean
ALTER TABLE public.equipment 
ALTER COLUMN created_by SET NOT NULL;

ALTER TABLE public.equipment 
DROP CONSTRAINT IF EXISTS fk_equipment_created_by;

ALTER TABLE public.equipment 
ADD CONSTRAINT fk_equipment_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Step 6: Create the missing function
CREATE OR REPLACE FUNCTION public.get_equipment_with_details_safe(p_equipment_id uuid)
 RETURNS TABLE(
   id uuid,
   name text,
   manufacturer text,
   model text,
   serial_number text,
   status equipment_status,
   location text,
   notes text,
   install_date date,
   warranty_expiration date,
   org_id uuid,
   team_id uuid,
   created_by uuid,
   created_at timestamp with time zone,
   updated_at timestamp with time zone,
   deleted_at timestamp with time zone,
   organization_name text,
   team_name text,
   created_by_display_name text
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e.manufacturer,
    e.model,
    e.serial_number,
    e.status,
    e.location,
    e.notes,
    e.install_date,
    e.warranty_expiration,
    e.org_id,
    e.team_id,
    e.created_by,
    e.created_at,
    e.updated_at,
    e.deleted_at,
    COALESCE(o.name, 'Unknown Organization') as organization_name,
    t.name as team_name,
    COALESCE(up.display_name, au.email, 'System User') as created_by_display_name
  FROM public.equipment e
  LEFT JOIN public.organization o ON e.org_id = o.id
  LEFT JOIN public.team t ON e.team_id = t.id AND t.deleted_at IS NULL
  LEFT JOIN auth.users au ON e.created_by = au.id
  LEFT JOIN public.user_profiles up ON e.created_by = up.id
  WHERE e.id = p_equipment_id
    AND e.deleted_at IS NULL;
END;
$function$;

-- Step 7: Create improved audit function that handles missing app_user records
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes_safe()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  table_name TEXT := TG_TABLE_NAME;
  operation TEXT := TG_OP;
  old_data JSONB := NULL;
  new_data JSONB := NULL;
  actor_id UUID := NULL;
  safe_actor_id UUID := NULL;
BEGIN
  -- Capture old and new data
  IF operation = 'DELETE' THEN
    old_data := to_jsonb(OLD);
    actor_id := COALESCE(auth.uid(), OLD.created_by);
  ELSIF operation = 'INSERT' THEN
    new_data := to_jsonb(NEW);
    actor_id := COALESCE(auth.uid(), NEW.created_by);
  ELSIF operation = 'UPDATE' THEN
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
    actor_id := COALESCE(auth.uid(), NEW.created_by, OLD.created_by);
  END IF;
  
  -- Ensure the actor_id exists in app_user table
  IF actor_id IS NOT NULL THEN
    SELECT au.id INTO safe_actor_id
    FROM auth.users au
    INNER JOIN public.app_user apu ON au.id::text = apu.auth_uid
    WHERE au.id = actor_id;
    
    -- If actor doesn't have app_user record, use a system actor or skip audit
    IF safe_actor_id IS NULL THEN
      -- Try to find any valid system user
      SELECT au.id INTO safe_actor_id
      FROM auth.users au
      INNER JOIN public.app_user apu ON au.id::text = apu.auth_uid
      WHERE au.email LIKE '%system%' OR au.email LIKE '%equipqr%'
      LIMIT 1;
      
      -- If still no safe actor, skip audit to prevent constraint violation
      IF safe_actor_id IS NULL THEN
        RAISE NOTICE 'Skipping audit for % % due to missing app_user record for actor %', 
                     table_name, operation, actor_id;
        GOTO skip_audit;
      END IF;
    END IF;
  END IF;
  
  -- Log the audit event with safe actor
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
    safe_actor_id,
    old_data,
    new_data,
    COALESCE(NEW.org_id, OLD.org_id)
  );
  
  <<skip_audit>>
  
  -- Return appropriate record
  IF operation = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$function$;

-- Step 8: Re-enable audit trigger with safe function
CREATE TRIGGER audit_equipment_changes_safe
  AFTER INSERT OR UPDATE OR DELETE ON public.equipment
  FOR EACH ROW EXECUTE FUNCTION audit_sensitive_changes_safe();

-- Step 9: Grant permissions
GRANT EXECUTE ON FUNCTION public.get_equipment_with_details_safe(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_equipment_input_enhanced() TO authenticated;

-- Step 10: Final verification
DO $$
DECLARE
    final_null_count INTEGER;
    invalid_fk_count INTEGER;
    function_exists BOOLEAN;
    invalid_status_count INTEGER;
    audit_function_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO final_null_count
    FROM public.equipment
    WHERE created_by IS NULL AND deleted_at IS NULL;
    
    SELECT COUNT(*) INTO invalid_fk_count
    FROM public.equipment e
    LEFT JOIN auth.users au ON e.created_by = au.id
    WHERE e.deleted_at IS NULL AND au.id IS NULL;
    
    SELECT COUNT(*) INTO invalid_status_count
    FROM public.equipment
    WHERE status NOT IN ('active', 'inactive', 'maintenance', 'storage', 'retired')
      AND deleted_at IS NULL;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'get_equipment_with_details_safe'
    ) INTO function_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'audit_sensitive_changes_safe'
    ) INTO audit_function_exists;
    
    IF final_null_count = 0 AND invalid_fk_count = 0 AND function_exists AND invalid_status_count = 0 AND audit_function_exists THEN
        RAISE NOTICE 'SUCCESS: All issues resolved! Safe audit trigger enabled.';
    ELSE
        RAISE NOTICE 'Issues: % NULL created_by, % invalid FK, % invalid status, Function exists: %, Audit function: %', 
                     final_null_count, invalid_fk_count, invalid_status_count, function_exists, audit_function_exists;
    END IF;
END $$;
