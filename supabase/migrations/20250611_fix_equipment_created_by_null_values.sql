
-- Fix Equipment Created By NULL Values
-- This migration addresses equipment records with NULL created_by values that cause join failures

-- 1. Update equipment records with NULL created_by to use organization owner
UPDATE public.equipment 
SET created_by = org.owner_user_id,
    updated_at = now()
FROM public.organization org
WHERE equipment.created_by IS NULL 
  AND equipment.org_id = org.id
  AND org.owner_user_id IS NOT NULL
  AND equipment.deleted_at IS NULL;

-- 2. For any remaining NULL values, try to use the first user in the organization
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

-- 3. Add a trigger to ensure created_by is never NULL for new equipment
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

-- 4. Update the equipment details query function to use LEFT JOIN
CREATE OR REPLACE FUNCTION public.get_equipment_with_details(p_equipment_id uuid)
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
    o.name as organization_name,
    t.name as team_name,
    up.display_name as created_by_display_name
  FROM public.equipment e
  LEFT JOIN public.organization o ON e.org_id = o.id
  LEFT JOIN public.team t ON e.team_id = t.id
  LEFT JOIN public.user_profiles up ON e.created_by = up.id
  WHERE e.id = p_equipment_id
    AND e.deleted_at IS NULL;
END;
$function$;

-- 5. Create a diagnostic function to check equipment data integrity
CREATE OR REPLACE FUNCTION public.diagnose_equipment_data_integrity()
 RETURNS TABLE(
   issue_type text,
   equipment_count integer,
   sample_equipment_ids uuid[]
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Check for NULL created_by values
  RETURN QUERY
  SELECT 
    'null_created_by'::text as issue_type,
    COUNT(*)::integer as equipment_count,
    array_agg(id ORDER BY created_at DESC LIMIT 5) as sample_equipment_ids
  FROM public.equipment
  WHERE created_by IS NULL 
    AND deleted_at IS NULL
  HAVING COUNT(*) > 0;
  
  -- Check for invalid organization references
  RETURN QUERY
  SELECT 
    'invalid_org_reference'::text as issue_type,
    COUNT(*)::integer as equipment_count,
    array_agg(e.id ORDER BY e.created_at DESC LIMIT 5) as sample_equipment_ids
  FROM public.equipment e
  LEFT JOIN public.organization o ON e.org_id = o.id
  WHERE o.id IS NULL 
    AND e.deleted_at IS NULL
  HAVING COUNT(*) > 0;
  
  -- Check for invalid team references
  RETURN QUERY
  SELECT 
    'invalid_team_reference'::text as issue_type,
    COUNT(*)::integer as equipment_count,
    array_agg(e.id ORDER BY e.created_at DESC LIMIT 5) as sample_equipment_ids
  FROM public.equipment e
  LEFT JOIN public.team t ON e.team_id = t.id
  WHERE e.team_id IS NOT NULL 
    AND t.id IS NULL 
    AND e.deleted_at IS NULL
  HAVING COUNT(*) > 0;
END;
$function$;
