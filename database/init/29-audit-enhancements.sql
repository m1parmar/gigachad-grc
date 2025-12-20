-- ===========================================
-- Audit Module Enhancements
-- Templates, Workpapers, Testing, Remediation, Analytics, Planning
-- ===========================================

-- Workpaper status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workpaper_status') THEN
        CREATE TYPE workpaper_status AS ENUM ('draft', 'pending_review', 'reviewed', 'approved', 'rejected');
    END IF;
END$$;

-- ===========================================
-- Audit Templates
-- ===========================================

CREATE TABLE IF NOT EXISTS audit_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id VARCHAR(255) NOT NULL,
    
    -- Template Details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    audit_type VARCHAR(100) NOT NULL, -- internal, external, surveillance, certification
    framework VARCHAR(100), -- SOC2, ISO27001, HIPAA, PCI-DSS
    
    -- Template Content
    checklist_items JSONB DEFAULT '[]'::jsonb, -- Array of checklist items
    request_templates JSONB DEFAULT '[]'::jsonb, -- Pre-defined request templates
    test_procedure_templates JSONB DEFAULT '[]'::jsonb, -- Test procedure templates
    
    -- Metadata
    is_system BOOLEAN DEFAULT FALSE, -- System-provided templates
    status VARCHAR(50) DEFAULT 'active',
    usage_count INT DEFAULT 0,
    
    -- Audit Trail
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_audit_template_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_templates_org ON audit_templates(organization_id);
CREATE INDEX idx_audit_templates_type ON audit_templates(audit_type);
CREATE INDEX idx_audit_templates_framework ON audit_templates(framework);

-- ===========================================
-- Audit Workpapers
-- ===========================================

CREATE TABLE IF NOT EXISTS audit_workpapers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    
    -- Workpaper Details
    workpaper_number VARCHAR(50) NOT NULL, -- e.g., "WP-001"
    title VARCHAR(255) NOT NULL,
    workpaper_type VARCHAR(100) DEFAULT 'general', -- general, planning, testing, conclusion, review
    content TEXT,
    
    -- Status & Workflow
    status workpaper_status DEFAULT 'draft',
    version INT DEFAULT 1,
    
    -- Preparation
    prepared_by VARCHAR(255) NOT NULL,
    prepared_at TIMESTAMP,
    
    -- Review Chain
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    
    -- Approval
    approved_by VARCHAR(255),
    approved_at TIMESTAMP,
    approval_notes TEXT,
    
    -- Attachments & Cross-references
    attachments JSONB DEFAULT '[]'::jsonb,
    cross_references JSONB DEFAULT '[]'::jsonb, -- Links to other workpapers
    related_controls JSONB DEFAULT '[]'::jsonb, -- Control IDs
    related_findings JSONB DEFAULT '[]'::jsonb, -- Finding IDs
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_workpaper_audit FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE,
    CONSTRAINT fk_workpaper_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_audit_workpapers_audit ON audit_workpapers(audit_id);
CREATE INDEX idx_audit_workpapers_org ON audit_workpapers(organization_id);
CREATE INDEX idx_audit_workpapers_status ON audit_workpapers(status);
CREATE UNIQUE INDEX idx_audit_workpapers_number ON audit_workpapers(audit_id, workpaper_number);

-- ===========================================
-- Workpaper Version History
-- ===========================================

CREATE TABLE IF NOT EXISTS workpaper_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workpaper_id UUID NOT NULL,
    
    -- Version Info
    version INT NOT NULL,
    content TEXT,
    
    -- Change Details
    changed_by VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_summary TEXT,
    
    CONSTRAINT fk_workpaper_history FOREIGN KEY (workpaper_id) REFERENCES audit_workpapers(id) ON DELETE CASCADE
);

CREATE INDEX idx_workpaper_history_workpaper ON workpaper_history(workpaper_id, version);

-- ===========================================
-- Remediation Plans (POA&M)
-- ===========================================

CREATE TABLE IF NOT EXISTS remediation_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID NOT NULL UNIQUE,
    organization_id VARCHAR(255) NOT NULL,
    
    -- Plan Details
    plan_number VARCHAR(50) NOT NULL, -- e.g., "POAM-001"
    description TEXT NOT NULL,
    
    -- Milestones
    milestones JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    status VARCHAR(50) DEFAULT 'open', -- open, in_progress, delayed, completed, cancelled
    priority VARCHAR(20) DEFAULT 'medium', -- critical, high, medium, low
    
    -- Timeline
    scheduled_start DATE,
    scheduled_end DATE,
    actual_start DATE,
    actual_end DATE,
    
    -- Resources
    resources JSONB DEFAULT '[]'::jsonb, -- Assigned resources
    estimated_hours INT,
    actual_hours INT,
    estimated_cost DECIMAL(12, 2),
    actual_cost DECIMAL(12, 2),
    
    -- Notes
    notes TEXT,
    risk_if_not_remediated TEXT,
    
    -- Audit Trail
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_remediation_plan_finding FOREIGN KEY (finding_id) REFERENCES audit_findings(id) ON DELETE CASCADE,
    CONSTRAINT fk_remediation_plan_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_remediation_plans_org ON remediation_plans(organization_id);
CREATE INDEX idx_remediation_plans_status ON remediation_plans(status);
CREATE INDEX idx_remediation_plans_priority ON remediation_plans(priority);

-- ===========================================
-- Remediation Milestones (Separate table for better tracking)
-- ===========================================

CREATE TABLE IF NOT EXISTS remediation_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL,
    
    -- Milestone Details
    milestone_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, delayed, blocked
    
    -- Timeline
    due_date DATE,
    completed_date DATE,
    
    -- Assignment
    assigned_to VARCHAR(255),
    
    -- Evidence
    evidence_required BOOLEAN DEFAULT FALSE,
    evidence_ids JSONB DEFAULT '[]'::jsonb,
    
    -- Notes
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_milestone_plan FOREIGN KEY (plan_id) REFERENCES remediation_plans(id) ON DELETE CASCADE
);

CREATE INDEX idx_remediation_milestones_plan ON remediation_milestones(plan_id);
CREATE INDEX idx_remediation_milestones_status ON remediation_milestones(status);

-- ===========================================
-- Test Procedures
-- ===========================================

CREATE TABLE IF NOT EXISTS audit_test_procedures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL,
    organization_id VARCHAR(255) NOT NULL,
    
    -- Procedure Details
    procedure_number VARCHAR(50) NOT NULL, -- e.g., "TP-001"
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    
    -- Control Link
    control_id UUID,
    requirement_ref VARCHAR(255),
    
    -- Test Type & Method
    test_type VARCHAR(100) NOT NULL, -- inquiry, observation, inspection, reperformance
    test_method VARCHAR(100), -- manual, automated, hybrid
    
    -- Sampling
    sample_size INT,
    sample_selection VARCHAR(100), -- random, judgmental, systematic, complete
    population_size INT,
    sample_criteria TEXT,
    
    -- Expected & Actual Results
    expected_result TEXT,
    actual_result TEXT,
    deviations_noted TEXT,
    
    -- Conclusion
    conclusion VARCHAR(50), -- effective, ineffective, partially_effective, not_applicable
    conclusion_rationale TEXT,
    
    -- Execution
    tested_by VARCHAR(255),
    tested_at TIMESTAMP,
    
    -- Review
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    
    -- Attachments
    attachments JSONB DEFAULT '[]'::jsonb,
    evidence_ids JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, reviewed
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_test_procedure_audit FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE,
    CONSTRAINT fk_test_procedure_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_test_procedures_audit ON audit_test_procedures(audit_id);
CREATE INDEX idx_test_procedures_org ON audit_test_procedures(organization_id);
CREATE INDEX idx_test_procedures_control ON audit_test_procedures(control_id);
CREATE INDEX idx_test_procedures_conclusion ON audit_test_procedures(conclusion);

-- ===========================================
-- Audit Plan Entries (Multi-year planning)
-- ===========================================

CREATE TABLE IF NOT EXISTS audit_plan_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id VARCHAR(255) NOT NULL,
    
    -- Planning Period
    year INT NOT NULL,
    quarter INT, -- 1, 2, 3, 4 or NULL for annual
    
    -- Audit Details
    audit_name VARCHAR(255) NOT NULL,
    audit_type VARCHAR(100) NOT NULL,
    framework VARCHAR(100),
    scope TEXT,
    objectives TEXT,
    
    -- Risk Assessment
    risk_rating VARCHAR(50), -- critical, high, medium, low
    risk_factors JSONB DEFAULT '[]'::jsonb,
    
    -- Resource Planning
    estimated_hours INT,
    estimated_budget DECIMAL(12, 2),
    assigned_team JSONB DEFAULT '[]'::jsonb, -- User IDs
    lead_auditor VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'planned', -- planned, scheduled, in_progress, completed, deferred, cancelled
    
    -- Linked Audit
    linked_audit_id UUID,
    
    -- Notes
    notes TEXT,
    deferral_reason TEXT,
    
    -- Timestamps
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_audit_plan_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_plan_linked_audit FOREIGN KEY (linked_audit_id) REFERENCES audits(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_plan_org ON audit_plan_entries(organization_id);
CREATE INDEX idx_audit_plan_year ON audit_plan_entries(year, quarter);
CREATE INDEX idx_audit_plan_status ON audit_plan_entries(status);
CREATE INDEX idx_audit_plan_risk ON audit_plan_entries(risk_rating);

-- ===========================================
-- Audit Analytics Snapshots (For historical trending)
-- ===========================================

CREATE TABLE IF NOT EXISTS audit_analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id VARCHAR(255) NOT NULL,
    
    -- Snapshot Period
    snapshot_date DATE NOT NULL,
    snapshot_type VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly
    
    -- Audit Metrics
    total_audits INT DEFAULT 0,
    active_audits INT DEFAULT 0,
    completed_audits INT DEFAULT 0,
    
    -- Finding Metrics
    total_findings INT DEFAULT 0,
    open_findings INT DEFAULT 0,
    critical_findings INT DEFAULT 0,
    high_findings INT DEFAULT 0,
    medium_findings INT DEFAULT 0,
    low_findings INT DEFAULT 0,
    overdue_findings INT DEFAULT 0,
    
    -- Remediation Metrics
    avg_remediation_days DECIMAL(8, 2),
    on_time_remediation_rate DECIMAL(5, 2), -- Percentage
    
    -- Testing Metrics
    tests_completed INT DEFAULT 0,
    tests_passed INT DEFAULT 0,
    tests_failed INT DEFAULT 0,
    control_effectiveness_rate DECIMAL(5, 2), -- Percentage
    
    -- Request Metrics
    total_requests INT DEFAULT 0,
    open_requests INT DEFAULT 0,
    overdue_requests INT DEFAULT 0,
    avg_request_completion_days DECIMAL(8, 2),
    
    -- Detailed Breakdown
    findings_by_category JSONB DEFAULT '{}'::jsonb,
    findings_by_status JSONB DEFAULT '{}'::jsonb,
    audits_by_type JSONB DEFAULT '{}'::jsonb,
    audits_by_status JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_analytics_snapshot_org FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_analytics_snapshots_org ON audit_analytics_snapshots(organization_id, snapshot_date);
CREATE UNIQUE INDEX idx_analytics_snapshots_unique ON audit_analytics_snapshots(organization_id, snapshot_date, snapshot_type);

-- ===========================================
-- Add recurring evidence request fields to audit_requests
-- ===========================================

ALTER TABLE audit_requests
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB, -- { frequency: 'monthly', dayOfMonth: 15 }
ADD COLUMN IF NOT EXISTS last_collected_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS next_collection_due TIMESTAMP,
ADD COLUMN IF NOT EXISTS evidence_validity_days INT;

-- ===========================================
-- Add checklist tracking to audits
-- ===========================================

ALTER TABLE audits
ADD COLUMN IF NOT EXISTS template_id UUID,
ADD COLUMN IF NOT EXISTS checklist_progress JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS checklist_completed_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS checklist_total_count INT DEFAULT 0;

-- Add foreign key for template
ALTER TABLE audits
ADD CONSTRAINT fk_audit_template FOREIGN KEY (template_id) REFERENCES audit_templates(id) ON DELETE SET NULL;

-- ===========================================
-- Insert default system audit templates
-- ===========================================

INSERT INTO audit_templates (id, organization_id, name, description, audit_type, framework, checklist_items, request_templates, is_system, created_by)
VALUES 
    (
        gen_random_uuid(),
        'system',
        'SOC 2 Type II Readiness',
        'Comprehensive SOC 2 Type II audit readiness checklist covering Trust Services Criteria',
        'external',
        'SOC2',
        '[
            {"id": "1", "section": "Security", "item": "Review access control policies", "required": true},
            {"id": "2", "section": "Security", "item": "Verify encryption standards", "required": true},
            {"id": "3", "section": "Security", "item": "Review incident response procedures", "required": true},
            {"id": "4", "section": "Availability", "item": "Review disaster recovery plan", "required": true},
            {"id": "5", "section": "Availability", "item": "Verify backup procedures", "required": true},
            {"id": "6", "section": "Processing Integrity", "item": "Review data validation controls", "required": true},
            {"id": "7", "section": "Confidentiality", "item": "Review data classification", "required": true},
            {"id": "8", "section": "Privacy", "item": "Review privacy notice", "required": false}
        ]'::jsonb,
        '[
            {"title": "Access Control Policy", "category": "policy", "description": "Current access control policy document"},
            {"title": "User Access Review Evidence", "category": "evidence", "description": "Evidence of quarterly user access reviews"},
            {"title": "Encryption Standards Documentation", "category": "policy", "description": "Documentation of encryption at rest and in transit"},
            {"title": "Incident Response Plan", "category": "policy", "description": "Incident response and escalation procedures"}
        ]'::jsonb,
        true,
        'system'
    ),
    (
        gen_random_uuid(),
        'system',
        'ISO 27001 Internal Audit',
        'Internal audit checklist aligned with ISO 27001 control domains',
        'internal',
        'ISO27001',
        '[
            {"id": "1", "section": "A.5", "item": "Information security policies review", "required": true},
            {"id": "2", "section": "A.6", "item": "Organization of information security", "required": true},
            {"id": "3", "section": "A.7", "item": "Human resource security", "required": true},
            {"id": "4", "section": "A.8", "item": "Asset management", "required": true},
            {"id": "5", "section": "A.9", "item": "Access control", "required": true},
            {"id": "6", "section": "A.10", "item": "Cryptography", "required": true},
            {"id": "7", "section": "A.11", "item": "Physical and environmental security", "required": true},
            {"id": "8", "section": "A.12", "item": "Operations security", "required": true},
            {"id": "9", "section": "A.13", "item": "Communications security", "required": true},
            {"id": "10", "section": "A.14", "item": "System acquisition, development and maintenance", "required": true}
        ]'::jsonb,
        '[
            {"title": "ISMS Policy", "category": "policy", "description": "Information Security Management System policy"},
            {"title": "Risk Assessment Report", "category": "evidence", "description": "Latest risk assessment results"},
            {"title": "Asset Inventory", "category": "evidence", "description": "Complete asset inventory list"}
        ]'::jsonb,
        true,
        'system'
    ),
    (
        gen_random_uuid(),
        'system',
        'HIPAA Security Rule Audit',
        'HIPAA Security Rule compliance audit template',
        'external',
        'HIPAA',
        '[
            {"id": "1", "section": "Administrative", "item": "Security management process", "required": true},
            {"id": "2", "section": "Administrative", "item": "Assigned security responsibility", "required": true},
            {"id": "3", "section": "Administrative", "item": "Workforce security", "required": true},
            {"id": "4", "section": "Administrative", "item": "Information access management", "required": true},
            {"id": "5", "section": "Administrative", "item": "Security awareness training", "required": true},
            {"id": "6", "section": "Physical", "item": "Facility access controls", "required": true},
            {"id": "7", "section": "Physical", "item": "Workstation use and security", "required": true},
            {"id": "8", "section": "Technical", "item": "Access control", "required": true},
            {"id": "9", "section": "Technical", "item": "Audit controls", "required": true},
            {"id": "10", "section": "Technical", "item": "Transmission security", "required": true}
        ]'::jsonb,
        '[
            {"title": "Risk Analysis Report", "category": "evidence", "description": "HIPAA risk analysis documentation"},
            {"title": "Security Policies and Procedures", "category": "policy", "description": "All HIPAA-related security policies"},
            {"title": "Training Records", "category": "evidence", "description": "Security awareness training completion records"},
            {"title": "BAA Agreements", "category": "contract", "description": "Business Associate Agreements"}
        ]'::jsonb,
        true,
        'system'
    ),
    (
        gen_random_uuid(),
        'system',
        'PCI-DSS Audit',
        'PCI Data Security Standard compliance audit template',
        'external',
        'PCI-DSS',
        '[
            {"id": "1", "section": "Requirement 1", "item": "Install and maintain network security controls", "required": true},
            {"id": "2", "section": "Requirement 2", "item": "Apply secure configurations", "required": true},
            {"id": "3", "section": "Requirement 3", "item": "Protect stored account data", "required": true},
            {"id": "4", "section": "Requirement 4", "item": "Protect cardholder data with cryptography during transmission", "required": true},
            {"id": "5", "section": "Requirement 5", "item": "Protect all systems against malware", "required": true},
            {"id": "6", "section": "Requirement 6", "item": "Develop and maintain secure systems", "required": true},
            {"id": "7", "section": "Requirement 7", "item": "Restrict access by business need-to-know", "required": true},
            {"id": "8", "section": "Requirement 8", "item": "Identify users and authenticate access", "required": true},
            {"id": "9", "section": "Requirement 9", "item": "Restrict physical access to cardholder data", "required": true},
            {"id": "10", "section": "Requirement 10", "item": "Log and monitor all access", "required": true},
            {"id": "11", "section": "Requirement 11", "item": "Test security of systems and networks regularly", "required": true},
            {"id": "12", "section": "Requirement 12", "item": "Support information security with organizational policies", "required": true}
        ]'::jsonb,
        '[
            {"title": "Network Diagram", "category": "evidence", "description": "Current network architecture diagram"},
            {"title": "Firewall Configuration", "category": "evidence", "description": "Firewall rules and configuration"},
            {"title": "Vulnerability Scan Results", "category": "evidence", "description": "Latest vulnerability scan reports"},
            {"title": "Penetration Test Report", "category": "evidence", "description": "Most recent penetration test results"}
        ]'::jsonb,
        true,
        'system'
    )
ON CONFLICT DO NOTHING;

COMMENT ON TABLE audit_templates IS 'Reusable audit templates with checklists and request templates';
COMMENT ON TABLE audit_workpapers IS 'Formal audit documentation with version control and review workflow';
COMMENT ON TABLE workpaper_history IS 'Version history for audit workpapers';
COMMENT ON TABLE remediation_plans IS 'POA&M (Plan of Action and Milestones) for audit findings';
COMMENT ON TABLE remediation_milestones IS 'Individual milestones within remediation plans';
COMMENT ON TABLE audit_test_procedures IS 'Detailed test procedures with sampling and conclusion tracking';
COMMENT ON TABLE audit_plan_entries IS 'Multi-year audit planning entries';
COMMENT ON TABLE audit_analytics_snapshots IS 'Historical snapshots for audit trend analysis';

