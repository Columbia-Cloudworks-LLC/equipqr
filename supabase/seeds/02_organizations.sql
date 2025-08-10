-- ========================================
-- 02_organizations.sql
-- Organizations with different plans and sizes
-- ========================================

-- Clean slate for testing
DELETE FROM organizations WHERE true;

-- Insert organizations with varying characteristics
INSERT INTO organizations (
  id, 
  name, 
  plan, 
  member_count, 
  max_members, 
  features, 
  fleet_map_enabled,
  storage_used_mb,
  billable_members,
  created_at, 
  updated_at
) VALUES
-- Large Premium Organizations (3)
('660e8400-e29b-41d4-a716-446655440001', 'TechInnovate Solutions', 'premium', 28, 50, 
  ARRAY['Equipment Management', 'Work Orders', 'Team Management', 'Fleet Map', 'Advanced Analytics'], 
  true, 450, 27, '2024-01-20 10:00:00+00', '2024-08-01 15:30:00+00'),

('660e8400-e29b-41d4-a716-446655440002', 'ConstructPro Industries', 'premium', 22, 40, 
  ARRAY['Equipment Management', 'Work Orders', 'Team Management', 'Fleet Map', 'Custom Reports'], 
  true, 320, 21, '2024-01-25 14:30:00+00', '2024-08-01 12:15:00+00'),

('660e8400-e29b-41d4-a716-446655440003', 'ManufactureCorp Global', 'premium', 35, 60, 
  ARRAY['Equipment Management', 'Work Orders', 'Team Management', 'Fleet Map', 'API Access'], 
  true, 680, 34, '2024-02-01 09:15:00+00', '2024-08-01 16:45:00+00'),

-- Medium Free Organizations (2)
('660e8400-e29b-41d4-a716-446655440004', 'Logistics Solutions Inc', 'free', 12, 15, 
  ARRAY['Equipment Management', 'Work Orders', 'Team Management'], 
  false, 89, 11, '2024-02-10 11:20:00+00', '2024-07-30 14:20:00+00'),

('660e8400-e29b-41d4-a716-446655440005', 'Energy Corp', 'free', 8, 10, 
  ARRAY['Equipment Management', 'Work Orders', 'Team Management'], 
  false, 65, 7, '2024-02-15 13:45:00+00', '2024-07-28 10:30:00+00'),

-- Small Organizations (3)
('660e8400-e29b-41d4-a716-446655440006', 'Hospital Corp', 'free', 6, 8, 
  ARRAY['Equipment Management', 'Work Orders', 'Team Management'], 
  false, 42, 5, '2024-03-01 08:30:00+00', '2024-07-25 11:45:00+00'),

('660e8400-e29b-41d4-a716-446655440007', 'Retail Chain Ltd', 'free', 4, 5, 
  ARRAY['Equipment Management', 'Work Orders', 'Team Management'], 
  false, 28, 3, '2024-03-10 16:00:00+00', '2024-07-20 09:15:00+00'),

('660e8400-e29b-41d4-a716-446655440008', 'Food Service Co', 'free', 5, 6, 
  ARRAY['Equipment Management', 'Work Orders', 'Team Management'], 
  false, 34, 4, '2024-03-20 12:15:00+00', '2024-07-15 13:30:00+00'),

-- Single User Organization (1)
('660e8400-e29b-41d4-a716-446655440009', 'Solo Operations', 'free', 1, 5, 
  ARRAY['Equipment Management', 'Work Orders', 'Team Management'], 
  false, 12, 0, '2024-04-01 10:45:00+00', '2024-07-10 15:00:00+00');