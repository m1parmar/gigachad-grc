-- Migration: Add Junction Tables for Array Relationships
-- This migration creates proper junction tables to replace String[] arrays

-- ===========================================
-- Tag System Tables
-- ===========================================

-- Centralized tag registry
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7), -- Hex color
    description TEXT,
    entity_type VARCHAR(50) NOT NULL, -- control, evidence, policy, risk, vendor
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, name, entity_type)
);

CREATE INDEX IF NOT EXISTS idx_tags_org_type ON tags(organization_id, entity_type);

-- Control-Tag junction
CREATE TABLE IF NOT EXISTS control_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    control_id UUID NOT NULL REFERENCES controls(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(control_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_control_tags_tag ON control_tags(tag_id);

-- Evidence-Tag junction
CREATE TABLE IF NOT EXISTS evidence_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evidence_id UUID NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(evidence_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_tags_tag ON evidence_tags(tag_id);

-- Policy-Tag junction
CREATE TABLE IF NOT EXISTS policy_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id UUID NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(policy_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_policy_tags_tag ON policy_tags(tag_id);

-- Risk-Tag junction
CREATE TABLE IF NOT EXISTS risk_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(risk_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_risk_tags_tag ON risk_tags(tag_id);

-- Vendor-Tag junction
CREATE TABLE IF NOT EXISTS vendor_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vendor_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_tags_tag ON vendor_tags(tag_id);

-- ===========================================
-- Vendor Certifications Table
-- ===========================================

CREATE TABLE IF NOT EXISTS vendor_certifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    certification VARCHAR(255) NOT NULL,
    issue_date DATE,
    expiration_date DATE,
    verification_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vendor_id, certification)
);

-- ===========================================
-- Audit Meeting Attendees Tables
-- ===========================================

-- Internal attendees (employees)
CREATE TABLE IF NOT EXISTS audit_meeting_internal_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES audit_meetings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role VARCHAR(50), -- lead, participant, observer
    attended BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(meeting_id, user_id)
);

-- External attendees (auditors, clients)
CREATE TABLE IF NOT EXISTS audit_meeting_external_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES audit_meetings(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    organization VARCHAR(255),
    role VARCHAR(50), -- auditor, client, consultant
    attended BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_external_attendees_meeting ON audit_meeting_external_attendees(meeting_id);

-- Meeting attachments
CREATE TABLE IF NOT EXISTS audit_meeting_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID NOT NULL REFERENCES audit_meetings(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    size INTEGER NOT NULL,
    uploaded_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_meeting_attachments_meeting ON audit_meeting_attachments(meeting_id);

-- ===========================================
-- API Key Scopes Table
-- ===========================================

CREATE TABLE IF NOT EXISTS api_key_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    scope VARCHAR(100) NOT NULL, -- read:controls, write:evidence, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(api_key_id, scope)
);

-- ===========================================
-- Vendor Assessment Conditions Table
-- ===========================================

CREATE TABLE IF NOT EXISTS vendor_assessment_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES vendor_assessments(id) ON DELETE CASCADE,
    condition TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    status VARCHAR(20) DEFAULT 'pending', -- pending, acknowledged, resolved
    due_date DATE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_assessment_conditions_assessment ON vendor_assessment_conditions(assessment_id);

-- ===========================================
-- Vendor Access Data Categories Table
-- ===========================================

CREATE TABLE IF NOT EXISTS vendor_access_data_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_review_id UUID NOT NULL REFERENCES vendor_access_reviews(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- PII, PHI, financial, credentials, etc.
    description TEXT,
    sensitivity VARCHAR(50), -- public, internal, confidential, restricted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(access_review_id, category)
);

-- ===========================================
-- Data Migration Helpers
-- ===========================================

-- Example: Migrate tags from String[] to junction tables
-- Run this after the base migration to migrate existing data

-- Migrate control tags
-- INSERT INTO control_tags (control_id, tag_id, created_at)
-- SELECT c.id, t.id, NOW()
-- FROM controls c
-- CROSS JOIN LATERAL unnest(c.tags) AS tag_name
-- JOIN tags t ON t.name = tag_name AND t.entity_type = 'control' AND t.organization_id = c.organization_id
-- ON CONFLICT DO NOTHING;

-- Similar migrations would be needed for evidence_tags, policy_tags, risk_tags, vendor_tags

-- Migrate vendor certifications from String[] to junction table
-- INSERT INTO vendor_certifications (vendor_id, certification, created_at)
-- SELECT v.id, cert, NOW()
-- FROM vendors v
-- CROSS JOIN LATERAL unnest(v.certifications) AS cert
-- ON CONFLICT DO NOTHING;






