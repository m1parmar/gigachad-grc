-- Employee Compliance Tracking Tables
-- Aggregates employee data from integrations (HRIS, LMS, MDM, Identity Providers)

-- Correlated Employee - aggregated from HRIS integrations
CREATE TABLE IF NOT EXISTS correlated_employees (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    
    -- Cached from HRIS source integration
    source_integration_id TEXT REFERENCES integrations(id) ON DELETE SET NULL,
    external_id VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    department VARCHAR(255),
    job_title VARCHAR(255),
    manager_email VARCHAR(255),
    hire_date TIMESTAMP,
    employment_status VARCHAR(50), -- active, terminated, on_leave, pending
    employment_type VARCHAR(50),   -- full_time, part_time, contractor, intern
    location VARCHAR(255),
    
    -- Aggregated compliance scoring
    compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
    compliance_issues JSONB,
    last_correlated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(organization_id, email)
);

-- Indexes for correlated_employees
CREATE INDEX IF NOT EXISTS idx_correlated_employees_org ON correlated_employees(organization_id);
CREATE INDEX IF NOT EXISTS idx_correlated_employees_status ON correlated_employees(employment_status);
CREATE INDEX IF NOT EXISTS idx_correlated_employees_dept ON correlated_employees(department);
CREATE INDEX IF NOT EXISTS idx_correlated_employees_email ON correlated_employees(email);

-- Background Check records from any provider (Certn, Checkr, etc.)
CREATE TABLE IF NOT EXISTS employee_background_checks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    correlated_employee_id TEXT NOT NULL REFERENCES correlated_employees(id) ON DELETE CASCADE,
    integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    
    -- Check details
    status VARCHAR(50) NOT NULL, -- pending, in_progress, clear, flagged, expired
    check_type VARCHAR(100),     -- criminal, employment, education, credit
    initiated_at TIMESTAMP,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- Raw data from provider
    raw_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(correlated_employee_id, integration_id, external_id)
);

-- Indexes for employee_background_checks
CREATE INDEX IF NOT EXISTS idx_emp_bg_checks_employee ON employee_background_checks(correlated_employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_bg_checks_status ON employee_background_checks(status);
CREATE INDEX IF NOT EXISTS idx_emp_bg_checks_expires ON employee_background_checks(expires_at);

-- Training records from any LMS (KnowBe4, Proofpoint, etc.)
CREATE TABLE IF NOT EXISTS employee_training_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    correlated_employee_id TEXT NOT NULL REFERENCES correlated_employees(id) ON DELETE CASCADE,
    integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    external_id VARCHAR(255),
    
    -- Training details
    course_name VARCHAR(500) NOT NULL,
    course_type VARCHAR(100),   -- required, optional, remediation
    status VARCHAR(50) NOT NULL, -- assigned, in_progress, completed, overdue, waived
    assigned_at TIMESTAMP,
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    score INTEGER CHECK (score >= 0 AND score <= 100),
    
    -- Raw data from LMS
    raw_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for employee_training_records
CREATE INDEX IF NOT EXISTS idx_emp_training_employee ON employee_training_records(correlated_employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_training_status ON employee_training_records(status);
CREATE INDEX IF NOT EXISTS idx_emp_training_due ON employee_training_records(due_date);

-- Asset assignments from any MDM (Jamf, Intune, etc.)
CREATE TABLE IF NOT EXISTS employee_asset_assignments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    correlated_employee_id TEXT NOT NULL REFERENCES correlated_employees(id) ON DELETE CASCADE,
    integration_id TEXT NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
    asset_id TEXT REFERENCES assets(id) ON DELETE SET NULL,
    external_asset_id VARCHAR(255) NOT NULL,
    
    -- Device details
    device_type VARCHAR(50) NOT NULL, -- laptop, phone, tablet, desktop
    device_name VARCHAR(255),
    serial_number VARCHAR(255),
    model VARCHAR(255),
    manufacturer VARCHAR(255),
    os_version VARCHAR(100),
    is_compliant BOOLEAN,
    last_check_in TIMESTAMP,
    assigned_at TIMESTAMP,
    
    -- Raw data from MDM
    raw_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(correlated_employee_id, integration_id, external_asset_id)
);

-- Indexes for employee_asset_assignments
CREATE INDEX IF NOT EXISTS idx_emp_assets_employee ON employee_asset_assignments(correlated_employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_assets_serial ON employee_asset_assignments(serial_number);
CREATE INDEX IF NOT EXISTS idx_emp_assets_compliant ON employee_asset_assignments(is_compliant);

-- Access records from any identity provider (Okta, Azure AD, etc.)
CREATE TABLE IF NOT EXISTS employee_access_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    correlated_employee_id TEXT NOT NULL REFERENCES correlated_employees(id) ON DELETE CASCADE,
    integration_id TEXT REFERENCES integrations(id) ON DELETE SET NULL,
    
    -- Access details
    systems_access JSONB NOT NULL, -- Array of apps/systems
    last_review_date TIMESTAMP,
    review_status VARCHAR(50),     -- pending, approved, action_required
    reviewed_by VARCHAR(255),
    mfa_enabled BOOLEAN,
    
    -- Raw data from identity provider
    raw_data JSONB,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for employee_access_records
CREATE INDEX IF NOT EXISTS idx_emp_access_employee ON employee_access_records(correlated_employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_access_review ON employee_access_records(review_status);

-- Security awareness scores (aggregated from LMS phishing tests, training)
CREATE TABLE IF NOT EXISTS employee_security_scores (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    correlated_employee_id TEXT NOT NULL REFERENCES correlated_employees(id) ON DELETE CASCADE,
    integration_id TEXT REFERENCES integrations(id) ON DELETE SET NULL,
    
    -- Score details
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    risk_level VARCHAR(20),         -- low, medium, high
    training_score INTEGER CHECK (training_score >= 0 AND training_score <= 100),
    phishing_score INTEGER CHECK (phishing_score >= 0 AND phishing_score <= 100),
    
    -- Phishing test details
    phishing_tests_sent INTEGER,
    phishing_tests_clicked INTEGER,
    phishing_tests_reported INTEGER,
    
    -- Raw data
    raw_data JSONB,
    
    -- Timestamps
    score_period VARCHAR(50),       -- Q1-2025, Jan-2025, etc.
    last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes for employee_security_scores
CREATE INDEX IF NOT EXISTS idx_emp_security_employee ON employee_security_scores(correlated_employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_security_risk ON employee_security_scores(risk_level);

-- Policy attestations (internal feature - employees acknowledge policies)
CREATE TABLE IF NOT EXISTS employee_attestations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    correlated_employee_id TEXT NOT NULL REFERENCES correlated_employees(id) ON DELETE CASCADE,
    policy_id TEXT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    
    -- Attestation details
    status VARCHAR(50) NOT NULL,    -- pending, acknowledged, declined, expired
    requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMP,
    expires_at TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    
    UNIQUE(correlated_employee_id, policy_id)
);

-- Indexes for employee_attestations
CREATE INDEX IF NOT EXISTS idx_emp_attestations_employee ON employee_attestations(correlated_employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_attestations_policy ON employee_attestations(policy_id);
CREATE INDEX IF NOT EXISTS idx_emp_attestations_status ON employee_attestations(status);

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_employee_compliance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all employee compliance tables
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'correlated_employees',
            'employee_background_checks',
            'employee_training_records',
            'employee_asset_assignments',
            'employee_access_records',
            'employee_attestations'
        ])
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS %I_updated_at ON %I;
            CREATE TRIGGER %I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_employee_compliance_timestamp();
        ', tbl, tbl, tbl, tbl);
    END LOOP;
END;
$$;
