-- ================================================
-- NIRA INTELLIGENT CIVIC DRAINAGE SYSTEM SCHEMA
-- Supabase PostgreSQL Database Tables
-- ================================================

CREATE TABLE IF NOT EXISTS drainage_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_code VARCHAR(50) UNIQUE NOT NULL,
    photo_url TEXT NOT NULL,
    issue_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    ward VARCHAR(100) NOT NULL,
    ward_number INT NOT NULL,
    priority_score INT DEFAULT 50,
    status VARCHAR(30) DEFAULT 'OPEN',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    description TEXT NOT NULL,
    landmark VARCHAR(150),
    reporter_name VARCHAR(100) NOT NULL,
    reporter_phone VARCHAR(20) NOT NULL,
    escalated_reason TEXT,
    assigned_officer VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hotspot_clusters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward VARCHAR(100) NOT NULL,
    ward_number INT NOT NULL,
    report_count INT DEFAULT 1,
    risk_level VARCHAR(20) DEFAULT 'MODERATE',
    center_lat DOUBLE PRECISION NOT NULL,
    center_lng DOUBLE PRECISION NOT NULL,
    location_name VARCHAR(150) NOT NULL,
    last_reported VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================
-- CLOSED-LOOP RESOLUTION & AI VERIFICATION SCHEMA
-- ================================================
ALTER TABLE drainage_reports ADD COLUMN IF NOT EXISTS assigned_crew VARCHAR(150);
ALTER TABLE drainage_reports ADD COLUMN IF NOT EXISTS resolution_photo_url TEXT;
ALTER TABLE drainage_reports ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE drainage_reports ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE drainage_reports ADD COLUMN IF NOT EXISTS sla_hours INT DEFAULT 6;
ALTER TABLE drainage_reports ADD COLUMN IF NOT EXISTS priority_explanation TEXT;
ALTER TABLE drainage_reports ADD COLUMN IF NOT EXISTS ai_confidence INT DEFAULT 94;
ALTER TABLE drainage_reports ADD COLUMN IF NOT EXISTS internal_notes JSONB DEFAULT '[]'::jsonb;
ALTER TABLE drainage_reports ADD COLUMN IF NOT EXISTS resolution_ai_verification JSONB;
