

-- Create the get_org_feature_access_categorized function that properly handles exemptions

CREATE OR REPLACE FUNCTION public.get_org_feature_access_categorized(
  p_org_id uuid, 
  p_feature_key text, 
  p_feature_category text DEFAULT 'base'
)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_has_feature BOOLEAN := FALSE;
  v_grace_period_end TIMESTAMP WITH TIME ZONE;
  v_exemption_record RECORD;
BEGIN
  -- Add detailed logging for debugging
  RAISE LOG 'get_org_feature_access_categorized: Starting check for org_id=%, feature_key=%, category=%', 
    p_org_id, p_feature_key, p_feature_category;
  
  -- Check for active billing exemptions FIRST (highest priority)
  SELECT * INTO v_exemption_record
  FROM public.organization_billing_exemptions
  WHERE org_id = p_org_id
  AND is_active = true
  AND (expires_at IS NULL OR expires_at > now());
  
  -- If there's an active exemption, grant access immediately
  IF v_exemption_record IS NOT NULL THEN
    RAISE LOG 'get_org_feature_access_categorized: Found active exemption type=%, reason=% - GRANTING ACCESS', 
      v_exemption_record.exemption_type, v_exemption_record.reason;
    RETURN TRUE;
  ELSE
    RAISE LOG 'get_org_feature_access_categorized: No active exemptions found for org_id=%', p_org_id;
  END IF;
  
  -- Check if organization has active subscription for the feature
  SELECT EXISTS (
    SELECT 1 
    FROM public.feature_subscriptions fs
    JOIN public.subscription_features sf ON fs.feature_id = sf.id
    WHERE fs.org_id = p_org_id 
    AND sf.feature_key = p_feature_key
    AND fs.status = 'active'
    AND (fs.deactivated_at IS NULL OR fs.deactivated_at > now())
  ) INTO v_has_feature;
  
  -- If they have an active subscription, grant access
  IF v_has_feature THEN
    RAISE LOG 'get_org_feature_access_categorized: Found active subscription for feature=%', p_feature_key;
    RETURN TRUE;
  ELSE
    RAISE LOG 'get_org_feature_access_categorized: No active subscription found for feature=%', p_feature_key;
  END IF;
  
  -- For premium features, don't check grace period - they need explicit subscription or exemption
  IF p_feature_category = 'premium' THEN
    RAISE LOG 'get_org_feature_access_categorized: Premium feature requires subscription or exemption - ACCESS DENIED';
    RETURN FALSE;
  END IF;
  
  -- Check grace period for base features only
  BEGIN
    SELECT grace_period_end INTO v_grace_period_end
    FROM public.organization
    WHERE id = p_org_id;
    
    -- If grace period exists and is still active, grant access
    IF v_grace_period_end IS NOT NULL AND v_grace_period_end > now() THEN
      RAISE LOG 'get_org_feature_access_categorized: Grace period active until %', v_grace_period_end;
      RETURN TRUE;
    ELSE
      RAISE LOG 'get_org_feature_access_categorized: Grace period not active or expired';
    END IF;
  EXCEPTION
    WHEN undefined_column THEN
      -- If grace period columns don't exist, continue to denial
      RAISE LOG 'get_org_feature_access_categorized: Grace period columns do not exist in organization table';
      NULL;
  END;
  
  -- Check organization billing state grace period for base features
  BEGIN
    SELECT grace_period_end INTO v_grace_period_end
    FROM public.organization_billing_state
    WHERE org_id = p_org_id;
    
    -- If grace period exists and is still active, grant access
    IF v_grace_period_end IS NOT NULL AND v_grace_period_end > now() THEN
      RAISE LOG 'get_org_feature_access_categorized: Billing state grace period active until %', v_grace_period_end;
      RETURN TRUE;
    ELSE
      RAISE LOG 'get_org_feature_access_categorized: Billing state grace period not active or expired';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- If billing state table doesn't exist or has issues, continue
      RAISE LOG 'get_org_feature_access_categorized: Could not check billing state grace period';
      NULL;
  END;
  
  RAISE LOG 'get_org_feature_access_categorized: Access denied for org_id=%, feature_key=%, category=%', 
    p_org_id, p_feature_key, p_feature_category;
  RETURN FALSE;
END;
$function$;

