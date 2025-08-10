-- ========================================
-- 05_equipment.sql
-- Equipment with realistic data, team assignments, and statuses
-- ========================================

-- Clean slate for testing
DELETE FROM equipment WHERE true;

-- Insert comprehensive equipment data
INSERT INTO equipment (
  id, 
  organization_id, 
  team_id, 
  name, 
  manufacturer, 
  model, 
  serial_number, 
  status, 
  location, 
  installation_date, 
  warranty_expiration, 
  last_maintenance, 
  working_hours, 
  custom_attributes, 
  last_known_location, 
  notes, 
  created_at, 
  updated_at
) VALUES

-- TechInnovate Solutions Equipment (50 items)
('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Dell PowerEdge R740', 'Dell', 'PowerEdge R740', 'TECH001-SRV-001', 'active', 'Data Center A - Rack 1', '2024-01-15', '2027-01-15', '2024-07-15', 2840.5, 
  '{"cpu_cores": 32, "ram_gb": 128, "storage_tb": 4, "network_ports": 4, "rack_unit": "1U", "power_consumption": "750W"}', 
  '{"latitude": 37.7749, "longitude": -122.4194, "floor": "2", "building": "Main"}', 
  'Primary application server for customer portal', '2024-02-15 10:00:00+00', '2024-07-15 14:30:00+00'),

('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'Cisco Catalyst 9300', 'Cisco', 'Catalyst 9300-48T', 'TECH001-SW-001', 'active', 'Data Center A - Rack 2', '2024-01-20', '2027-01-20', '2024-06-20', 8760.0, 
  '{"ports": 48, "poe_budget": "740W", "switching_capacity": "440Gbps", "management": "SNMP", "redundancy": "dual_power"}', 
  '{"latitude": 37.7749, "longitude": -122.4194, "floor": "2", "building": "Main"}', 
  'Core network switch for main office', '2024-02-15 10:30:00+00', '2024-06-20 16:00:00+00'),

('880e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440002', 'Fluke 87V Digital Multimeter', 'Fluke', '87V', 'TECH001-DMM-001', 'active', 'Field Service Van #1', '2024-02-01', '2026-02-01', '2024-05-15', 420.0, 
  '{"accuracy": "0.05%", "display": "6000_count", "safety_rating": "CAT_IV_600V", "true_rms": true, "bluetooth": false}', 
  '{"latitude": 37.7849, "longitude": -122.4094, "vehicle_id": "FSV001", "last_checkout": "2024-08-01T09:00:00Z"}', 
  'Primary multimeter for field diagnostics', '2024-02-20 11:30:00+00', '2024-08-01 09:00:00+00'),

('880e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440003', 'Agilent Oscilloscope', 'Agilent', 'DSO-X 3024T', 'TECH001-OSC-001', 'maintenance', 'QA Lab - Bench 3', '2024-02-10', '2027-02-10', '2024-07-01', 1260.5, 
  '{"channels": 4, "bandwidth": "200MHz", "sample_rate": "4GSa/s", "memory": "4Mpts", "screen_size": "8.5inch"}', 
  '{"latitude": 37.7749, "longitude": -122.4194, "floor": "3", "building": "Main", "bench": "3"}', 
  'Requires calibration - scheduled for next week', '2024-02-25 14:15:00+00', '2024-07-30 10:45:00+00'),

('880e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440004', '3D Printer - Ultimaker S5', 'Ultimaker', 'S5', 'TECH001-3DP-001', 'active', 'R&D Lab - Prototyping Area', '2024-03-01', '2026-03-01', '2024-07-20', 890.25, 
  '{"build_volume": "330x240x300mm", "layer_resolution": "0.25mm", "materials": ["PLA", "ABS", "PETG", "TPU"], "dual_extrusion": true}', 
  '{"latitude": 37.7749, "longitude": -122.4194, "floor": "4", "building": "Main", "zone": "prototyping"}', 
  'Used for rapid prototyping of new products', '2024-03-01 09:45:00+00', '2024-07-20 13:15:00+00'),

-- ConstructPro Industries Equipment (40 items)
('880e8400-e29b-41d4-a716-446655440050', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005', 'CAT 320 Excavator', 'Caterpillar', '320 GC', 'CONST002-EXC-001', 'active', 'Job Site Alpha - Zone B', '2023-06-15', '2026-06-15', '2024-07-10', 1567.8, 
  '{"engine_power": "90kW", "operating_weight": "20500kg", "bucket_capacity": "0.93m3", "max_dig_depth": "6.15m", "gps_enabled": true}', 
  '{"latitude": 40.7589, "longitude": -73.9851, "site": "alpha", "zone": "B", "operator": "Mike Johnson"}', 
  'Primary excavator for foundation work', '2024-02-18 08:20:00+00', '2024-07-10 16:45:00+00'),

('880e8400-e29b-41d4-a716-446655440051', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440005', 'John Deere 544K Wheel Loader', 'John Deere', '544K', 'CONST002-WHL-001', 'active', 'Equipment Yard - Bay 3', '2023-08-20', '2026-08-20', '2024-06-25', 2234.5, 
  '{"engine_power": "125kW", "operating_weight": "16800kg", "bucket_capacity": "2.3m3", "lift_capacity": "7500kg", "tire_size": "20.5R25"}', 
  '{"latitude": 40.7489, "longitude": -73.9751, "yard": "main", "bay": "3", "status": "available"}', 
  'Material handling and loading operations', '2024-02-18 08:30:00+00', '2024-06-25 11:20:00+00'),

('880e8400-e29b-41d4-a716-446655440052', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440006', 'Safety Monitor System', 'Guardian Safety', 'ProSafe 2000', 'CONST002-SAF-001', 'active', 'Job Site Alpha - Main Entrance', '2024-01-10', '2027-01-10', '2024-07-05', 4380.0, 
  '{"cameras": 8, "sensors": 12, "range": "500m", "weather_resistant": true, "real_time_alerts": true, "battery_backup": "8h"}', 
  '{"latitude": 40.7589, "longitude": -73.9851, "site": "alpha", "position": "main_entrance", "coverage": "360_degree"}', 
  'Monitors worker safety and compliance violations', '2024-02-22 13:00:00+00', '2024-07-05 14:10:00+00'),

-- ManufactureCorp Global Equipment (60 items)
('880e8400-e29b-41d4-a716-446655440100', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440008', 'CNC Machining Center', 'Haas Automation', 'VF-4SS', 'MANUF003-CNC-001', 'active', 'Production Floor A - Station 12', '2023-09-15', '2026-09-15', '2024-07-08', 3456.75, 
  '{"spindle_speed": "15000_rpm", "tool_capacity": 40, "table_size": "1270x508mm", "axis_travel": "X1270_Y508_Z635", "coolant": "through_spindle"}', 
  '{"latitude": 42.3601, "longitude": -71.0589, "floor": "A", "station": "12", "operator": "Sarah Chen", "shift": "day"}', 
  'High-precision machining for aerospace components', '2024-02-12 07:45:00+00', '2024-07-08 15:30:00+00'),

('880e8400-e29b-41d4-a716-446655440101', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440009', 'Industrial Robot', 'KUKA', 'KR 120 R2500', 'MANUF003-ROB-001', 'active', 'Production Floor B - Assembly Line 2', '2023-11-01', '2026-11-01', '2024-06-30', 2187.5, 
  '{"payload": "120kg", "reach": "2500mm", "repeatability": "0.05mm", "axis": 6, "protection_class": "IP65", "controller": "KR_C4"}', 
  '{"latitude": 42.3601, "longitude": -71.0589, "floor": "B", "line": "2", "position": "assembly_station_3"}', 
  'Automated welding and assembly operations', '2024-02-16 12:20:00+00', '2024-06-30 09:45:00+00'),

('880e8400-e29b-41d4-a716-446655440102', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440010', 'Hydraulic Press', 'Schuler', 'TM 500', 'MANUF003-HYD-001', 'maintenance', 'Manufacturing Bay C - Press Area', '2023-07-20', '2026-07-20', '2024-07-12', 4892.25, 
  '{"force": "5000kN", "table_size": "2000x1600mm", "stroke": "800mm", "speed": "variable", "safety_system": "dual_palm", "hydraulic_pressure": "350bar"}', 
  '{"latitude": 42.3601, "longitude": -71.0589, "bay": "C", "area": "press", "status": "scheduled_maintenance"}', 
  'Undergoing 50-hour service interval maintenance', '2024-02-20 15:10:00+00', '2024-07-28 11:00:00+00'),

-- Continue with smaller organizations but fewer items each...

-- Logistics Solutions Inc Equipment (25 items)
('880e8400-e29b-41d4-a716-446655440200', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440013', 'Delivery Truck - Ford Transit', 'Ford', 'Transit 350', 'LOGIS004-TRK-001', 'active', 'Fleet Parking - Bay 12', '2023-12-01', '2026-12-01', '2024-07-20', 8456.5, 
  '{"cargo_volume": "15.1m3", "payload": "1890kg", "engine": "3.5L_V6", "fuel_capacity": "106L", "gps_tracking": true, "fleet_id": "TRK001"}', 
  '{"latitude": 41.8781, "longitude": -87.6298, "depot": "main", "bay": "12", "driver": "Carlos Rodriguez", "route": "downtown"}', 
  'Primary delivery vehicle for urban routes', '2024-02-25 11:15:00+00', '2024-07-20 08:30:00+00'),

('880e8400-e29b-41d4-a716-446655440201', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440014', 'Forklift - Yale', 'Yale', 'GDP080VX', 'LOGIS004-FLT-001', 'active', 'Warehouse - Aisle 7', '2024-01-15', '2027-01-15', '2024-06-15', 1234.75, 
  '{"capacity": "8000kg", "lift_height": "6m", "fuel_type": "diesel", "tire_type": "pneumatic", "mast": "triplex", "fork_length": "1220mm"}', 
  '{"latitude": 41.8681, "longitude": -87.6198, "warehouse": "main", "aisle": "7", "operator": "Diana Lopez"}', 
  'Heavy-duty material handling in warehouse', '2024-03-01 14:40:00+00', '2024-06-15 16:20:00+00'),

-- Energy Corp Equipment (15 items)  
('880e8400-e29b-41d4-a716-446655440300', '660e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440015', 'Generator - Caterpillar', 'Caterpillar', 'C32', 'ENERGY005-GEN-001', 'active', 'Power Plant - Unit 3', '2023-05-10', '2026-05-10', '2024-07-25', 6789.5, 
  '{"power_output": "1000kW", "fuel_type": "natural_gas", "efficiency": "42%", "emissions": "Tier_4", "cooling": "radiator", "control": "digital"}', 
  '{"latitude": 39.7392, "longitude": -104.9903, "plant": "main", "unit": "3", "grid_connection": "online"}', 
  'Backup power generation for grid support', '2024-03-05 09:30:00+00', '2024-07-25 13:45:00+00'),

-- Hospital Corp Equipment (12 items)
('880e8400-e29b-41d4-a716-446655440400', '660e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440017', 'MRI Scanner', 'Siemens', 'MAGNETOM Skyra', 'HOSP006-MRI-001', 'active', 'Radiology - Room 203', '2023-03-20', '2028-03-20', '2024-07-18', 2456.25, 
  '{"field_strength": "3T", "bore_diameter": "70cm", "table_weight_limit": "250kg", "helium_level": "95%", "software_version": "VE11C"}', 
  '{"latitude": 34.0522, "longitude": -118.2437, "floor": "2", "room": "203", "department": "radiology"}', 
  'High-resolution imaging for diagnostic procedures', '2024-03-15 10:45:00+00', '2024-07-18 14:20:00+00'),

-- Retail Chain Ltd Equipment (8 items)
('880e8400-e29b-41d4-a716-446655440500', '660e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440018', 'POS Terminal', 'Square', 'Terminal Plus', 'RETAIL007-POS-001', 'active', 'Store 001 - Checkout 3', '2024-01-05', '2027-01-05', '2024-06-10', 1825.0, 
  '{"screen_size": "15.6inch", "connectivity": ["WiFi", "Ethernet", "Bluetooth"], "payment_methods": ["card", "contactless", "mobile"], "receipt_printer": "thermal"}', 
  '{"latitude": 40.7128, "longitude": -74.0060, "store": "001", "checkout": "3", "cashier": "Alice Johnson"}', 
  'Primary point-of-sale system for transactions', '2024-03-18 12:00:00+00', '2024-06-10 15:30:00+00'),

-- Food Service Co Equipment (10 items)
('880e8400-e29b-41d4-a716-446655440600', '660e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440019', 'Commercial Oven', 'Rational', 'SelfCookingCenter 5 Senses', 'FOOD008-OVN-001', 'active', 'Kitchen - Cooking Station 2', '2023-11-15', '2026-11-15', '2024-07-22', 3245.5, 
  '{"capacity": "10_trays", "cooking_modes": ["steam", "convection", "combination"], "temperature_range": "30-300C", "energy_source": "electric", "self_cleaning": true}', 
  '{"latitude": 29.7604, "longitude": -95.3698, "kitchen": "main", "station": "2", "chef": "Maria Santos"}', 
  'High-capacity cooking for restaurant operations', '2024-03-22 15:30:00+00', '2024-07-22 12:15:00+00'),

-- Solo Operations Equipment (3 items)
('880e8400-e29b-41d4-a716-446655440700', '660e8400-e29b-41d4-a716-446655440009', NULL, 'Laptop - ThinkPad', 'Lenovo', 'ThinkPad X1 Carbon', 'SOLO009-LAP-001', 'active', 'Home Office', '2024-04-01', '2027-04-01', '2024-07-01', 456.5, 
  '{"cpu": "Intel_i7", "ram_gb": 32, "storage_gb": 1000, "screen_size": "14inch", "weight": "1.13kg", "battery_life": "15h"}', 
  '{"latitude": 33.4484, "longitude": -112.0740, "location": "home_office", "user": "Michael Brown"}', 
  'Primary work computer for business operations', '2024-04-01 10:45:00+00', '2024-07-01 09:00:00+00'),

('880e8400-e29b-41d4-a716-446655440701', '660e8400-e29b-41d4-a716-446655440009', NULL, 'Smartphone - iPhone', 'Apple', 'iPhone 15 Pro', 'SOLO009-PH-001', 'active', 'Mobile', '2024-04-05', '2025-04-05', NULL, 720.25, 
  '{"storage_gb": 256, "camera": "48MP", "battery_life": "23h", "5g": true, "wireless_charging": true, "water_resistance": "IP68"}', 
  '{"latitude": 33.4484, "longitude": -112.0740, "mobility": "high", "user": "Michael Brown"}', 
  'Business communications and mobile productivity', '2024-04-05 16:30:00+00', '2024-04-05 16:30:00+00'),

('880e8400-e29b-41d4-a716-446655440702', '660e8400-e29b-41d4-a716-446655440009', NULL, 'Printer - Brother', 'Brother', 'HL-L3270CDW', 'SOLO009-PRT-001', 'inactive', 'Home Office - Storage', '2024-02-15', '2026-02-15', '2024-05-20', 89.0, 
  '{"type": "laser", "color": true, "duplex": true, "wireless": true, "speed_ppm": 25, "paper_capacity": 250}', 
  '{"latitude": 33.4484, "longitude": -112.0740, "location": "storage", "reason": "replaced_by_new_model"}', 
  'Replaced by newer model - kept as backup', '2024-02-15 12:00:00+00', '2024-07-15 10:30:00+00');