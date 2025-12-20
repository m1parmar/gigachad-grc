-- Notification Configuration Table
-- Stores per-organization email and Slack notification settings

CREATE TABLE IF NOT EXISTS notification_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Email Provider Configuration
    email_provider VARCHAR(50) NOT NULL DEFAULT 'disabled',  -- disabled, smtp, sendgrid, ses
    email_from_address VARCHAR(255),
    email_from_name VARCHAR(255),
    
    -- SMTP Settings (encrypted JSON)
    smtp_config JSONB,
    -- Structure: { host, port, user, password, secure }
    
    -- SendGrid Settings
    sendgrid_api_key TEXT,  -- encrypted
    
    -- AWS SES Settings (encrypted JSON)
    ses_config JSONB,
    -- Structure: { region, accessKeyId, secretAccessKey }
    
    -- Slack Notification Configuration
    slack_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    slack_webhook_url TEXT,  -- encrypted
    slack_bot_token TEXT,    -- encrypted
    slack_default_channel VARCHAR(255),
    slack_workspace_name VARCHAR(255),
    
    -- Default Notification Settings per type
    default_notifications JSONB NOT NULL DEFAULT '{}',
    -- Structure: { complianceDrift: { email: true, slack: true }, ... }
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Index for organization lookup
CREATE INDEX IF NOT EXISTS idx_notification_configuration_org 
    ON notification_configuration(organization_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_notification_configuration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notification_configuration_updated_at ON notification_configuration;
CREATE TRIGGER notification_configuration_updated_at
    BEFORE UPDATE ON notification_configuration
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_configuration_updated_at();

-- Add comment describing the table
COMMENT ON TABLE notification_configuration IS 'Per-organization notification configuration for email and Slack';
COMMENT ON COLUMN notification_configuration.email_provider IS 'Email provider: disabled, smtp, sendgrid, or ses';
COMMENT ON COLUMN notification_configuration.smtp_config IS 'Encrypted SMTP settings JSON: { host, port, user, password, secure }';
COMMENT ON COLUMN notification_configuration.ses_config IS 'Encrypted AWS SES settings JSON: { region, accessKeyId, secretAccessKey }';
COMMENT ON COLUMN notification_configuration.slack_webhook_url IS 'Slack incoming webhook URL for notifications';
COMMENT ON COLUMN notification_configuration.slack_bot_token IS 'Slack bot token (xoxb-...) for sending messages';
COMMENT ON COLUMN notification_configuration.default_notifications IS 'Default notification preferences by type: { type: { email: bool, slack: bool, inApp: bool } }';




