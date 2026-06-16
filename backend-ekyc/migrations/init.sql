-- ============================================================
-- eKYC Full Database Migration
-- Version: 001
-- Description: Initial schema for eKYC user + bank admin portal
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USERS (applicants)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile        VARCHAR(20) UNIQUE NOT NULL,
  email         VARCHAR(100) UNIQUE,
  is_verified   BOOLEAN DEFAULT FALSE,
  status        VARCHAR(20) DEFAULT 'active'
                CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. OTP VERIFICATION
-- ============================================================
CREATE TABLE IF NOT EXISTS otp_verification (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile        VARCHAR(20) NOT NULL,
  email         VARCHAR(255) NULL, 
  otp_code      VARCHAR(64) NOT NULL,
  attempts      INTEGER DEFAULT 0,       -- prevent brute force
  verified      BOOLEAN DEFAULT FALSE,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. USER SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash    VARCHAR(255) NOT NULL,
  ip_address    VARCHAR(45),
  user_agent    TEXT,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. BANK STAFF
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_staff (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL
                CHECK (role IN ('checker', 'maker', 'admin')),
  branch        VARCHAR(100),
  department    VARCHAR(100),
  is_active     BOOLEAN DEFAULT TRUE,
  last_login    TIMESTAMPTZ,
  created_by    UUID REFERENCES bank_staff(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. STAFF SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS staff_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id      UUID NOT NULL REFERENCES bank_staff(id) ON DELETE CASCADE,
  token_hash    VARCHAR(255) NOT NULL,
  ip_address    VARCHAR(45),
  user_agent    TEXT,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. APPLICATION CODE SEQUENCE
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS app_code_seq START 1000;

-- ============================================================
-- 7. APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_code      VARCHAR(25) UNIQUE NOT NULL DEFAULT
                  'KYC-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' ||
                  LPAD(nextval('app_code_seq')::TEXT, 6, '0'),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        VARCHAR(30) DEFAULT 'pending'
                CHECK (status IN (
                  'pending',
                  'under_review',
                  'checker_approved',
                  'checker_rejected',
                  'info_requested',
                  'resubmitted',
                  'approved',
                  'rejected'
                )),
  submitted_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. PERSONAL INFO (1 to 1 with application)
-- ============================================================
CREATE TABLE IF NOT EXISTS personal_info (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  date_of_birth   DATE NOT NULL,
  gender          VARCHAR(10)
                  CHECK (gender IN ('male', 'female', 'other')),
  nationality     VARCHAR(50),
  mobile          VARCHAR(20),
  email           VARCHAR(100),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. ADDRESS INFO (1 to 1 with application)
-- ============================================================
CREATE TABLE IF NOT EXISTS address_info (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  address_line1   VARCHAR(255) NOT NULL,
  address_line2   VARCHAR(255),
  area            VARCHAR(100),
  district        VARCHAR(100) NOT NULL,
  division        VARCHAR(100) NOT NULL,
  postal_code     VARCHAR(10),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. USER DOCUMENTS
--     (NID, passport, driving licence, selfie, proof of address)
--     versioned — old uploads kept, is_latest = FALSE
-- ============================================================
CREATE TABLE IF NOT EXISTS user_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  doc_type        VARCHAR(40) NOT NULL
                  CHECK (doc_type IN (
                    'nid_front',
                    'nid_back',
                    'passport_front',
                    'passport_back',
                    'driving_licence_front',
                    'driving_licence_back',
                    'proof_of_address',
                    'selfie'
                  )),
  file_url        VARCHAR(500) NOT NULL,
  file_name       VARCHAR(255),
  file_size       INTEGER,                -- bytes
  mime_type       VARCHAR(50),
  version         INTEGER DEFAULT 1,      -- increments on re-upload
  is_latest       BOOLEAN DEFAULT TRUE,   -- only latest = TRUE
  ocr_data        JSONB,                  -- extracted text from doc
  liveness_score  DECIMAL(5,2),          -- selfie only: confidence %
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. NOMINEES (1 application → many nominees)
-- ============================================================
CREATE TABLE IF NOT EXISTS nominees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  name            VARCHAR(150) NOT NULL,
  relationship    VARCHAR(50),
  nid_passport    VARCHAR(50),
  date_of_birth   DATE,
  share_percent   DECIMAL(5,2)
                  CHECK (share_percent > 0 AND share_percent <= 100),
  contact         VARCHAR(20),
  nid_skipped     BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. NOMINEE DOCUMENTS (1 nominee → many documents)
--     separate from user_documents — different owner, different fields
--     versioned — same as user_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS nominee_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nominee_id      UUID NOT NULL REFERENCES nominees(id) ON DELETE CASCADE,
  doc_type        VARCHAR(30) NOT NULL
                  CHECK (doc_type IN (
                    'nid_front',
                    'nid_back',
                    'passport_front',
                    'passport_back'
                  )),
  file_url        VARCHAR(500) NOT NULL,
  file_name       VARCHAR(255),
  file_size       INTEGER,
  mime_type       VARCHAR(50),
  version         INTEGER DEFAULT 1,
  is_latest       BOOLEAN DEFAULT TRUE,
  ocr_data        JSONB,
  uploaded_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. BO ACCOUNTS (1 to 1 with application)
-- ============================================================
CREATE TABLE IF NOT EXISTS bo_accounts (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id          UUID UNIQUE NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  account_type            VARCHAR(50),
  depository_participant  VARCHAR(100),
  bank_name               VARCHAR(100),
  settlement_account      VARCHAR(50),
  tin_number              VARCHAR(30),
  permission_cash         BOOLEAN DEFAULT TRUE,
  permission_margin       BOOLEAN DEFAULT TRUE,
  permission_foreign      BOOLEAN DEFAULT FALSE,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. AUDIT LOGS
--     tracks every action by user / staff / system
--     merged with kyc_workflow — one table for everything
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID REFERENCES applications(id) ON DELETE SET NULL,
  actor_id        UUID NOT NULL,
  actor_type      VARCHAR(20) NOT NULL
                  CHECK (actor_type IN ('user', 'staff', 'system')),
  actor_role      VARCHAR(20)
                  CHECK (actor_role IN (
                    'applicant',
                    'checker',
                    'maker',
                    'admin',
                    'system'
                  )),
  action          VARCHAR(50) NOT NULL
                  CHECK (action IN (
                    'submitted',
                    'opened',
                    'checker_approved',
                    'checker_rejected',
                    'info_requested',
                    'resubmitted',
                    'document_uploaded',
                    'maker_approved',
                    'maker_rejected'
                  )),
  note            TEXT,
  meta            JSONB,        -- extra info e.g. changed fields
  ip_address      VARCHAR(45),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  application_id  UUID REFERENCES applications(id) ON DELETE CASCADE,
  type            VARCHAR(20) NOT NULL
                  CHECK (type IN ('sms', 'email', 'in_app')),
  title           VARCHAR(150),
  message         TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  sent_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- users
CREATE INDEX IF NOT EXISTS idx_users_mobile
  ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_email
  ON users(email);

-- otp_verification
CREATE INDEX IF NOT EXISTS idx_otp_mobile
  ON otp_verification(mobile);
CREATE INDEX IF NOT EXISTS idx_otp_expires
  ON otp_verification(expires_at);

-- user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id
  ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires
  ON user_sessions(expires_at);

-- staff_sessions
CREATE INDEX IF NOT EXISTS idx_staff_sessions_staff_id
  ON staff_sessions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_expires
  ON staff_sessions(expires_at);

-- applications
CREATE INDEX IF NOT EXISTS idx_applications_user_id
  ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status
  ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_app_code
  ON applications(app_code);
CREATE INDEX IF NOT EXISTS idx_applications_submitted_at
  ON applications(submitted_at DESC);

-- user_documents
CREATE INDEX IF NOT EXISTS idx_user_docs_app_id
  ON user_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_user_docs_type
  ON user_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_user_docs_latest
  ON user_documents(application_id, doc_type)
  WHERE is_latest = TRUE;

-- nominees
CREATE INDEX IF NOT EXISTS idx_nominees_app_id
  ON nominees(application_id);

-- nominee_documents
CREATE INDEX IF NOT EXISTS idx_nominee_docs_nominee_id
  ON nominee_documents(nominee_id);
CREATE INDEX IF NOT EXISTS idx_nominee_docs_latest
  ON nominee_documents(nominee_id, doc_type)
  WHERE is_latest = TRUE;

-- audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_app_id
  ON audit_logs(application_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id
  ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON audit_logs(created_at DESC);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(user_id)
  WHERE is_read = FALSE;

-- ============================================================
-- AUTO UPDATE updated_at TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables that have updated_at
CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_bank_staff_updated_at
  BEFORE UPDATE ON bank_staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_personal_info_updated_at
  BEFORE UPDATE ON personal_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_address_info_updated_at
  BEFORE UPDATE ON address_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_nominees_updated_at
  BEFORE UPDATE ON nominees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER trg_bo_accounts_updated_at
  BEFORE UPDATE ON bo_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED: DEFAULT ADMIN STAFF
-- password: Admin@1234 (bcrypt hashed)
-- CHANGE THIS AFTER FIRST LOGIN
-- ============================================================
INSERT INTO bank_staff (
  name,
  email,
  password_hash,
  role,
  branch,
  department
) VALUES (
  'System Admin',
  'admin@bank.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.',
  'admin',
  'Head Office',
  'IT'
) ON CONFLICT (email) DO NOTHING;