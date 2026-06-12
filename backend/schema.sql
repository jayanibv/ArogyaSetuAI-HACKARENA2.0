-- ============================================================================
-- AarogyaSetu AI — Supabase PostgreSQL Schema
-- National Health Mission (NHM) ASHA Triage System
-- Version: 1.0.0 | Created: 2026-06-10
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- for gen_random_uuid()

-- ============================================================================
-- 1. USERS — ASHA Workers, Supervisors, Admins
-- ============================================================================
COMMENT ON TABLE users IS
  'ASHA workers and supervisory staff. Each row represents one authenticated user with role-based access.';

CREATE TABLE users (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone               VARCHAR(15)  UNIQUE NOT NULL,
  name                VARCHAR(100) NOT NULL,
  asha_id             VARCHAR(20),
  state               VARCHAR(50)  NOT NULL,
  district            VARCHAR(100) NOT NULL,
  preferred_language  VARCHAR(10)  DEFAULT 'hi-IN',
  role                VARCHAR(20)  DEFAULT 'asha_worker'
                        CHECK (role IN ('asha_worker', 'supervisor', 'admin')),
  is_active           BOOLEAN      DEFAULT true,
  created_at          TIMESTAMPTZ  DEFAULT now(),
  updated_at          TIMESTAMPTZ  DEFAULT now()
);

-- ============================================================================
-- 2. FACILITIES — Health centres referenced during referral
-- ============================================================================
-- NOTE: facilities must be created BEFORE triage_sessions (FK dependency)
COMMENT ON TABLE facilities IS
  'Government health facilities (Sub-Centres → Medical Colleges) used as referral destinations.';

CREATE TABLE facilities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(200) NOT NULL,
  type        VARCHAR(30)  NOT NULL
                CHECK (type IN ('SUB_CENTRE', 'PHC', 'CHC', 'DISTRICT_HOSPITAL', 'MEDICAL_COLLEGE')),
  state       VARCHAR(50)  NOT NULL,
  district    VARCHAR(100),
  address     TEXT,
  phone       VARCHAR(20),
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  is_24hr     BOOLEAN DEFAULT false,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 3. PATIENTS — Beneficiaries registered by ASHA workers
-- ============================================================================
COMMENT ON TABLE patients IS
  'Patient/beneficiary records created by ASHA workers during field visits.';

CREATE TABLE patients (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               VARCHAR(100) NOT NULL,
  age                INT          NOT NULL CHECK (age > 0 AND age <= 120),
  sex                VARCHAR(10)  NOT NULL CHECK (sex IN ('M', 'F', 'Other')),
  village            VARCHAR(100),
  district           VARCHAR(100),
  state              VARCHAR(50),
  pregnancy_status   BOOLEAN DEFAULT false,
  registered_by      UUID REFERENCES users(id),
  created_at         TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- 4. TRIAGE SESSIONS — Core AI-assisted triage records
-- ============================================================================
COMMENT ON TABLE triage_sessions IS
  'Each triage interaction: symptoms ➜ AI assessment ➜ severity ➜ referral. '
  'Follows NHM ASHA Module 6 & 7 protocols.';

CREATE TABLE triage_sessions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id          UUID         NOT NULL REFERENCES patients(id),
  asha_user_id        UUID         NOT NULL REFERENCES users(id),
  symptoms_original   TEXT         NOT NULL,
  symptoms_english    TEXT,
  language_code       VARCHAR(10),
  severity            VARCHAR(15)  NOT NULL
                        CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY')),
  likely_condition    TEXT,
  confidence          VARCHAR(10),
  immediate_actions   JSONB,
  red_flags           JSONB,
  refer_to            VARCHAR(100),
  refer_timeframe     VARCHAR(50),
  drug_first_aid      TEXT,
  asha_note           TEXT,
  follow_up_days      INT          DEFAULT 3,
  notify_health_dept  BOOLEAN      DEFAULT false,
  photo_url           TEXT,
  referral_id         VARCHAR(20)  UNIQUE,
  facility_id         UUID REFERENCES facilities(id),
  lat                 DOUBLE PRECISION,
  lng                 DOUBLE PRECISION,
  season              VARCHAR(20),
  synced              BOOLEAN      DEFAULT true,
  created_at          TIMESTAMPTZ  DEFAULT now()
);

-- ============================================================================
-- 5. ANALYTICS — Telemetry & usage events
-- ============================================================================
COMMENT ON TABLE analytics IS
  'Lightweight event store for usage analytics, feature telemetry, and audit trail.';

CREATE TABLE analytics (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID         NOT NULL REFERENCES users(id),
  event_type  VARCHAR(50)  NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ  DEFAULT now()
);


-- ============================================================================
-- INDEXES — Optimise frequently-queried columns
-- ============================================================================

-- Users
CREATE INDEX idx_users_state           ON users (state);
CREATE INDEX idx_users_district        ON users (district);
CREATE INDEX idx_users_role            ON users (role);

-- Patients
CREATE INDEX idx_patients_state        ON patients (state);
CREATE INDEX idx_patients_district     ON patients (district);
CREATE INDEX idx_patients_registered   ON patients (registered_by);

-- Triage Sessions
CREATE INDEX idx_triage_severity       ON triage_sessions (severity);
CREATE INDEX idx_triage_created        ON triage_sessions (created_at);
CREATE INDEX idx_triage_patient        ON triage_sessions (patient_id);
CREATE INDEX idx_triage_asha           ON triage_sessions (asha_user_id);
CREATE INDEX idx_triage_facility       ON triage_sessions (facility_id);
CREATE INDEX idx_triage_state_sev      ON triage_sessions (severity, created_at);

-- Facilities
CREATE INDEX idx_facilities_state      ON facilities (state);
CREATE INDEX idx_facilities_district   ON facilities (district);
CREATE INDEX idx_facilities_type       ON facilities (type);
CREATE INDEX idx_facilities_geo        ON facilities (lat, lng);

-- Analytics
CREATE INDEX idx_analytics_user        ON analytics (user_id);
CREATE INDEX idx_analytics_event       ON analytics (event_type);
CREATE INDEX idx_analytics_created     ON analytics (created_at);


-- ============================================================================
-- TRIGGER — Auto-update `updated_at` on row modification
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to every table that carries an updated_at column
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- ---- Users ----------------------------------------------------------------
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ASHA workers can read & update only their own row
CREATE POLICY users_select_own ON users
  FOR SELECT USING (
    auth.uid() = id
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (
    auth.uid() = id
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Admins can insert new users
CREATE POLICY users_insert_admin ON users
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Admins can delete users
CREATE POLICY users_delete_admin ON users
  FOR DELETE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ---- Patients -------------------------------------------------------------
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Workers see patients they registered; admins see all
CREATE POLICY patients_select ON patients
  FOR SELECT USING (
    registered_by = auth.uid()
    OR (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'supervisor')
  );

CREATE POLICY patients_insert ON patients
  FOR INSERT WITH CHECK (
    registered_by = auth.uid()
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY patients_update ON patients
  FOR UPDATE USING (
    registered_by = auth.uid()
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ---- Triage Sessions ------------------------------------------------------
ALTER TABLE triage_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY triage_select ON triage_sessions
  FOR SELECT USING (
    asha_user_id = auth.uid()
    OR (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'supervisor')
  );

CREATE POLICY triage_insert ON triage_sessions
  FOR INSERT WITH CHECK (
    asha_user_id = auth.uid()
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY triage_update ON triage_sessions
  FOR UPDATE USING (
    asha_user_id = auth.uid()
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ---- Facilities (public read, admin write) --------------------------------
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY facilities_select_all ON facilities
  FOR SELECT USING (true);

CREATE POLICY facilities_modify_admin ON facilities
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ---- Analytics -------------------------------------------------------------
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY analytics_select ON analytics
  FOR SELECT USING (
    user_id = auth.uid()
    OR (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'supervisor')
  );

CREATE POLICY analytics_insert ON analytics
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
