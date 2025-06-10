
-- Add get_equipment_with_details function to fix equipment loading issues
-- This function uses explicit LEFT JOINs instead of PostgREST foreign key syntax

CREATE OR REPLACE FUNCTION public.get_equipment_with_details(p_equipment_id uuid)
 RETURNS TABLE(
   id uuid,
   name text,
   manufacturer text,
   model text,
   serial_number text,
   asset_id text,
   status equipment_status,
   location text,
   location_address text,
   location_coordinates text,
   notes text,
   install_date date,
   warranty_expiration date,
   org_id uuid,
   team_id uuid,
   created_by uuid,
   created_at timestamp with time zone,
   updated_at timestamp with time zone,
   deleted_at timestamp with time zone,
   -- Related data
   organization_name text,
   team_name text,
   created_by_display_name text,
   -- Location fields
   last_scan_latitude numeric,
   last_scan_longitude numeric,
   last_scan_accuracy numeric,
   last_scan_timestamp timestamp with time zone,
   last_scan_by_user_id uuid,
   location_override boolean,
   location_source text
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
    e.asset_id,
    e.status,
    e.location,
    e.location_address,
    e.location_coordinates,
    e.notes,
    e.install_date,
    e.warranty_expiration,
    e.org_id,
    e.team_id,
    e.created_by,
    e.created_at,
    e.updated_at,
    e.deleted_at,
    -- Related data with explicit LEFT JOINs
    o.name as organization_name,
    t.name as team_name,
    up.display_name as created_by_display_name,
    -- Location fields
    e.last_scan_latitude,
    e.last_scan_longitude,
    e.last_scan_accuracy,
    e.last_scan_timestamp,
    e.last_scan_by_user_id,
    e.location_override,
    e.location_source
  FROM public.equipment e
  LEFT JOIN public.organization o ON e.org_id = o.id
  LEFT JOIN public.team t ON e.team_id = t.id
  LEFT JOIN public.user_profiles up ON e.created_by = up.id
  WHERE e.id = p_equipment_id
    AND e.deleted_at IS NULL;
END;
$function$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_equipment_with_details(uuid) TO authenticated;
