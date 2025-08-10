-- ========================================
-- 01_users_and_profiles.sql
-- Core user profiles for testing
-- ========================================

-- Clean slate for testing
DELETE FROM profiles WHERE true;

-- Insert comprehensive user profiles with proper UUIDs
INSERT INTO profiles (id, name, email, created_at, updated_at) VALUES
-- Super Admin Users (2)
('550e8400-e29b-41d4-a716-446655440001', 'Sarah Chen', 'sarah.chen@equipqr.com', '2024-01-15 10:00:00+00', '2024-01-15 10:00:00+00'),
('550e8400-e29b-41d4-a716-446655440002', 'Marcus Williams', 'marcus.williams@equipqr.com', '2024-01-16 09:30:00+00', '2024-01-16 09:30:00+00'),

-- Organization Owners (5)
('550e8400-e29b-41d4-a716-446655440010', 'David Rodriguez', 'david@techinnovate.com', '2024-02-01 08:00:00+00', '2024-02-01 08:00:00+00'),
('550e8400-e29b-41d4-a716-446655440011', 'Lisa Thompson', 'lisa@constructpro.com', '2024-02-02 14:15:00+00', '2024-02-02 14:15:00+00'),
('550e8400-e29b-41d4-a716-446655440012', 'James Wilson', 'james@manufacturecorp.com', '2024-02-03 11:45:00+00', '2024-02-03 11:45:00+00'),
('550e8400-e29b-41d4-a716-446655440013', 'Emily Davis', 'emily@logisticssolutions.com', '2024-02-04 13:20:00+00', '2024-02-04 13:20:00+00'),
('550e8400-e29b-41d4-a716-446655440014', 'Michael Brown', 'michael@solooperations.com', '2024-02-05 16:30:00+00', '2024-02-05 16:30:00+00'),

-- Organization Admins (8)
('550e8400-e29b-41d4-a716-446655440020', 'Alexandra Garcia', 'alex@techinnovate.com', '2024-02-10 09:00:00+00', '2024-02-10 09:00:00+00'),
('550e8400-e29b-41d4-a716-446655440021', 'Robert Miller', 'robert@constructpro.com', '2024-02-11 10:30:00+00', '2024-02-11 10:30:00+00'),
('550e8400-e29b-41d4-a716-446655440022', 'Jennifer Lee', 'jennifer@manufacturecorp.com', '2024-02-12 08:45:00+00', '2024-02-12 08:45:00+00'),
('550e8400-e29b-41d4-a716-446655440023', 'Christopher Taylor', 'chris@logisticssolutions.com', '2024-02-13 15:00:00+00', '2024-02-13 15:00:00+00'),
('550e8400-e29b-41d4-a716-446655440024', 'Amanda Johnson', 'amanda@techinnovate.com', '2024-02-14 12:15:00+00', '2024-02-14 12:15:00+00'),
('550e8400-e29b-41d4-a716-446655440025', 'Kevin Anderson', 'kevin@constructpro.com', '2024-02-15 14:45:00+00', '2024-02-15 14:45:00+00'),
('550e8400-e29b-41d4-a716-446655440026', 'Nicole Martinez', 'nicole@manufacturecorp.com', '2024-02-16 11:00:00+00', '2024-02-16 11:00:00+00'),
('550e8400-e29b-41d4-a716-446655440027', 'Daniel Jackson', 'daniel@energycorp.com', '2024-02-17 13:30:00+00', '2024-02-17 13:30:00+00'),

-- Team Managers (12)
('550e8400-e29b-41d4-a716-446655440030', 'Samantha White', 'sam@techinnovate.com', '2024-03-01 09:15:00+00', '2024-03-01 09:15:00+00'),
('550e8400-e29b-41d4-a716-446655440031', 'Thomas Clark', 'thomas@constructpro.com', '2024-03-02 10:45:00+00', '2024-03-02 10:45:00+00'),
('550e8400-e29b-41d4-a716-446655440032', 'Rachel Lewis', 'rachel@manufacturecorp.com', '2024-03-03 08:30:00+00', '2024-03-03 08:30:00+00'),
('550e8400-e29b-41d4-a716-446655440033', 'Brandon Walker', 'brandon@logisticssolutions.com', '2024-03-04 14:20:00+00', '2024-03-04 14:20:00+00'),
('550e8400-e29b-41d4-a716-446655440034', 'Victoria Hall', 'victoria@techinnovate.com', '2024-03-05 16:00:00+00', '2024-03-05 16:00:00+00'),
('550e8400-e29b-41d4-a716-446655440035', 'Steven Allen', 'steven@constructpro.com', '2024-03-06 12:30:00+00', '2024-03-06 12:30:00+00'),
('550e8400-e29b-41d4-a716-446655440036', 'Megan Young', 'megan@manufacturecorp.com', '2024-03-07 11:15:00+00', '2024-03-07 11:15:00+00'),
('550e8400-e29b-41d4-a716-446655440037', 'Ryan King', 'ryan@logisticssolutions.com', '2024-03-08 15:45:00+00', '2024-03-08 15:45:00+00'),
('550e8400-e29b-41d4-a716-446655440038', 'Courtney Wright', 'courtney@energycorp.com', '2024-03-09 09:45:00+00', '2024-03-09 09:45:00+00'),
('550e8400-e29b-41d4-a716-446655440039', 'Gregory Lopez', 'greg@hospitalcorp.com', '2024-03-10 13:00:00+00', '2024-03-10 13:00:00+00'),
('550e8400-e29b-41d4-a716-446655440040', 'Stephanie Hill', 'stephanie@retailchain.com', '2024-03-11 10:20:00+00', '2024-03-11 10:20:00+00'),
('550e8400-e29b-41d4-a716-446655440041', 'Justin Green', 'justin@foodservice.com', '2024-03-12 14:10:00+00', '2024-03-12 14:10:00+00'),

-- Technicians and Members (25)
('550e8400-e29b-41d4-a716-446655440050', 'Carlos Ramirez', 'carlos@techinnovate.com', '2024-04-01 08:00:00+00', '2024-04-01 08:00:00+00'),
('550e8400-e29b-41d4-a716-446655440051', 'Diana Moore', 'diana@constructpro.com', '2024-04-02 09:30:00+00', '2024-04-02 09:30:00+00'),
('550e8400-e29b-41d4-a716-446655440052', 'Eric Turner', 'eric@manufacturecorp.com', '2024-04-03 11:00:00+00', '2024-04-03 11:00:00+00'),
('550e8400-e29b-41d4-a716-446655440053', 'Fiona Phillips', 'fiona@logisticssolutions.com', '2024-04-04 12:45:00+00', '2024-04-04 12:45:00+00'),
('550e8400-e29b-41d4-a716-446655440054', 'Gabriel Parker', 'gabriel@techinnovate.com', '2024-04-05 14:15:00+00', '2024-04-05 14:15:00+00'),
('550e8400-e29b-41d4-a716-446655440055', 'Hannah Evans', 'hannah@constructpro.com', '2024-04-06 15:30:00+00', '2024-04-06 15:30:00+00'),
('550e8400-e29b-41d4-a716-446655440056', 'Ian Edwards', 'ian@manufacturecorp.com', '2024-04-07 16:45:00+00', '2024-04-07 16:45:00+00'),
('550e8400-e29b-41d4-a716-446655440057', 'Julia Collins', 'julia@logisticssolutions.com', '2024-04-08 08:20:00+00', '2024-04-08 08:20:00+00'),
('550e8400-e29b-41d4-a716-446655440058', 'Kyle Stewart', 'kyle@energycorp.com', '2024-04-09 09:40:00+00', '2024-04-09 09:40:00+00'),
('550e8400-e29b-41d4-a716-446655440059', 'Laura Sanchez', 'laura@hospitalcorp.com', '2024-04-10 10:50:00+00', '2024-04-10 10:50:00+00'),
('550e8400-e29b-41d4-a716-446655440060', 'Mason Morris', 'mason@retailchain.com', '2024-04-11 12:10:00+00', '2024-04-11 12:10:00+00'),
('550e8400-e29b-41d4-a716-446655440061', 'Natalie Rogers', 'natalie@foodservice.com', '2024-04-12 13:25:00+00', '2024-04-12 13:25:00+00'),
('550e8400-e29b-41d4-a716-446655440062', 'Oscar Reed', 'oscar@techinnovate.com', '2024-04-13 14:35:00+00', '2024-04-13 14:35:00+00'),
('550e8400-e29b-41d4-a716-446655440063', 'Paige Cook', 'paige@constructpro.com', '2024-04-14 15:50:00+00', '2024-04-14 15:50:00+00'),
('550e8400-e29b-41d4-a716-446655440064', 'Quinn Bailey', 'quinn@manufacturecorp.com', '2024-04-15 16:15:00+00', '2024-04-15 16:15:00+00'),
('550e8400-e29b-41d4-a716-446655440065', 'Riley Rivera', 'riley@logisticssolutions.com', '2024-04-16 08:40:00+00', '2024-04-16 08:40:00+00'),
('550e8400-e29b-41d4-a716-446655440066', 'Sidney Cooper', 'sidney@energycorp.com', '2024-04-17 09:55:00+00', '2024-04-17 09:55:00+00'),
('550e8400-e29b-41d4-a716-446655440067', 'Tyler Richardson', 'tyler@hospitalcorp.com', '2024-04-18 11:05:00+00', '2024-04-18 11:05:00+00'),
('550e8400-e29b-41d4-a716-446655440068', 'Uma Cox', 'uma@retailchain.com', '2024-04-19 12:20:00+00', '2024-04-19 12:20:00+00'),
('550e8400-e29b-41d4-a716-446655440069', 'Victor Ward', 'victor@foodservice.com', '2024-04-20 13:35:00+00', '2024-04-20 13:35:00+00'),
('550e8400-e29b-41d4-a716-446655440070', 'Wendy Torres', 'wendy@techinnovate.com', '2024-04-21 14:45:00+00', '2024-04-21 14:45:00+00'),
('550e8400-e29b-41d4-a716-446655440071', 'Xavier Peterson', 'xavier@constructpro.com', '2024-04-22 15:55:00+00', '2024-04-22 15:55:00+00'),
('550e8400-e29b-41d4-a716-446655440072', 'Yasmin Gray', 'yasmin@manufacturecorp.com', '2024-04-23 16:25:00+00', '2024-04-23 16:25:00+00'),
('550e8400-e29b-41d4-a716-446655440073', 'Zachary Ramirez', 'zachary@logisticssolutions.com', '2024-04-24 08:15:00+00', '2024-04-24 08:15:00+00'),
('550e8400-e29b-41d4-a716-446655440074', 'Abigail Foster', 'abigail@energycorp.com', '2024-04-25 09:25:00+00', '2024-04-25 09:25:00+00');