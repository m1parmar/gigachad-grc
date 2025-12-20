-- Migration: Add database ENUMs
-- This migration creates PostgreSQL ENUM types for better data integrity
-- Note: Existing String columns will need to be migrated separately

-- Control Category ENUM
DO $$ BEGIN
  CREATE TYPE control_category AS ENUM (
    'access_control',
    'data_protection',
    'network_security',
    'incident_management',
    'business_continuity',
    'risk_management',
    'change_management',
    'asset_management',
    'compliance',
    'physical_security',
    'hr_security',
    'supplier_management',
    'cryptography',
    'operations',
    'communications',
    'system_acquisition',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Evidence Type ENUM
DO $$ BEGIN
  CREATE TYPE evidence_type AS ENUM (
    'screenshot',
    'document',
    'export',
    'report',
    'configuration',
    'log',
    'policy',
    'procedure',
    'certificate',
    'audit_report',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Evidence Source ENUM
DO $$ BEGIN
  CREATE TYPE evidence_source AS ENUM (
    'manual',
    'aws',
    'azure',
    'gcp',
    'github',
    'gitlab',
    'okta',
    'jira',
    'confluence',
    'slack',
    'google_workspace',
    'microsoft_365',
    'crowdstrike',
    'qualys',
    'tenable',
    'splunk',
    'datadog',
    'custom_api',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Framework Type ENUM
DO $$ BEGIN
  CREATE TYPE framework_type AS ENUM (
    'soc2',
    'iso27001',
    'iso27701',
    'hipaa',
    'gdpr',
    'pci_dss',
    'nist_csf',
    'nist_800_53',
    'cis',
    'fedramp',
    'cmmc',
    'ccpa',
    'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Integration Type ENUM
DO $$ BEGIN
  CREATE TYPE integration_type AS ENUM (
    'aws',
    'azure',
    'gcp',
    'github',
    'gitlab',
    'okta',
    'jira',
    'confluence',
    'slack',
    'google_workspace',
    'microsoft_365',
    'crowdstrike',
    'qualys',
    'tenable',
    'splunk',
    'datadog',
    'servicenow',
    'jamf',
    'intune',
    'custom'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Review Frequency ENUM
DO $$ BEGIN
  CREATE TYPE review_frequency AS ENUM (
    'monthly',
    'quarterly',
    'semi_annual',
    'annual',
    'biennial'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Testing Frequency ENUM
DO $$ BEGIN
  CREATE TYPE testing_frequency AS ENUM (
    'weekly',
    'monthly',
    'quarterly',
    'semi_annual',
    'annual'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Sync Frequency ENUM
DO $$ BEGIN
  CREATE TYPE sync_frequency AS ENUM (
    'realtime',
    'hourly',
    'daily',
    'weekly',
    'monthly'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Mapping Type ENUM
DO $$ BEGIN
  CREATE TYPE mapping_type AS ENUM (
    'primary',
    'supporting',
    'partial'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Policy Category ENUM
DO $$ BEGIN
  CREATE TYPE policy_category AS ENUM (
    'information_security',
    'data_privacy',
    'acceptable_use',
    'access_control',
    'business_continuity',
    'incident_response',
    'vendor_management',
    'change_management',
    'asset_management',
    'hr_security',
    'physical_security',
    'compliance',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Risk Category ENUM
DO $$ BEGIN
  CREATE TYPE risk_category AS ENUM (
    'operational',
    'strategic',
    'compliance',
    'security',
    'financial',
    'technical',
    'third_party',
    'reputational',
    'legal',
    'environmental'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Risk Source ENUM
DO $$ BEGIN
  CREATE TYPE risk_source AS ENUM (
    'internal_security_reviews',
    'ad_hoc_discovery',
    'external_security_reviews',
    'incident_response',
    'policy_exception',
    'employee_reporting',
    'vendor_assessment',
    'compliance_audit'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Gap Remediation Status ENUM
DO $$ BEGIN
  CREATE TYPE gap_remediation_status AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'deferred',
    'accepted'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =========================================
-- Column Conversion Examples (run manually)
-- =========================================

-- Example: Convert controls.category from VARCHAR to ENUM
-- ALTER TABLE controls 
--   ALTER COLUMN category TYPE control_category 
--   USING category::control_category;

-- Example: Convert evidence.type from VARCHAR to ENUM
-- ALTER TABLE evidence 
--   ALTER COLUMN type TYPE evidence_type 
--   USING type::evidence_type;

-- Example: Convert evidence.source from VARCHAR to ENUM  
-- ALTER TABLE evidence 
--   ALTER COLUMN source TYPE evidence_source 
--   USING source::evidence_source;

-- Example: Convert frameworks.type from VARCHAR to ENUM
-- ALTER TABLE frameworks 
--   ALTER COLUMN type TYPE framework_type 
--   USING type::framework_type;

-- Example: Convert integrations.type from VARCHAR to ENUM
-- ALTER TABLE integrations 
--   ALTER COLUMN type TYPE integration_type 
--   USING type::integration_type;

-- Note: Before running column conversions, ensure all existing data
-- matches one of the enum values. Use queries like:
-- SELECT DISTINCT category FROM controls;
-- to verify data compatibility.






