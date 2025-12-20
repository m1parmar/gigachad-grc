-- Migration: Add soft delete support
-- This migration adds deletedAt and deletedBy columns to main entities
-- to enable soft delete functionality instead of permanent data deletion

-- Controls table
ALTER TABLE controls ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE controls ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Evidence table
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Policies table
ALTER TABLE policies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE policies ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Frameworks table
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE frameworks ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Integrations table
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Assets table
ALTER TABLE assets ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Risks table
ALTER TABLE risks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE risks ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Vendors table
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Questionnaire requests table
ALTER TABLE questionnaire_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE questionnaire_requests ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Knowledge base entries table
ALTER TABLE knowledge_base_entries ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE knowledge_base_entries ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Audits table
ALTER TABLE audits ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Audit requests table
ALTER TABLE audit_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE audit_requests ADD COLUMN IF NOT EXISTS deleted_by UUID;

-- Create indexes for efficient soft delete filtering
CREATE INDEX IF NOT EXISTS idx_controls_deleted_at ON controls(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_evidence_deleted_at ON evidence(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_policies_deleted_at ON policies(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_frameworks_deleted_at ON frameworks(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_integrations_deleted_at ON integrations(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assets_deleted_at ON assets(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_risks_deleted_at ON risks(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_deleted_at ON vendors(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_questionnaire_requests_deleted_at ON questionnaire_requests(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_knowledge_base_entries_deleted_at ON knowledge_base_entries(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audits_deleted_at ON audits(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_requests_deleted_at ON audit_requests(deleted_at) WHERE deleted_at IS NULL;


