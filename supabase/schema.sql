-- ==========================================
-- ANAVANDI SMART TRANSIT PLATFORM SCHEMA
-- Supabase PostgreSQL Schema Migration File
-- ==========================================

-- Enable PostGIS or UUID Extensions if required
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BUSES TABLE
CREATE TABLE IF NOT EXISTS buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., KL-15-A-9821
    name VARCHAR(100) NOT NULL,            -- e.g., "KSRTC Swift Super Deluxe"
    category VARCHAR(50) NOT NULL,          -- 'Minnal', 'Swift', 'Super Fast', 'Fast Passenger', 'Ordinary'
    status VARCHAR(30) DEFAULT 'ACTIVE',    -- 'ACTIVE', 'DELAYED', 'MAINTENANCE', 'BREAKDOWN'
    capacity INT DEFAULT 40,
    current_occupancy INT DEFAULT 18,
    speed_kmh INT DEFAULT 55,
    current_lat DOUBLE PRECISION DEFAULT 9.9674,
    current_lng DOUBLE PRECISION DEFAULT 76.2998,
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ROUTES TABLE
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_code VARCHAR(30) UNIQUE NOT NULL, -- e.g., R-EKN-MNR
    origin VARCHAR(100) NOT NULL,            -- e.g., "Ernakulam Vyttila Hub"
    destination VARCHAR(100) NOT NULL,       -- e.g., "Munnar KSRTC Depot"
    distance_km NUMERIC(6,2) NOT NULL,
    estimated_mins INT NOT NULL,
    stops JSONB DEFAULT '[]'::jsonb,         -- Array of stops [{name, timeOffset}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID REFERENCES buses(id) ON DELETE CASCADE,
    route_id UUID REFERENCES routes(id) ON DELETE CASCADE,
    departure_time VARCHAR(20) NOT NULL,     -- e.g., "06:30 AM"
    arrival_time VARCHAR(20) NOT NULL,       -- e.g., "11:15 AM"
    fare_inr NUMERIC(8,2) NOT NULL,
    available_seats INT DEFAULT 22,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES schedules(id) ON DELETE CASCADE,
    passenger_name VARCHAR(100) NOT NULL,
    passenger_phone VARCHAR(20) NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    ticket_code VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(30) DEFAULT 'CONFIRMED',  -- 'CONFIRMED', 'CANCELLED', 'BOARDED'
    amount_paid NUMERIC(8,2) NOT NULL,
    qr_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. INCIDENTS & SOS TABLE
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
    reporter_type VARCHAR(30) DEFAULT 'COMMUTER', -- 'COMMUTER', 'DRIVER', 'DEPOT'
    issue_category VARCHAR(50) NOT NULL,           -- 'SOS_EMERGENCY', 'BREAKDOWN', 'OVERCHARGING', 'DIRTY_BUS', 'UNSCHEDULED_STOP'
    description TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'MEDIUM',         -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    status VARCHAR(30) DEFAULT 'OPEN',              -- 'OPEN', 'INVESTIGATING', 'RESOLVED'
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEED INITIAL MOCK DATA FOR DEMO
INSERT INTO buses (id, bus_number, name, category, status, capacity, current_occupancy, speed_kmh, current_lat, current_lng, driver_name, driver_phone)
VALUES 
('11111111-1111-1111-1111-111111111111', 'KL-15-A-9821', 'KSRTC Swift Gaju Express', 'Swift', 'ACTIVE', 40, 24, 62, 9.9674, 76.2998, 'K. Vijayakumar', '+91 98470 12345'),
('22222222-2222-2222-2222-222222222222', 'KL-15-B-1044', 'Minnal Night Super Express', 'Minnal', 'ACTIVE', 36, 30, 75, 10.0261, 76.3125, 'R. Soman', '+91 94471 67890'),
('33333333-3333-3333-3333-333333333333', 'KL-15-C-4455', 'Malabar Super Fast', 'Super Fast', 'DELAYED', 48, 41, 40, 9.5916, 76.5222, 'M. Ashraf', '+91 98952 34567'),
('44444444-4444-4444-4444-444444444444', 'KL-15-D-8820', 'High-Range Deluxe', 'Swift', 'ACTIVE', 40, 16, 48, 10.0889, 77.0597, 'S. Haridas', '+91 97455 90123')
ON CONFLICT (bus_number) DO NOTHING;

INSERT INTO routes (id, route_code, origin, destination, distance_km, estimated_mins, stops)
VALUES
('a1111111-1111-1111-1111-111111111111', 'R-EKN-MNR', 'Ernakulam Vyttila Hub', 'Munnar KSRTC Stand', 128.5, 270, '[{"name":"Vyttila Hub","offset":0},{"name":"Kothamangalam","offset":60},{"name":"Adimali","offset":180},{"name":"Munnar","offset":270}]'::jsonb),
('b2222222-2222-2222-2222-222222222222', 'R-TVM-CLT', 'Trivandrum Central', 'Kozhikode Mavoor Stand', 395.0, 540, '[{"name":"Thampanoor","offset":0},{"name":"Kollam","offset":90},{"name":"Alappuzha","offset":180},{"name":"Ernakulam","offset":250},{"name":"Thrissur","offset":360},{"name":"Kozhikode","offset":540}]'::jsonb),
('c3333333-3333-3333-3333-333333333333', 'R-KCH-TCR', 'Kochi Airport Transit', 'Thrissur Sakthan Stand', 55.0, 90, '[{"name":"Nedumbassery","offset":0},{"name":"Angamaly","offset":20},{"name":"Chalakudy","offset":45},{"name":"Thrissur","offset":90}]'::jsonb)
ON CONFLICT (route_code) DO NOTHING;
