-- Trust Module Configuration Table
-- Stores organization-level settings for trust center, questionnaires, and SLAs

CREATE TABLE IF NOT EXISTS trust_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id VARCHAR(255) NOT NULL,
    
    -- SLA Configuration (in hours)
    sla_settings JSONB DEFAULT '{
        "urgent": {"targetHours": 24, "warningHours": 12},
        "high": {"targetHours": 72, "warningHours": 48},
        "medium": {"targetHours": 168, "warningHours": 120},
        "low": {"targetHours": 336, "warningHours": 240}
    }'::jsonb,
    
    -- Auto-assignment settings
    assignment_settings JSONB DEFAULT '{
        "enableAutoAssignment": false,
        "defaultAssignee": null,
        "assignByCategory": {}
    }'::jsonb,
    
    -- Knowledge Base settings
    kb_settings JSONB DEFAULT '{
        "requireApprovalForNewEntries": true,
        "autoSuggestFromKB": true,
        "trackUsageMetrics": true
    }'::jsonb,
    
    -- Trust Center settings
    trust_center_settings JSONB DEFAULT '{
        "enabled": true,
        "publicUrl": null,
        "customDomain": null,
        "allowAnonymousAccess": false
    }'::jsonb,
    
    -- AI settings (optional features)
    ai_settings JSONB DEFAULT '{
        "enabled": false,
        "autoCategorizationEnabled": false,
        "answerSuggestionsEnabled": false,
        "provider": null,
        "model": null
    }'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255),
    
    CONSTRAINT trust_configurations_org_unique UNIQUE (organization_id)
);

-- Create index for organization lookup
CREATE INDEX IF NOT EXISTS idx_trust_configurations_org ON trust_configurations(organization_id);

-- Add comment
COMMENT ON TABLE trust_configurations IS 'Organization-level configuration for the Trust module including SLAs, assignments, and AI settings';

