-- ========================================
-- 04_teams_and_memberships.sql
-- Teams and team memberships with complex hierarchies
-- ========================================

-- Clean slate for testing
DELETE FROM team_members WHERE true;
DELETE FROM teams WHERE true;

-- Insert teams for each organization
INSERT INTO teams (id, organization_id, name, description, created_at, updated_at) VALUES

-- TechInnovate Solutions Teams (4 teams)
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'IT Operations', 'Core IT infrastructure and server management', '2024-02-15 10:00:00+00', '2024-02-15 10:00:00+00'),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'Field Maintenance', 'Equipment maintenance and repair teams', '2024-02-20 11:30:00+00', '2024-02-20 11:30:00+00'),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'Quality Assurance', 'Testing and quality control operations', '2024-02-25 14:15:00+00', '2024-02-25 14:15:00+00'),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', 'Research & Development', 'Innovation and product development', '2024-03-01 09:45:00+00', '2024-03-01 09:45:00+00'),

-- ConstructPro Industries Teams (3 teams)
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440002', 'Heavy Equipment', 'Construction machinery and heavy equipment', '2024-02-18 08:20:00+00', '2024-02-18 08:20:00+00'),
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440002', 'Safety & Compliance', 'Safety protocols and regulatory compliance', '2024-02-22 13:00:00+00', '2024-02-22 13:00:00+00'),
('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440002', 'Project Management', 'Site coordination and project oversight', '2024-02-28 16:30:00+00', '2024-02-28 16:30:00+00'),

-- ManufactureCorp Global Teams (5 teams)
('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440003', 'Production Line A', 'Primary manufacturing line operations', '2024-02-12 07:45:00+00', '2024-02-12 07:45:00+00'),
('770e8400-e29b-41d4-a716-446655440009', '660e8400-e29b-41d4-a716-446655440003', 'Production Line B', 'Secondary manufacturing line operations', '2024-02-16 12:20:00+00', '2024-02-16 12:20:00+00'),
('770e8400-e29b-41d4-a716-446655440010', '660e8400-e29b-41d4-a716-446655440003', 'Maintenance & Repair', 'Equipment maintenance and troubleshooting', '2024-02-20 15:10:00+00', '2024-02-20 15:10:00+00'),
('770e8400-e29b-41d4-a716-446655440011', '660e8400-e29b-41d4-a716-446655440003', 'Quality Control', 'Product testing and quality assurance', '2024-02-24 10:50:00+00', '2024-02-24 10:50:00+00'),
('770e8400-e29b-41d4-a716-446655440012', '660e8400-e29b-41d4-a716-446655440003', 'Logistics Hub', 'Shipping, receiving, and inventory management', '2024-02-28 08:35:00+00', '2024-02-28 08:35:00+00'),

-- Logistics Solutions Inc Teams (2 teams)
('770e8400-e29b-41d4-a716-446655440013', '660e8400-e29b-41d4-a716-446655440004', 'Fleet Operations', 'Vehicle maintenance and dispatch', '2024-02-25 11:15:00+00', '2024-02-25 11:15:00+00'),
('770e8400-e29b-41d4-a716-446655440014', '660e8400-e29b-41d4-a716-446655440004', 'Warehouse Management', 'Inventory and warehouse operations', '2024-03-01 14:40:00+00', '2024-03-01 14:40:00+00'),

-- Energy Corp Teams (2 teams)
('770e8400-e29b-41d4-a716-446655440015', '660e8400-e29b-41d4-a716-446655440005', 'Power Generation', 'Electrical systems and power management', '2024-03-05 09:30:00+00', '2024-03-05 09:30:00+00'),
('770e8400-e29b-41d4-a716-446655440016', '660e8400-e29b-41d4-a716-446655440005', 'Distribution Network', 'Grid maintenance and distribution', '2024-03-08 13:25:00+00', '2024-03-08 13:25:00+00'),

-- Hospital Corp Teams (1 team)
('770e8400-e29b-41d4-a716-446655440017', '660e8400-e29b-41d4-a716-446655440006', 'Medical Equipment', 'Healthcare equipment maintenance', '2024-03-15 10:45:00+00', '2024-03-15 10:45:00+00'),

-- Retail Chain Ltd Teams (1 team)
('770e8400-e29b-41d4-a716-446655440018', '660e8400-e29b-41d4-a716-446655440007', 'Store Operations', 'Point-of-sale and retail equipment', '2024-03-18 12:00:00+00', '2024-03-18 12:00:00+00'),

-- Food Service Co Teams (1 team)
('770e8400-e29b-41d4-a716-446655440019', '660e8400-e29b-41d4-a716-446655440008', 'Kitchen Equipment', 'Food service equipment maintenance', '2024-03-22 15:30:00+00', '2024-03-22 15:30:00+00');

-- Insert team memberships with complex role distributions
INSERT INTO team_members (id, team_id, user_id, role, joined_date) VALUES

-- TechInnovate Solutions Team Memberships
-- IT Operations Team
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440030', 'manager', '2024-03-01 09:15:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440050', 'technician', '2024-04-01 08:00:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440054', 'technician', '2024-04-05 14:15:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440062', 'requestor', '2024-04-13 14:35:00+00'),

-- Field Maintenance Team
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440034', 'manager', '2024-03-05 16:00:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440070', 'technician', '2024-04-21 14:45:00+00'),

-- ConstructPro Industries Team Memberships
-- Heavy Equipment Team
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440031', 'manager', '2024-03-02 10:45:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440051', 'technician', '2024-04-02 09:30:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440055', 'technician', '2024-04-06 15:30:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440063', 'requestor', '2024-04-14 15:50:00+00'),

-- Safety & Compliance Team
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440035', 'manager', '2024-03-06 12:30:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440071', 'technician', '2024-04-22 15:55:00+00'),

-- ManufactureCorp Global Team Memberships
-- Production Line A
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440032', 'manager', '2024-03-03 08:30:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440052', 'technician', '2024-04-03 11:00:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440056', 'technician', '2024-04-07 16:45:00+00'),

-- Production Line B
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440036', 'manager', '2024-03-07 11:15:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440064', 'technician', '2024-04-15 16:15:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440072', 'requestor', '2024-04-23 16:25:00+00'),

-- Logistics Solutions Inc Team Memberships
-- Fleet Operations
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440033', 'manager', '2024-03-04 14:20:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440053', 'technician', '2024-04-04 12:45:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440057', 'technician', '2024-04-08 08:20:00+00'),

-- Warehouse Management
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440037', 'manager', '2024-03-08 15:45:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440065', 'technician', '2024-04-16 08:40:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440073', 'requestor', '2024-04-24 08:15:00+00'),

-- Energy Corp Team Memberships
-- Power Generation
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440038', 'manager', '2024-03-09 09:45:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440058', 'technician', '2024-04-09 09:40:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440066', 'technician', '2024-04-17 09:55:00+00'),

-- Distribution Network
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440074', 'manager', '2024-04-25 09:25:00+00'),

-- Hospital Corp Team Memberships
-- Medical Equipment
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440039', 'manager', '2024-03-10 13:00:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440059', 'technician', '2024-04-10 10:50:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440017', '550e8400-e29b-41d4-a716-446655440067', 'requestor', '2024-04-18 11:05:00+00'),

-- Retail Chain Ltd Team Memberships
-- Store Operations
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440040', 'manager', '2024-03-11 10:20:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440060', 'technician', '2024-04-11 12:10:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440018', '550e8400-e29b-41d4-a716-446655440068', 'requestor', '2024-04-19 12:20:00+00'),

-- Food Service Co Team Memberships
-- Kitchen Equipment
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440041', 'manager', '2024-03-12 14:10:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440061', 'technician', '2024-04-12 13:25:00+00'),
(gen_random_uuid(), '770e8400-e29b-41d4-a716-446655440019', '550e8400-e29b-41d4-a716-446655440069', 'requestor', '2024-04-20 13:35:00+00');