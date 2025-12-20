-- Config as Code State Tracking
-- Tracks the last-applied state of resources for drift and conflict detection

-- Table to track individual resource states
CREATE TABLE IF NOT EXISTS config_resource_states (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Resource identification
    resource_type VARCHAR(50) NOT NULL,  -- 'control', 'framework', 'policy', 'risk', 'vendor'
    resource_id VARCHAR(255) NOT NULL,   -- The business identifier (control_id, name, title, etc.)
    database_id TEXT,                     -- The actual database UUID of the resource
    
    -- State tracking
    last_applied_hash VARCHAR(64) NOT NULL,  -- SHA-256 hash of the applied content
    last_applied_content JSONB NOT NULL,      -- The actual content that was applied
    last_applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_by TEXT NOT NULL,
    
    -- Source tracking
    source_file VARCHAR(500),             -- Which TF file this came from
    source_line INTEGER,                  -- Line number in the file
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure unique resource per org/workspace
    CONSTRAINT unique_resource_state UNIQUE (organization_id, workspace_id, resource_type, resource_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_config_resource_states_org 
    ON config_resource_states(organization_id);
CREATE INDEX IF NOT EXISTS idx_config_resource_states_resource 
    ON config_resource_states(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_config_resource_states_db_id 
    ON config_resource_states(database_id);

-- Table to track apply operations (like TF state versions)
CREATE TABLE IF NOT EXISTS config_apply_history (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    
    -- Apply operation details
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    applied_by TEXT NOT NULL,
    source_file VARCHAR(500),
    commit_message TEXT,
    
    -- Results
    resources_created INTEGER NOT NULL DEFAULT 0,
    resources_updated INTEGER NOT NULL DEFAULT 0,
    resources_deleted INTEGER NOT NULL DEFAULT 0,
    resources_skipped INTEGER NOT NULL DEFAULT 0,
    conflicts_detected INTEGER NOT NULL DEFAULT 0,
    conflicts_resolved VARCHAR(50),  -- 'force', 'skip', 'abort'
    
    -- State snapshot
    resource_count INTEGER NOT NULL DEFAULT 0,
    state_hash VARCHAR(64),  -- Hash of all resource states at this point
    
    -- Metadata
    duration_ms INTEGER,
    error_count INTEGER NOT NULL DEFAULT 0,
    errors JSONB,
    warnings JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_config_apply_history_org 
    ON config_apply_history(organization_id, applied_at DESC);

-- Table for tracking locks (prevent concurrent applies)
CREATE TABLE IF NOT EXISTS config_apply_locks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    
    locked_by TEXT NOT NULL,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lock_reason VARCHAR(255),
    expires_at TIMESTAMPTZ NOT NULL,  -- Auto-expire locks after timeout
    
    -- Unique lock per org/workspace
    CONSTRAINT unique_apply_lock UNIQUE (organization_id, workspace_id)
);

-- Function to automatically clean expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_config_locks()
RETURNS void AS $$
BEGIN
    DELETE FROM config_apply_locks WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_config_state_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS config_resource_states_updated_at ON config_resource_states;
CREATE TRIGGER config_resource_states_updated_at
    BEFORE UPDATE ON config_resource_states
    FOR EACH ROW
    EXECUTE FUNCTION update_config_state_timestamp();

COMMENT ON TABLE config_resource_states IS 'Tracks the last-applied state of each resource from Config as Code';
COMMENT ON TABLE config_apply_history IS 'History of all Config as Code apply operations';
COMMENT ON TABLE config_apply_locks IS 'Prevents concurrent apply operations';
