
-- Fix the calculate_org_user_billing_with_exemptions function to properly return exemption data

CREATE OR REPLACE FUNCTION public.calculate_org_user_billing_with_exemptions(p_org_id uuid)
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
  v_exemption_record RECORD;
  v_exemption_applied BOOLEAN := false;
  v_exemption_details JSONB := null;
  v_final_billable_users INTEGER := 0;
  v_final_cost_cents INTEGER := 0;
BEGIN
  -- Get equipment count to determine if billing is required
  SELECT COUNT(*) INTO v_equipment_count
  FROM public.equipment
  WHERE org_id = p_org_id AND deleted_at IS NULL;
  
  -- Count total users in organization
  SELECT COUNT(*) INTO v_total_users
  FROM public.user_roles
  WHERE org_id = p_org_id;
  
  -- If no equipment or no users, no billing required
  IF v_equipment_count = 0 OR v_total_users = 0 THEN
    RETURN jsonb_build_object(
      'total_users', v_total_users,
      'billable_users', 0,
      'monthly_cost_cents', 0,
      'equipment_count', v_equipment_count,
      'billing_required', false,
      'exemption_applied', false,
      'exemption_details', null
    );
  END IF;
  
  -- Count billable users (exclude viewers)
  SELECT COUNT(*) INTO v_billable_users
  FROM public.user_roles
  WHERE org_id = p_org_id
  AND role NOT IN ('viewer');
  
  -- Check for active billing exemptions
  SELECT * INTO v_exemption_record
  FROM public.organization_billing_exemptions
  WHERE org_id = p_org_id
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > now());
  
  -- Process exemption if found
  IF v_exemption_record IS NOT NULL THEN
    v_exemption_applied := true;
    
    -- Build exemption details
    v_exemption_details := jsonb_build_object(
      'type', 'organization',
      'exemption_type', v_exemption_record.exemption_type,
      'free_user_count', v_exemption_record.free_user_count,
      'reason', v_exemption_record.reason,
      'expires_at', v_exemption_record.expires_at
    );
    
    -- Apply exemption logic
    IF v_exemption_record.exemption_type = 'full' THEN
      -- Full exemption: no billing
      v_final_billable_users := 0;
      v_final_cost_cents := 0;
      v_exemption_details := v_exemption_details || jsonb_build_object('exempt_users', v_billable_users);
    ELSIF v_exemption_record.exemption_type = 'partial' AND v_exemption_record.free_user_count IS NOT NULL THEN
      -- Partial exemption: reduce billable users by free count
      v_final_billable_users := GREATEST(0, v_billable_users - v_exemption_record.free_user_count);
      v_final_cost_cents := v_final_billable_users * 1000; -- $10.00 per user in cents
      v_exemption_details := v_exemption_details || jsonb_build_object(
        'exempt_users', LEAST(v_billable_users, v_exemption_record.free_user_count)
      );
    ELSE
      -- Invalid exemption type, treat as no exemption
      v_exemption_applied := false;
      v_exemption_details := null;
      v_final_billable_users := v_billable_users;
      v_final_cost_cents := v_billable_users * 1000;
    END IF;
  ELSE
    -- No exemption
    v_final_billable_users := v_billable_users;
    v_final_cost_cents := v_billable_users * 1000; -- $10.00 per user in cents
  END IF;
  
  -- Upsert the license record with final calculated values
  INSERT INTO public.organization_user_licenses (
    org_id,
    billable_users,
    total_users,
    monthly_cost_cents,
    calculated_at
  ) VALUES (
    p_org_id,
    v_final_billable_users,
    v_total_users,
    v_final_cost_cents,
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
    'billable_users', v_final_billable_users,
    'monthly_cost_cents', v_final_cost_cents,
    'equipment_count', v_equipment_count,
    'billing_required', true,
    'exemption_applied', v_exemption_applied,
    'exemption_details', v_exemption_details
  );
END;
$function$;
