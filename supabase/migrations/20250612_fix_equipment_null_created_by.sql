
-- Fix Equipment NULL created_by Values - Step by Step Approach
-- This migration safely fixes NULL created_by values before adding constraints

-- Step 1: First, let's see what we're dealing with
DO $$
DECLARE
    null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO null_count
    FROM public.equipment
    WHERE created_by IS NULL AND deleted_at IS NULL;
    
    RAISE NOTICE 'Found % equipment records with NULL created_by values', null_count;
END $$;

-- Step 2: Fix the enum validation function that's causing the error
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

-- Step 3: Update equipment records with NULL created_by to use organization owner
UPDATE public.equipment 
SET created_by = org.owner_user_id,
    updated_at = now()
FROM public.organization org
WHERE equipment.created_by IS NULL 
  AND equipment.org_id = org.id
  AND org.owner_user_id IS NOT NULL
  AND equipment.deleted_at IS NULL;

-- Step 4: For any remaining NULL values, try to use the first user in the organization
UPDATE public.equipment 
SET created_by = ur.user_id,
    updated_at = now()
FROM public.user_roles ur
WHERE equipment.created_by IS NULL 
  AND equipment.org_id = ur.org_id
  AND equipment.deleted_at IS NULL
  AND ur.user_id = (
    SELECT user_id 
    FROM public.user_roles 
    WHERE org_id = equipment.org_id 
    ORDER BY assigned_at ASC 
    LIMIT 1
  );

-- Step 5: As a last resort, try to use any valid user from the auth.users table
UPDATE public.equipment 
SET created_by = (
    SELECT id 
    FROM auth.users 
    WHERE id IS NOT NULL 
    ORDER BY created_at ASC 
    LIMIT 1
),
updated_at = now()
WHERE created_by IS NULL 
  AND deleted_at IS NULL;

-- Step 6: Check if there are still any NULL values
DO $$
DECLARE
    remaining_null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO remaining_null_count
    FROM public.equipment
    WHERE created_by IS NULL AND deleted_at IS NULL;
    
    IF remaining_null_count > 0 THEN
        RAISE NOTICE 'Warning: Still have % equipment records with NULL created_by values', remaining_null_count;
        -- Let's see what these records look like
        RAISE NOTICE 'Sample problematic equipment IDs: %', (
            SELECT array_agg(id)
            FROM (
                SELECT id 
                FROM public.equipment 
                WHERE created_by IS NULL AND deleted_at IS NULL 
                LIMIT 5
            ) sample
        );
    ELSE
        RAISE NOTICE 'All equipment records now have valid created_by values';
    END IF;
END $$;

-- Step 7: Only delete records that absolutely cannot be fixed (should be very rare)
DELETE FROM public.equipment 
WHERE created_by IS NULL 
  AND deleted_at IS NULL
  AND org_id NOT IN (
    SELECT id FROM public.organization WHERE owner_user_id IS NOT NULL
  )
  AND org_id NOT IN (
    SELECT DISTINCT org_id FROM public.user_roles
  );

-- Step 8: Now it should be safe to add the NOT NULL constraint
ALTER TABLE public.equipment 
ALTER COLUMN created_by SET NOT NULL;

-- Step 9: Add the foreign key constraint
ALTER TABLE public.equipment 
DROP CONSTRAINT IF EXISTS fk_equipment_created_by;

ALTER TABLE public.equipment 
ADD CONSTRAINT fk_equipment_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id);

-- Step 10: Create a trigger to ensure created_by is never NULL for new equipment
CREATE OR REPLACE FUNCTION public.ensure_equipment_created_by()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_owner_user_id UUID;
  v_first_user_id UUID;
BEGIN
  -- If created_by is NULL, try to set it to organization owner
  IF NEW.created_by IS NULL THEN
    -- Try to get organization owner
    SELECT owner_user_id INTO v_owner_user_id
    FROM public.organization
    WHERE id = NEW.org_id;
    
    IF v_owner_user_id IS NOT NULL THEN
      NEW.created_by := v_owner_user_id;
    ELSE
      -- Fallback to first user in organization
      SELECT user_id INTO v_first_user_id
      FROM public.user_roles
      WHERE org_id = NEW.org_id
      ORDER BY assigned_at ASC
      LIMIT 1;
      
      IF v_first_user_id IS NOT NULL THEN
        NEW.created_by := v_first_user_id;
      ELSE
        -- Last resort: raise an error
        RAISE EXCEPTION 'Cannot create equipment: no valid users found in organization %', NEW.org_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for new equipment
DROP TRIGGER IF EXISTS trigger_ensure_equipment_created_by ON public.equipment;
CREATE TRIGGER trigger_ensure_equipment_created_by
  BEFORE INSERT OR UPDATE ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_equipment_created_by();

-- Step 11: Fix the permission check function
CREATE OR REPLACE FUNCTION public.check_equipment_create_permission(p_user_id uuid, p_team_id uuid DEFAULT NULL::uuid, p_org_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(
   has_permission boolean,
   org_id uuid,
   reason text
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_org_id UUID;
  v_team_org_id UUID;
  v_app_user_id UUID;
  v_role TEXT;
  v_final_org_id UUID;
BEGIN
  -- Get user's organization directly from user_profiles
  SELECT up.org_id INTO v_user_org_id
  FROM public.user_profiles up
  WHERE up.id = p_user_id;
  
  -- If no organization found, deny permission
  IF v_user_org_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 'User has no organization';
    RETURN;
  END IF;
  
  -- Use provided org_id or fall back to user's org
  v_final_org_id := COALESCE(p_org_id, v_user_org_id);
  
  -- If creating equipment not associated with a team
  IF p_team_id IS NULL THEN
    -- Check if user belongs to the target organization
    IF v_final_org_id = v_user_org_id THEN
      RETURN QUERY SELECT true, v_final_org_id, 'User can create equipment in own organization';
      RETURN;
    ELSE
      RETURN QUERY SELECT false, NULL::uuid, 'User cannot create equipment in different organization';
      RETURN;
    END IF;
  END IF;
  
  -- Get team's organization
  SELECT t.org_id INTO v_team_org_id
  FROM public.team t
  WHERE t.id = p_team_id AND t.deleted_at IS NULL;
  
  IF v_team_org_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Team not found or deleted';
    RETURN;
  END IF;
  
  -- If user belongs to same org as team, allow
  IF v_user_org_id = v_team_org_id THEN
    RETURN QUERY SELECT true, v_team_org_id, 'User belongs to team organization';
    RETURN;
  END IF;
  
  -- Check cross-org team membership with proper casting
  SELECT au.id INTO v_app_user_id
  FROM public.app_user au
  WHERE au.auth_uid = p_user_id::text;
  
  IF v_app_user_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, 'App user record not found';
    RETURN;
  END IF;
  
  -- Check team role
  SELECT tr.role INTO v_role
  FROM public.team_member tm
  JOIN public.team_roles tr ON tr.team_member_id = tm.id
  WHERE tm.user_id = v_app_user_id
  AND tm.team_id = p_team_id
  LIMIT 1;
  
  -- Check if role allows equipment creation
  IF v_role IN ('manager', 'owner', 'admin') THEN
    RETURN QUERY SELECT true, v_team_org_id, 'User has team creation permissions';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT false, NULL::uuid, 'Insufficient team permissions';
END;
$function$;

-- Step 12: Update the main RPC function
CREATE OR REPLACE FUNCTION public.rpc_check_equipment_permission(user_id uuid, action text, team_id uuid DEFAULT NULL::uuid, equipment_id uuid DEFAULT NULL::uuid)
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
  v_user_role TEXT;
BEGIN
  RAISE NOTICE 'rpc_check_equipment_permission called: user_id=%, action=%, team_id=%, equipment_id=%',
    user_id, action, team_id, equipment_id;
  
  IF action = 'create' THEN
    -- For equipment creation - use the fixed function
    SELECT * INTO permission_data
    FROM public.check_equipment_create_permission(user_id, team_id);
    
    result := jsonb_build_object(
      'has_permission', permission_data.has_permission, 
      'org_id', permission_data.org_id,
      'reason', permission_data.reason
    );
    
    RAISE NOTICE 'Create permission result: %', result;
    
  ELSIF action = 'edit' AND equipment_id IS NOT NULL THEN
    -- Get equipment details
    SELECT e.team_id, e.org_id INTO v_equipment_team_id, v_equipment_org_id
    FROM public.equipment e
    WHERE e.id = equipment_id AND e.deleted_at IS NULL;
    
    -- If unassigned equipment, use the specialized function
    IF v_equipment_team_id IS NULL THEN
      result := jsonb_build_object(
        'has_permission', public.can_edit_unassigned_equipment(user_id, equipment_id),
        'reason', 'unassigned_equipment'
      );
    ELSE
      result := jsonb_build_object(
        'has_permission', public.can_edit_equipment(user_id, equipment_id),
        'reason', 'team_equipment'
      );
    END IF;
    
    RAISE NOTICE 'Edit permission result: %', result;
    
  ELSIF action = 'delete' AND equipment_id IS NOT NULL THEN
    -- For equipment deletion - check organization ownership
    SELECT e.org_id INTO v_equipment_org_id
    FROM public.equipment e
    WHERE e.id = equipment_id AND e.deleted_at IS NULL;
    
    IF v_equipment_org_id IS NULL THEN
      result := jsonb_build_object(
        'has_permission', false,
        'reason', 'equipment_not_found'
      );
    ELSE
      -- Get user's organization and role
      SELECT up.org_id INTO v_user_org_id
      FROM public.user_profiles up
      WHERE up.id = user_id;
      
      SELECT ur.role INTO v_user_role
      FROM public.user_roles ur
      WHERE ur.user_id = user_id AND ur.org_id = v_equipment_org_id;
      
      -- Only owners and managers can delete equipment
      result := jsonb_build_object(
        'has_permission', (v_user_org_id = v_equipment_org_id AND v_user_role IN ('owner', 'manager')),
        'reason', 'delete_permission_check'
      );
    END IF;
    
    RAISE NOTICE 'Delete permission result: %', result;
    
  ELSIF action = 'view' OR action = 'read' THEN
    -- For viewing equipment
    IF equipment_id IS NOT NULL THEN
      result := jsonb_build_object(
        'has_permission', public.can_access_equipment(user_id, equipment_id),
        'reason', 'view_permission_check'
      );
    ELSE
      -- Generic view permission - check if user belongs to any organization
      SELECT up.org_id INTO v_user_org_id
      FROM public.user_profiles up
      WHERE up.id = user_id;
      
      result := jsonb_build_object(
        'has_permission', (v_user_org_id IS NOT NULL),
        'reason', 'general_view_permission'
      );
    END IF;
    
    RAISE NOTICE 'View permission result: %', result;
    
  ELSE
    -- Unsupported action
    result := jsonb_build_object(
      'has_permission', false,
      'reason', 'unsupported_action'
    );
    
    RAISE NOTICE 'Unsupported action: %', action;
  END IF;
  
  RETURN result;
END;
$function$;

-- Step 13: Create the safer equipment details function
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
    COALESCE(up.display_name, 'Unknown User') as created_by_display_name
  FROM public.equipment e
  LEFT JOIN public.organization o ON e.org_id = o.id
  LEFT JOIN public.team t ON e.team_id = t.id AND t.deleted_at IS NULL
  LEFT JOIN public.user_profiles up ON e.created_by = up.id
  WHERE e.id = p_equipment_id
    AND e.deleted_at IS NULL;
END;
$function$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_equipment_create_permission(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_check_equipment_permission(uuid, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_equipment_with_details_safe(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_equipment_created_by() TO authenticated;

-- Final verification
DO $$
DECLARE
    final_null_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_null_count
    FROM public.equipment
    WHERE created_by IS NULL AND deleted_at IS NULL;
    
    IF final_null_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All equipment records now have valid created_by values';
    ELSE
        RAISE EXCEPTION 'FAILED: Still have % equipment records with NULL created_by values', final_null_count;
    END IF;
END $$;
