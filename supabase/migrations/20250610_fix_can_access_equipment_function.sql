
-- Fix the can_access_equipment function to handle UUID/character varying casting properly
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
  -- Get equipment details
  SELECT org_id, team_id INTO v_equipment_org_id, v_equipment_team_id
  FROM public.equipment
  WHERE id = equipment_id AND deleted_at IS NULL;
  
  IF v_equipment_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's organization
  SELECT org_id INTO v_user_org_id
  FROM public.user_profiles
  WHERE id = user_id;
  
  -- Get user's organization role
  SELECT role INTO v_org_role
  FROM public.user_roles
  WHERE user_id = can_access_equipment.user_id AND org_id = v_equipment_org_id;
  
  -- Organization owners, managers, and technicians can access equipment
  IF v_org_role IN ('owner', 'manager', 'technician', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- If equipment has a team, check team access
  IF v_equipment_team_id IS NOT NULL THEN
    -- Get app_user ID with explicit casting - FIX: Cast user_id to text for comparison
    SELECT id INTO v_app_user_id
    FROM public.app_user
    WHERE auth_uid = user_id::text;
    
    IF v_app_user_id IS NOT NULL THEN
      -- Get team role
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

-- Also create the can_view_scan_history function if it doesn't exist
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
  -- Get equipment details
  SELECT org_id, team_id INTO v_equipment_org_id, v_equipment_team_id
  FROM public.equipment
  WHERE id = p_equipment_id AND deleted_at IS NULL;
  
  IF v_equipment_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's organization
  SELECT org_id INTO v_user_org_id
  FROM public.user_profiles
  WHERE id = p_user_id;
  
  -- Get user's organization role
  SELECT role INTO v_org_role
  FROM public.user_roles
  WHERE user_id = p_user_id AND org_id = v_equipment_org_id;
  
  -- Organization owners and managers can always view scan history
  IF v_org_role IN ('owner', 'manager', 'admin') THEN
    RETURN TRUE;
  END IF;
  
  -- If equipment has a team, check team role
  IF v_equipment_team_id IS NOT NULL THEN
    -- Get app_user ID with explicit casting - FIX: Cast user_id to text for comparison
    SELECT id INTO v_app_user_id
    FROM public.app_user
    WHERE auth_uid = p_user_id::text;
    
    IF v_app_user_id IS NOT NULL THEN
      -- Get team role
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
