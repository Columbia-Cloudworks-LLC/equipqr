
-- Create corrected function that counts ALL organization members as billable
CREATE OR REPLACE FUNCTION public.calculate_org_user_billing_corrected(p_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_users INTEGER := 0;
  v_billable_users INTEGER := 0;
  v_monthly_cost_cents INTEGER := 0;
  v_equipment_count INTEGER := 0;
BEGIN
  -- Get equipment count to determine if billing is required
  SELECT COUNT(*) INTO v_equipment_count
  FROM public.equipment
  WHERE org_id = p_org_id AND deleted_at IS NULL;
  
  -- If no equipment, no billing required
  IF v_equipment_count = 0 THEN
    RETURN jsonb_build_object(
      'total_users', 0,
      'billable_users', 0,
      'monthly_cost_cents', 0,
      'equipment_count', v_equipment_count,
      'billing_required', false
    );
  END IF;
  
  -- Count total users in organization
  SELECT COUNT(*) INTO v_total_users
  FROM public.user_roles
  WHERE org_id = p_org_id;
  
  -- ALL users are billable - no role exclusions
  v_billable_users := v_total_users;
  
  -- Calculate monthly cost ($10 per user)
  v_monthly_cost_cents := v_billable_users * 1000; -- $10.00 in cents
  
  -- Upsert the license record
  INSERT INTO public.organization_user_licenses (
    org_id,
    billable_users,
    total_users,
    monthly_cost_cents,
    calculated_at
  ) VALUES (
    p_org_id,
    v_billable_users,
    v_total_users,
    v_monthly_cost_cents,
    now()
  )
  ON CONFLICT (org_id)
  DO UPDATE SET
    billable_users = EXCLUDED.billable_users,
    total_users = EXCLUDED.total_users,
    monthly_cost_cents = EXCLUDED.monthly_cost_cents,
    calculated_at = EXCLUDED.calculated_at,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'total_users', v_total_users,
    'billable_users', v_billable_users,
    'monthly_cost_cents', v_monthly_cost_cents,
    'equipment_count', v_equipment_count,
    'billing_required', true
  );
END;
$function$;
