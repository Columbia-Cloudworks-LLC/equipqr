
-- Add grace period columns to organization table
ALTER TABLE public.organization 
ADD COLUMN grace_period_start timestamp with time zone,
ADD COLUMN grace_period_end timestamp with time zone,
ADD COLUMN grace_period_notified boolean DEFAULT false;

-- Set grace period for all existing organizations (30 days from now)
UPDATE public.organization 
SET 
  grace_period_start = now(),
  grace_period_end = now() + interval '30 days',
  grace_period_notified = false
WHERE created_at < now() - interval '1 day'; -- Organizations created more than 1 day ago

-- Update the get_org_feature_access function to consider grace period
CREATE OR REPLACE FUNCTION public.get_org_feature_access(p_org_id uuid, p_feature_key text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_has_feature BOOLEAN := FALSE;
  v_org_record RECORD;
BEGIN
  -- Get organization details including grace period
  SELECT grace_period_end INTO v_org_record
  FROM public.organization
  WHERE id = p_org_id;
  
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
    RETURN TRUE;
  END IF;
  
  -- If no active subscription, check grace period
  IF v_org_record.grace_period_end IS NOT NULL AND v_org_record.grace_period_end > now() THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$function$;

-- Create a function to get grace period info
CREATE OR REPLACE FUNCTION public.get_org_grace_period_info(p_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org RECORD;
  v_days_remaining INTEGER;
BEGIN
  SELECT grace_period_start, grace_period_end, grace_period_notified
  INTO v_org
  FROM public.organization
  WHERE id = p_org_id;
  
  IF v_org.grace_period_end IS NULL THEN
    RETURN jsonb_build_object(
      'has_grace_period', false
    );
  END IF;
  
  -- Calculate days remaining
  v_days_remaining := GREATEST(0, EXTRACT(days FROM (v_org.grace_period_end - now()))::INTEGER);
  
  RETURN jsonb_build_object(
    'has_grace_period', true,
    'grace_period_start', v_org.grace_period_start,
    'grace_period_end', v_org.grace_period_end,
    'days_remaining', v_days_remaining,
    'is_active', v_org.grace_period_end > now(),
    'has_been_notified', v_org.grace_period_notified
  );
END;
$function$;
