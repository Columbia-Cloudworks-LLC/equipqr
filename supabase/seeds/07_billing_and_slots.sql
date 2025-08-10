-- ========================================
-- 07_billing_and_slots.sql
-- Billing data, slots, and subscription information
-- ========================================

-- Clean slate for testing
DELETE FROM organization_slots WHERE true;
DELETE FROM billing_exemptions WHERE true;

-- Insert organization slots for premium organizations
INSERT INTO organization_slots (
  id, organization_id, slot_type, purchased_slots, used_slots,
  billing_period_start, billing_period_end, amount_paid_cents,
  stripe_subscription_id, auto_renew
) VALUES

-- TechInnovate Solutions - Large Premium
(gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', 'user_license', 50, 28,
  '2024-08-01 00:00:00+00', '2024-09-01 00:00:00+00', 50000,
  'sub_tech_innovate_001', true),

-- ConstructPro Industries - Large Premium  
(gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440002', 'user_license', 40, 22,
  '2024-08-01 00:00:00+00', '2024-09-01 00:00:00+00', 40000,
  'sub_construct_pro_001', true),

-- ManufactureCorp Global - Large Premium
(gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440003', 'user_license', 60, 35,
  '2024-08-01 00:00:00+00', '2024-09-01 00:00:00+00', 60000,
  'sub_manufacture_corp_001', true);

-- Insert billing exemptions for testing
INSERT INTO billing_exemptions (
  id, organization_id, exemption_type, exemption_value, reason,
  granted_by, granted_at, expires_at, is_active
) VALUES

-- Free tier exemption for small organization
(gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440006', 'user_licenses', 5,
  'Non-profit organization exemption', '550e8400-e29b-41d4-a716-446655440001',
  '2024-03-15 10:00:00+00', '2025-03-15 10:00:00+00', true),

-- Beta testing exemption
(gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440004', 'user_licenses', 10,
  'Beta testing program participant', '550e8400-e29b-41d4-a716-446655440001',
  '2024-02-01 10:00:00+00', '2024-12-31 23:59:59+00', true);