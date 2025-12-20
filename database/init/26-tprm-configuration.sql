-- TPRM Configuration Table
-- Stores organization-level TPRM settings including tier-to-frequency mappings

CREATE TABLE IF NOT EXISTS tprm_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Tier-to-Review-Frequency Mapping (JSON)
    -- Example: {"tier_1": "quarterly", "tier_2": "semi_annual", "tier_3": "annual", "tier_4": "biennial"}
    tier_frequency_mapping JSONB NOT NULL DEFAULT '{"tier_1":"quarterly","tier_2":"semi_annual","tier_3":"annual","tier_4":"biennial"}'::jsonb,
    
    -- Vendor Categories (JSON array)
    -- Example: [{"id": "cat-1", "name": "SaaS Provider", "description": "...", "color": "#3b82f6"}]
    vendor_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Risk Thresholds (JSON)
    -- Example: {"very_low": 20, "low": 40, "medium": 60, "high": 80, "critical": 100}
    risk_thresholds JSONB NOT NULL DEFAULT '{"very_low":20,"low":40,"medium":60,"high":80,"critical":100}'::jsonb,
    
    -- Assessment Settings (JSON)
    assessment_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Contract Settings (JSON)
    contract_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Audit Trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create index for organization lookup
CREATE INDEX IF NOT EXISTS idx_tprm_configurations_organization_id ON tprm_configurations(organization_id);

-- Add comment for documentation
COMMENT ON TABLE tprm_configurations IS 'Organization-level Third-Party Risk Management configuration settings';
COMMENT ON COLUMN tprm_configurations.tier_frequency_mapping IS 'Maps vendor tiers to review frequency (e.g., tier_1 -> quarterly)';
COMMENT ON COLUMN tprm_configurations.vendor_categories IS 'Custom vendor categories for the organization';
COMMENT ON COLUMN tprm_configurations.risk_thresholds IS 'Risk scoring thresholds for vendor risk levels';
COMMENT ON COLUMN tprm_configurations.assessment_settings IS 'Assessment workflow configuration';
COMMENT ON COLUMN tprm_configurations.contract_settings IS 'Contract management configuration';

