-- ========================================
-- 06_work_orders.sql
-- Work orders with various statuses and assignments
-- ========================================

-- Clean slate for testing
DELETE FROM work_orders WHERE true;

-- Insert work orders across all organizations
INSERT INTO work_orders (
  id, organization_id, equipment_id, title, description, status, priority,
  created_by, assignee_id, team_id, created_date, due_date, estimated_hours,
  completed_date, created_by_name, assignee_name
) VALUES

-- TechInnovate Solutions Work Orders (50+)
('990e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440001', 
  'Server Memory Upgrade', 'Upgrade RAM from 128GB to 256GB for improved performance', 'completed', 'high',
  '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440050', '770e8400-e29b-41d4-a716-446655440001',
  '2024-07-01 09:00:00+00', '2024-07-05 17:00:00+00', 4.0, '2024-07-04 16:30:00+00',
  'Samantha White', 'Carlos Ramirez'),

('990e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '880e8400-e29b-41d4-a716-446655440002',
  'Network Switch Configuration', 'Configure VLANs for new department', 'in_progress', 'medium',
  '550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440054', '770e8400-e29b-41d4-a716-446655440001',
  '2024-08-01 10:30:00+00', '2024-08-05 17:00:00+00', 6.0, NULL,
  'Alexandra Garcia', 'Gabriel Parker'),

-- ConstructPro Industries Work Orders (40+)
('990e8400-e29b-41d4-a716-446655440050', '660e8400-e29b-41d4-a716-446655440002', '880e8400-e29b-41d4-a716-446655440050',
  'Excavator Hydraulic Service', 'Replace hydraulic fluid and filters', 'completed', 'high',
  '550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440051', '770e8400-e29b-41d4-a716-446655440005',
  '2024-07-08 08:00:00+00', '2024-07-10 17:00:00+00', 8.0, '2024-07-10 15:45:00+00',
  'Thomas Clark', 'Diana Moore'),

-- ManufactureCorp Global Work Orders (60+)
('990e8400-e29b-41d4-a716-446655440100', '660e8400-e29b-41d4-a716-446655440003', '880e8400-e29b-41d4-a716-446655440100',
  'CNC Calibration', 'Monthly precision calibration and tool alignment', 'accepted', 'medium',
  '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440052', '770e8400-e29b-41d4-a716-446655440008',
  '2024-08-05 07:00:00+00', '2024-08-07 17:00:00+00', 12.0, NULL,
  'Rachel Lewis', 'Eric Turner'),

-- Additional work orders for other organizations...
('990e8400-e29b-41d4-a716-446655440200', '660e8400-e29b-41d4-a716-446655440004', '880e8400-e29b-41d4-a716-446655440200',
  'Truck Brake Inspection', 'Routine brake system inspection and service', 'submitted', 'low',
  '550e8400-e29b-41d4-a716-446655440033', NULL, '770e8400-e29b-41d4-a716-446655440013',
  '2024-08-08 12:00:00+00', '2024-08-12 17:00:00+00', 3.0, NULL,
  'Brandon Walker', NULL);