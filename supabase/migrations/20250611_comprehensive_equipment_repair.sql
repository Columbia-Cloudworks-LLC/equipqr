
-- Comprehensive Equipment System Repair Migration
-- This migration fixes all identified issues with equipment creation and data integrity

-- Step 1: Create a better equipment creation permission check function
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
  
  -- Check cross-org team membership
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

-- Step 2: Create a function to check if user can edit equipment
CREATE OR REPLACE FUNCTION public.can_edit_equipment(user_id uuid, equipment_id uuid)
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
  -- Get equipment details
  SELECT e.org_id, e.team_id INTO v_equipment_org_id, v_equipment_team_id
  FROM public.equipment e
  WHERE e.id = equipment_id AND e.deleted_at IS NULL;
  
  IF v_equipment_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's organization
  SELECT up.org_id INTO v_user_org_id
  FROM public.user_profiles up
  WHERE up.id = user_id;
  
  -- Get user's organization role
  SELECT ur.role INTO v_org_role
  FROM public.user_roles ur
  WHERE ur.user_id = user_id AND ur.org_id = v_equipment_org_id;
  
  -- Organization owners and managers can edit all equipment
  IF v_org_role IN ('owner', 'manager') THEN
    RETURN TRUE;
  END IF;
  
  -- If equipment has a team, check team permissions
  IF v_equipment_team_id IS NOT NULL THEN
    -- Get app_user ID
    SELECT au.id INTO v_app_user_id
    FROM public.app_user au
    WHERE au.auth_uid = user_id::text;
    
    IF v_app_user_id IS NOT NULL THEN
      -- Get team role
      SELECT tr.role INTO v_team_role
      FROM public.team_member tm
      JOIN public.team_roles tr ON tr.team_member_id = tm.id
      WHERE tm.user_id = v_app_user_id AND tm.team_id = v_equipment_team_id;
      
      -- Team managers can edit equipment
      RETURN v_team_role IN ('manager', 'owner', 'admin');
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$function$;

-- Step 3: Fix equipment records with NULL created_by values
UPDATE public.equipment 
SET created_by = org.owner_user_id,
    updated_at = now()
FROM public.organization org
WHERE equipment.created_by IS NULL 
  AND equipment.org_id = org.id
  AND org.owner_user_id IS NOT NULL
  AND equipment.deleted_at IS NULL;

-- For any remaining NULL values, try to use the first user in the organization
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

-- Clean up any equipment with invalid status values
UPDATE public.equipment 
SET status = 'active'
WHERE status NOT IN ('active', 'inactive', 'maintenance')
  AND deleted_at IS NULL;

-- Step 4: Delete any remaining equipment that couldn't be fixed
DELETE FROM public.equipment 
WHERE created_by IS NULL AND deleted_at IS NULL;

-- Step 5: Add constraints to prevent future issues
ALTER TABLE public.equipment 
DROP CONSTRAINT IF EXISTS equipment_created_by_not_null;

ALTER TABLE public.equipment 
ALTER COLUMN created_by SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE public.equipment 
DROP CONSTRAINT IF EXISTS fk_equipment_created_by;

ALTER TABLE public.equipment 
ADD CONSTRAINT fk_equipment_created_by 
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 6: Create trigger to ensure created_by is never NULL for new equipment
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

-- Step 7: Fix the validation function to handle enums properly
CREATE OR REPLACE FUNCTION public.validate_equipment_input_enhanced()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Validate and sanitize name (required)
  IF NEW.name IS NULL OR trim(NEW.name) = '' THEN
    RAISE EXCEPTION 'Equipment name cannot be empty';
  END IF;
  NEW.name = sanitize_text(NEW.name);
  
  -- Validate and sanitize optional fields
  NEW.manufacturer = sanitize_text(NEW.manufacturer);
  NEW.model = sanitize_text(NEW.model);
  NEW.serial_number = sanitize_text(NEW.serial_number);
  NEW.location = sanitize_text(NEW.location);
  NEW.notes = sanitize_text(NEW.notes);
  
  -- Validate org_id format
  IF NOT validate_uuid_format(NEW.org_id::TEXT) THEN
    RAISE EXCEPTION 'Invalid organization ID format';
  END IF;
  
  -- Validate team_id format if provided
  IF NEW.team_id IS NOT NULL AND NOT validate_uuid_format(NEW.team_id::TEXT) THEN
    RAISE EXCEPTION 'Invalid team ID format';
  END IF;
  
  -- Validate status is one of the allowed enum values
  IF NEW.status NOT IN ('active', 'inactive', 'maintenance') THEN
    NEW.status = 'active'; -- Default to active for invalid values
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Replace the old trigger
DROP TRIGGER IF EXISTS trigger_validate_equipment_input ON public.equipment;
DROP TRIGGER IF EXISTS trigger_validate_equipment_input_enhanced ON public.equipment;

CREATE TRIGGER trigger_validate_equipment_input_enhanced
  BEFORE INSERT OR UPDATE ON public.equipment
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_equipment_input_enhanced();

-- Step 8: Update the RPC permission check function
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

-- Step 9: Create a comprehensive diagnostic function
CREATE OR REPLACE FUNCTION public.diagnose_equipment_system()
 RETURNS TABLE(
   check_type text,
   status text,
   count integer,
   details text
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check for NULL created_by values
  RETURN QUERY
  SELECT 
    'null_created_by'::text as check_type,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status,
    COUNT(*)::integer as count,
    'Equipment records with NULL created_by values'::text as details
  FROM public.equipment
  WHERE created_by IS NULL AND deleted_at IS NULL;
  
  -- Check for invalid organization references
  RETURN QUERY
  SELECT 
    'invalid_org_refs'::text as check_type,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status,
    COUNT(*)::integer as count,
    'Equipment with invalid organization references'::text as details
  FROM public.equipment e
  LEFT JOIN public.organization o ON e.org_id = o.id
  WHERE o.id IS NULL AND e.deleted_at IS NULL;
  
  -- Check for invalid team references
  RETURN QUERY
  SELECT 
    'invalid_team_refs'::text as check_type,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status,
    COUNT(*)::integer as count,
    'Equipment with invalid team references'::text as details
  FROM public.equipment e
  LEFT JOIN public.team t ON e.team_id = t.id
  WHERE e.team_id IS NOT NULL AND t.id IS NULL AND e.deleted_at IS NULL;
  
  -- Check for invalid status values
  RETURN QUERY
  SELECT 
    'invalid_status'::text as check_type,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END as status,
    COUNT(*)::integer as count,
    'Equipment with invalid status values'::text as details
  FROM public.equipment
  WHERE status NOT IN ('active', 'inactive', 'maintenance') AND deleted_at IS NULL;
END;
$function$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_equipment_create_permission(uuid, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_equipment(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_equipment_created_by() TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_equipment_input_enhanced() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_check_equipment_permission(uuid, text, uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.diagnose_equipment_system() TO authenticated;
