-- ============================================================================
-- Full-Text Search Indexes for GigaChad GRC
-- ============================================================================
-- These GIN indexes enable fast full-text search across high-volume tables.
-- Uses PostgreSQL's built-in tsvector for weighted, language-aware search.
-- ============================================================================

-- ============================================================================
-- Risk Table Full-Text Search
-- ============================================================================

-- Add generated tsvector column for risks
ALTER TABLE risk ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(risk_id, '')), 'A')
  ) STORED;

-- GIN index for fast full-text search on risks
CREATE INDEX IF NOT EXISTS idx_risk_search_vector 
  ON risk USING GIN (search_vector);

-- Composite index for common filter + search patterns
CREATE INDEX IF NOT EXISTS idx_risk_org_status_search 
  ON risk (organization_id, status) 
  WHERE deleted_at IS NULL;

-- ============================================================================
-- Control Table Full-Text Search
-- ============================================================================

-- Add generated tsvector column for controls
ALTER TABLE control ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(control_id, '')), 'A')
  ) STORED;

-- GIN index for fast full-text search on controls
CREATE INDEX IF NOT EXISTS idx_control_search_vector 
  ON control USING GIN (search_vector);

-- ============================================================================
-- Evidence Table Full-Text Search
-- ============================================================================

-- Add generated tsvector column for evidence
ALTER TABLE evidence ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(file_name, '')), 'B')
  ) STORED;

-- GIN index for fast full-text search on evidence
CREATE INDEX IF NOT EXISTS idx_evidence_search_vector 
  ON evidence USING GIN (search_vector);

-- Composite index for common filter + search patterns
CREATE INDEX IF NOT EXISTS idx_evidence_org_status_search 
  ON evidence (organization_id, status) 
  WHERE deleted_at IS NULL;

-- ============================================================================
-- Policy Table Full-Text Search
-- ============================================================================

-- Add generated tsvector column for policies
ALTER TABLE policy ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(policy_id, '')), 'A')
  ) STORED;

-- GIN index for fast full-text search on policies
CREATE INDEX IF NOT EXISTS idx_policy_search_vector 
  ON policy USING GIN (search_vector);

-- ============================================================================
-- Audit Log Table Indexes (high volume)
-- ============================================================================

-- GIN index for JSONB metadata searches
CREATE INDEX IF NOT EXISTS idx_audit_log_metadata 
  ON audit_log USING GIN (metadata jsonb_path_ops);

-- Composite index for common audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_log_org_timestamp 
  ON audit_log (organization_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type 
  ON audit_log (organization_id, entity_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_user 
  ON audit_log (organization_id, user_id, timestamp DESC);

-- ============================================================================
-- User Table Full-Text Search
-- ============================================================================

-- Add generated tsvector column for users
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(email, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(first_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(last_name, '')), 'B')
  ) STORED;

-- GIN index for fast full-text search on users
CREATE INDEX IF NOT EXISTS idx_user_search_vector 
  ON "user" USING GIN (search_vector);

-- ============================================================================
-- Vendor Table Full-Text Search (if exists)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor') THEN
    -- Add search vector column
    ALTER TABLE vendor ADD COLUMN IF NOT EXISTS search_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(category, '')), 'C')
      ) STORED;
    
    -- Create index
    CREATE INDEX IF NOT EXISTS idx_vendor_search_vector 
      ON vendor USING GIN (search_vector);
  END IF;
END $$;

-- ============================================================================
-- Asset Table Full-Text Search (if exists)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'asset') THEN
    -- Add search vector column
    ALTER TABLE asset ADD COLUMN IF NOT EXISTS search_vector tsvector
      GENERATED ALWAYS AS (
        setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
        setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
        setweight(to_tsvector('english', coalesce(asset_type, '')), 'C')
      ) STORED;
    
    -- Create index
    CREATE INDEX IF NOT EXISTS idx_asset_search_vector 
      ON asset USING GIN (search_vector);
  END IF;
END $$;

-- ============================================================================
-- Helper Function for Full-Text Search Queries
-- ============================================================================

-- Function to convert user search input to tsquery
CREATE OR REPLACE FUNCTION to_search_query(search_text text)
RETURNS tsquery AS $$
BEGIN
  -- Handle empty input
  IF search_text IS NULL OR trim(search_text) = '' THEN
    RETURN NULL;
  END IF;
  
  -- Convert to websearch format (handles phrases, operators, etc.)
  RETURN websearch_to_tsquery('english', search_text);
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback to plainto_tsquery if websearch fails
    RETURN plainto_tsquery('english', search_text);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- Statistics and Maintenance
-- ============================================================================

-- Analyze tables to update statistics for query planner
ANALYZE risk;
ANALYZE control;
ANALYZE evidence;
ANALYZE policy;
ANALYZE audit_log;
ANALYZE "user";

-- ============================================================================
-- Usage Examples (for documentation)
-- ============================================================================
/*

-- Search risks using full-text search:
SELECT id, title, description, ts_rank(search_vector, query) AS rank
FROM risk, to_search_query('security vulnerability') AS query
WHERE search_vector @@ query
  AND organization_id = 'your-org-id'
  AND deleted_at IS NULL
ORDER BY rank DESC
LIMIT 25;

-- Search with highlighting:
SELECT 
  id, 
  title,
  ts_headline('english', description, query, 'StartSel=<mark>, StopSel=</mark>') AS highlighted
FROM risk, to_search_query('data breach') AS query
WHERE search_vector @@ query
  AND organization_id = 'your-org-id';

-- Combined filter + search:
SELECT id, title, status
FROM risk
WHERE organization_id = 'your-org-id'
  AND status = 'risk_identified'
  AND search_vector @@ to_search_query('compliance')
  AND deleted_at IS NULL
ORDER BY created_at DESC;

*/

