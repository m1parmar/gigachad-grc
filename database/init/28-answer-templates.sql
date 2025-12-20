-- Answer Templates for Trust Module
-- Reusable answer templates for questionnaire responses

CREATE TABLE IF NOT EXISTS answer_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id VARCHAR(255) NOT NULL,
    
    -- Template Information
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100), -- security, privacy, compliance, legal, technical, general
    
    -- Variable placeholders (JSON array of variable names used in content)
    -- e.g., ["company_name", "date", "contact_email"]
    variables JSONB DEFAULT '[]'::jsonb,
    
    -- Tags for searchability
    tags VARCHAR(100)[] DEFAULT ARRAY[]::VARCHAR[],
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    status VARCHAR(50) DEFAULT 'active', -- active, archived
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by VARCHAR(255),
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by VARCHAR(255)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_answer_templates_org ON answer_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_answer_templates_category ON answer_templates(category);
CREATE INDEX IF NOT EXISTS idx_answer_templates_status ON answer_templates(status);
CREATE INDEX IF NOT EXISTS idx_answer_templates_tags ON answer_templates USING GIN(tags);

-- Add comment
COMMENT ON TABLE answer_templates IS 'Reusable answer templates for questionnaire responses with variable substitution support';

