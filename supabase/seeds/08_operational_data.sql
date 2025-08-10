-- ========================================
-- 08_operational_data.sql
-- Notes, scans, notifications, and operational records
-- ========================================

-- Clean slate for testing
DELETE FROM equipment_notes WHERE true;
DELETE FROM scans WHERE true;
DELETE FROM notifications WHERE true;

-- Insert equipment notes
INSERT INTO equipment_notes (
  id, equipment_id, author_id, author_name, content, 
  is_private, hours_worked, created_at
) VALUES

(gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440050', 'Carlos Ramirez',
  'Completed memory upgrade successfully. System performance improved significantly. RAM utilization now optimal.',
  false, 4.0, '2024-07-04 16:30:00+00'),

(gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440051', 'Diana Moore',
  'Hydraulic system service completed. All filters replaced, fluid levels optimal. Next service due in 250 hours.',
  false, 8.0, '2024-07-10 15:45:00+00'),

(gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440100', '550e8400-e29b-41d4-a716-446655440052', 'Eric Turner',
  'Tool calibration in progress. Precision measurements within tolerance. Expected completion tomorrow.',
  false, 6.0, '2024-08-06 14:20:00+00');

-- Insert equipment scans
INSERT INTO scans (
  id, equipment_id, scanned_by, scanned_at, 
  location, notes
) VALUES

(gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440050',
  '2024-08-01 09:15:00+00', 'Data Center A - Rack 1', 'Routine inspection scan'),

(gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440200', '550e8400-e29b-41d4-a716-446655440053',
  '2024-08-02 14:30:00+00', 'Fleet Parking - Bay 12', 'Pre-delivery vehicle check'),

(gen_random_uuid(), '880e8400-e29b-41d4-a716-446655440400', '550e8400-e29b-41d4-a716-446655440059',
  '2024-08-03 10:45:00+00', 'Radiology - Room 203', 'Daily safety verification');

-- Insert notifications
INSERT INTO notifications (
  id, organization_id, user_id, type, title, message, 
  data, read, created_at
) VALUES

(gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440030',
  'work_order_completed', 'Work Order Completed', 'Server Memory Upgrade has been completed successfully',
  '{"work_order_id": "990e8400-e29b-41d4-a716-446655440001", "equipment_name": "Dell PowerEdge R740"}',
  false, '2024-07-04 16:35:00+00'),

(gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440031',
  'maintenance_due', 'Maintenance Due', 'Excavator hydraulic service is due next week',
  '{"equipment_id": "880e8400-e29b-41d4-a716-446655440050", "due_date": "2024-08-15"}',
  false, '2024-08-08 08:00:00+00'),

(gen_random_uuid(), '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440032',
  'equipment_alert', 'Equipment Alert', 'CNC machine requires calibration check',
  '{"equipment_id": "880e8400-e29b-41d4-a716-446655440100", "priority": "medium"}',
  true, '2024-08-05 07:30:00+00');