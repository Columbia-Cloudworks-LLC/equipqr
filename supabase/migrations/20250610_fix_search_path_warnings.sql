
-- Fix function_search_path_mutable warnings by setting search_path and schema-qualifying references

-- 1. Fix simplified_equipment_create_permission function
CREATE OR REPLACE FUNCTION public.simplified_equipment_create_permission(p_user_id uuid, p_team_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_temp
AS $function$
DECLARE
  v_user_org_id UUID;
  v_app_user_id UUID;
  v_team_org_id UUID;
  v_team_role TEXT;
  v_result JSONB;
BEGIN
  -- Get user's organization ID directly (explicit cast for safety)
  SELECT org_id INTO v_user_org_id
  FROM public.user_profiles
  WHERE id = p_user_id;
  
  -- If no user profile found, return error
  IF v_user_org_id IS NULL THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'user_not_found'
    );
  END IF;
  
  -- Get app_user ID with explicit UUID handling
  SELECT id INTO v_app_user_id
  FROM public.app_user
  WHERE auth_uid = p_user_id::TEXT;
  
  -- Case 1: No team specified - use user's organization
  IF p_team_id IS NULL THEN
    RETURN jsonb_build_object(
      'can_create', true,
      'org_id', v_user_org_id,
      'reason', 'default_org'
    );
  END IF;
  
  -- Case 2: Team specified - check team permissions
  -- Get team's organization ID
  SELECT org_id INTO v_team_org_id
  FROM public.team
  WHERE id = p_team_id;
  
  IF v_team_org_id IS NULL THEN
    RETURN jsonb_build_object(
      'can_create', false,
      'reason', 'team_not_found'
    );
  END IF;
  
  -- Same organization check (fastest path)
  IF v_user_org_id = v_team_org_id THEN
    RETURN jsonb_build_object(
      'can_create', true,
      'org_id', v_team_org_id,
      'reason', 'same_org'
    );
  END IF;
  
  -- Team role check for external team
  -- Explicitly handle the join to avoid UUID comparison issues
  SELECT tr.role INTO v_team_role
  FROM public.team_member tm
  JOIN public.team_roles tr ON tr.team_member_id = tm.id
  WHERE tm.user_id = v_app_user_id
  AND tm.team_id = p_team_id;
  
  -- Check if role allows equipment creation
  IF v_team_role IN ('manager', 'owner', 'admin', 'creator') THEN
    RETURN jsonb_build_object(
      'can_create', true,
      'org_id', v_team_org_id,
      'reason', 'team_role'
    );
  END IF;
  
  -- Default: No permission
  RETURN jsonb_build_object(
    'can_create', false,
    'reason', 'insufficient_permission'
  );
END;
$function$;

-- 2. Fix get_user_role_in_team function
CREATE OR REPLACE FUNCTION public.get_user_role_in_team(p_user_uid uuid, p_team_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = pg_temp
AS $function$
DECLARE
  v_team_org_id UUID;
  v_app_user_id UUID;
  v_role TEXT;
BEGIN
  SELECT org_id INTO v_team_org_id FROM public.team WHERE id = p_team_id;

  SELECT id INTO v_app_user_id FROM public.app_user WHERE auth_uid = p_user_uid;

  -- highest role across direct team, org role, acl
  SELECT COALESCE(              -- priority order
         (SELECT role FROM public.team_roles tr
            JOIN public.team_member tm ON tr.team_member_id = tm.id
           WHERE tm.user_id = v_app_user_id AND tm.team_id = p_team_id
           ORDER BY array_position(
             ARRAY['owner','manager','admin','creator','technician','viewer'], role) LIMIT 1),
         (SELECT role FROM public.user_roles WHERE user_id = p_user_uid AND org_id = v_team_org_id LIMIT 1),
         (SELECT role FROM public.organization_acl
           WHERE subject_id = p_user_uid AND org_id = v_team_org_id
             AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1)
        ) INTO v_role;
  RETURN v_role;
END $function$;

-- 3. Fix get_org_managers function
CREATE OR REPLACE FUNCTION public.get_org_managers(p_org_id uuid)
 RETURNS TABLE(user_id uuid, display_name text, email text, role text, is_current_user boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_temp
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ur.user_id,
    up.display_name,
    au.email::text,  -- Explicitly cast email to text
    ur.role::text,
    (ur.user_id = auth.uid()) as is_current_user
  FROM public.user_roles ur
  JOIN public.user_profiles up ON ur.user_id = up.id
  JOIN auth.users au ON up.id = au.id  -- Direct join without casting
  WHERE ur.org_id = p_org_id
  AND ur.role IN ('owner', 'manager')
  AND up.is_deactivated = FALSE
  ORDER BY 
    CASE WHEN ur.role = 'owner' THEN 1 ELSE 2 END,
    up.display_name;
END;
$function$;

-- 4. Fix can_assign_team_role function
CREATE OR REPLACE FUNCTION public.can_assign_team_role(p_auth_user_id uuid, p_team_id uuid, p_role text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = pg_temp
AS $function$
DECLARE
  v_user_org_id UUID;
  v_team_org_id UUID;
  v_app_user_id UUID;
  v_user_org_role TEXT;
BEGIN
  -- Get user's organization
  SELECT org_id INTO v_user_org_id
  FROM public.user_profiles
  WHERE id = p_auth_user_id;
  
  -- Get team's organization
  SELECT org_id INTO v_team_org_id
  FROM public.team
  WHERE id = p_team_id;
  
  -- User must belong to some organization
  IF v_user_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's organization role
  SELECT role INTO v_user_org_role
  FROM public.user_roles
  WHERE user_id = p_auth_user_id
  AND org_id = v_user_org_id;
  
  -- Organization owners and managers can assign any role to teams in their org
  IF v_user_org_id = v_team_org_id AND v_user_org_role IN ('owner', 'manager') THEN
    RETURN TRUE;
  END IF;
  
  -- Get app_user ID to check team membership
  SELECT id INTO v_app_user_id
  FROM public.app_user
  WHERE auth_uid = p_auth_user_id;
  
  -- Check if user is a team manager
  RETURN EXISTS (
    SELECT 1
    FROM public.team_member tm
    JOIN public.team_roles tr ON tr.team_member_id = tm.id
    WHERE tm.user_id = v_app_user_id
    AND tm.team_id = p_team_id
    AND tr.role = 'manager'
  );
END;
$function$;

-- 5. Fix is_org_member function
CREATE OR REPLACE FUNCTION public.is_org_member(p_auth_user_id uuid, p_org_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = pg_temp
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = p_auth_user_id
    AND org_id = p_org_id
  );
END;
$function$;

-- 6. Fix get_org_role function
CREATE OR REPLACE FUNCTION public.get_org_role(p_auth_user_id uuid, p_org_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = pg_temp
AS $function$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM public.user_roles
  WHERE user_id = p_auth_user_id
  AND org_id = p_org_id;
  
  RETURN v_role;
END;
$function$;

-- 7. Fix can_submit_work_orders function
CREATE OR REPLACE FUNCTION public.can_submit_work_orders(p_user_id uuid, p_equipment_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = pg_temp
AS $function$
DECLARE
    v_equipment_org_id UUID;
    v_equipment_team_id UUID;
    v_app_user_id UUID;
    v_team_role TEXT;
BEGIN
    -- Get equipment details
    SELECT org_id, team_id INTO v_equipment_org_id, v_equipment_team_id
    FROM public.equipment
    WHERE id = p_equipment_id AND deleted_at IS NULL;
    
    IF v_equipment_org_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check org-level permissions
    IF EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = p_user_id
        AND org_id = v_equipment_org_id
        AND role IN ('owner', 'manager', 'technician')
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- Check team-level permissions if equipment is assigned to a team
    IF v_equipment_team_id IS NOT NULL THEN
        SELECT id INTO v_app_user_id
        FROM public.app_user
        WHERE auth_uid = p_user_id;
        
        IF v_app_user_id IS NOT NULL THEN
            SELECT tr.role INTO v_team_role
            FROM public.team_member tm
            JOIN public.team_roles tr ON tr.team_member_id = tm.id
            WHERE tm.user_id = v_app_user_id
            AND tm.team_id = v_equipment_team_id;
            
            RETURN v_team_role IN ('manager', 'owner', 'admin', 'technician', 'requestor');
        END IF;
    END IF;
    
    RETURN FALSE;
END;
$function$;

-- 8. Fix check_user_team_permission function
CREATE OR REPLACE FUNCTION public.check_user_team_permission(_user_id uuid, _team_id uuid, _required_roles text[])
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = pg_temp
AS $function$
DECLARE
  v_user_org_id UUID;
  v_team_org_id UUID;
  v_app_user_id UUID;
  v_role TEXT;
BEGIN
  -- Get user's org ID directly
  SELECT org_id INTO v_user_org_id
  FROM public.user_profiles
  WHERE id = _user_id::UUID;
  
  -- Get team's org ID directly
  SELECT org_id INTO v_team_org_id
  FROM public.team
  WHERE id = _team_id::UUID;
  
  -- If user and team are in same org, org-level permissions apply
  IF v_user_org_id = v_team_org_id THEN
    -- Check for org-level admin permissions
    IF EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id::UUID
      AND org_id = v_team_org_id
      AND role IN ('owner', 'manager', 'admin')
    ) THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  -- Get app_user ID for team membership check
  SELECT id INTO v_app_user_id
  FROM public.app_user
  WHERE auth_uid = _user_id::UUID;
  
  IF v_app_user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check team role directly without recursive calls
  SELECT tr.role INTO v_role
  FROM public.team_member tm
  JOIN public.team_roles tr ON tr.team_member_id = tm.id
  WHERE tm.user_id = v_app_user_id::UUID
  AND tm.team_id = _team_id::UUID
  LIMIT 1;
  
  -- Check if user's role is in the required roles array
  RETURN v_role = ANY(_required_roles);
END;
$function$;

-- 9. Fix check_equipment_permissions function
CREATE OR REPLACE FUNCTION public.check_equipment_permissions(_user_id uuid, _equipment_id uuid, _action text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = pg_temp
AS $function$
DECLARE
  v_equipment_org_id UUID;
  v_equipment_team_id UUID;
  v_user_org_id UUID;
  v_app_user_id UUID;
  v_team_role TEXT;
  v_required_roles TEXT[];
BEGIN
  -- Get equipment details with table alias
  SELECT e.org_id, e.team_id INTO v_equipment_org_id, v_equipment_team_id
  FROM public.equipment e
  WHERE e.id = _equipment_id::UUID
  AND e.deleted_at IS NULL;
  
  -- If equipment not found or deleted
  IF v_equipment_org_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's organization
  SELECT org_id INTO v_user_org_id
  FROM public.user_profiles
  WHERE id = _user_id::UUID;
  
  -- Default access check: same organization
  IF v_user_org_id = v_equipment_org_id THEN
    -- For view action, same org is sufficient
    IF _action = 'view' THEN
      RETURN TRUE;
    END IF;
    
    -- For edit/delete actions, check org-level admin permissions
    IF _action IN ('edit', 'delete') THEN
      RETURN EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = _user_id::UUID
        AND ur.org_id = v_equipment_org_id
        AND ur.role IN ('owner', 'manager', 'admin')
      );
    END IF;
  END IF;
  
  -- If equipment is assigned to a team, check team permissions
  IF v_equipment_team_id IS NOT NULL THEN
    -- Get app_user ID with proper table alias
    SELECT au.id INTO v_app_user_id
    FROM public.app_user au
    WHERE au.auth_uid = _user_id::UUID;
    
    IF v_app_user_id IS NULL THEN
      RETURN FALSE;
    END IF;
    
    -- Check team role with explicitly qualified column names
    SELECT tr.role INTO v_team_role
    FROM public.team_member tm
    JOIN public.team_roles tr ON tr.team_member_id = tm.id
    WHERE tm.user_id = v_app_user_id::UUID
    AND tm.team_id = v_equipment_team_id::UUID
    LIMIT 1;
    
    -- Define required roles based on action
    IF _action = 'view' THEN
      v_required_roles := ARRAY['viewer', 'technician', 'creator', 'manager', 'owner', 'admin'];
    ELSIF _action IN ('edit', 'delete') THEN
      v_required_roles := ARRAY['manager', 'owner', 'admin', 'creator'];
    END IF;
    
    -- Check if user's role is sufficient
    RETURN v_team_role = ANY(v_required_roles);
  END IF;
  
  -- Default deny if no conditions met
  RETURN FALSE;
END;
$function$;

-- 10. Fix get_team_member_role_safe function
CREATE OR REPLACE FUNCTION public.get_team_member_role_safe(auth_user_id uuid, team_id_param uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path = pg_temp
AS $function$
DECLARE
  v_app_user_id UUID;
  v_team_member_id UUID;
  v_role TEXT;
BEGIN
  -- Convert auth.users.id to app_user.id safely with explicit casting
  SELECT id INTO v_app_user_id
  FROM public.app_user
  WHERE auth_uid::UUID = auth_user_id;
  
  IF v_app_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get team_member record
  SELECT id INTO v_team_member_id
  FROM public.team_member
  WHERE user_id = v_app_user_id AND team_id = team_id_param;
  
  IF v_team_member_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Get the role
  SELECT role INTO v_role
  FROM public.team_roles
  WHERE team_member_id = v_team_member_id;
  
  RETURN v_role;
END;
$function$;
