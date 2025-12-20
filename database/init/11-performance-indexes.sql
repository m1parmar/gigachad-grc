-- Performance Optimization: Database Indexes
-- This migration adds indexes to improve query performance for common access patterns

-- ===========================================
-- Controls Table Indexes
-- ===========================================

-- Index for filtering controls by organization and category
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_controls_org_category 
  ON controls(organization_id, category) 
  WHERE deleted_at IS NULL;

-- Index for filtering controls by organization and tags
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_controls_org_tags 
  ON controls USING gin(tags)
  WHERE deleted_at IS NULL;

-- Index for control search (title and control_id)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_controls_search_title 
  ON controls USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(control_id, '')))
  WHERE deleted_at IS NULL;

-- Composite index for control list queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_controls_list_query
  ON controls(organization_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ===========================================
-- Control Implementations Indexes
-- ===========================================

-- Index for filtering implementations by organization and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_implementations_org_status 
  ON control_implementations(organization_id, status);

-- Index for implementations by control and org
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_implementations_control_org
  ON control_implementations(control_id, organization_id);

-- Index for finding overdue implementations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_implementations_overdue
  ON control_implementations(organization_id, due_date, status)
  WHERE due_date IS NOT NULL AND status != 'implemented';

-- ===========================================
-- Risks Table Indexes
-- ===========================================

-- Index for filtering risks by organization and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_risks_org_status 
  ON risks(organization_id, status) 
  WHERE deleted_at IS NULL;

-- Index for filtering risks by organization and risk level
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_risks_org_level 
  ON risks(organization_id, inherent_risk) 
  WHERE deleted_at IS NULL;

-- Index for risk search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_risks_search
  ON risks USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')))
  WHERE deleted_at IS NULL;

-- Index for filtering risks by category
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_risks_org_category
  ON risks(organization_id, category)
  WHERE deleted_at IS NULL;

-- Index for risks needing review
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_risks_review_due
  ON risks(organization_id, next_review_due)
  WHERE deleted_at IS NULL AND next_review_due IS NOT NULL;

-- Composite index for risk dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_risks_dashboard
  ON risks(organization_id, status, inherent_risk, created_at DESC)
  WHERE deleted_at IS NULL;

-- ===========================================
-- Evidence Table Indexes
-- ===========================================

-- Index for filtering evidence by organization and type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evidence_org_type 
  ON evidence(organization_id, type);

-- Index for filtering evidence by status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evidence_org_status 
  ON evidence(organization_id, status);

-- Index for expiring evidence
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evidence_expiring
  ON evidence(organization_id, valid_until, is_expired)
  WHERE valid_until IS NOT NULL;

-- Index for evidence search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_evidence_search
  ON evidence USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));

-- ===========================================
-- Policies Table Indexes
-- ===========================================

-- Index for filtering policies by organization and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_policies_org_status 
  ON policies(organization_id, status) 
  WHERE deleted_at IS NULL;

-- Index for policies by category
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_policies_org_category
  ON policies(organization_id, category)
  WHERE deleted_at IS NULL;

-- Index for policy search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_policies_search
  ON policies USING gin(to_tsvector('english', coalesce(title, '')))
  WHERE deleted_at IS NULL;

-- ===========================================
-- Vendors Table Indexes
-- ===========================================

-- Index for filtering vendors by organization and status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendors_org_status 
  ON vendors(organization_id, status) 
  WHERE deleted_at IS NULL;

-- Index for filtering vendors by criticality
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendors_org_criticality
  ON vendors(organization_id, criticality)
  WHERE deleted_at IS NULL;

-- Index for vendor search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendors_search
  ON vendors USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(category, '')))
  WHERE deleted_at IS NULL;

-- ===========================================
-- Audit Log Table Indexes
-- ===========================================

-- Index for filtering audit logs by organization and entity type
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_org_entity 
  ON audit_log(organization_id, entity_type, timestamp DESC);

-- Index for filtering audit logs by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_user 
  ON audit_log(organization_id, user_id, timestamp DESC);

-- Index for filtering audit logs by action
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_action 
  ON audit_log(organization_id, action, timestamp DESC);

-- Index for recent activity queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_recent
  ON audit_log(organization_id, timestamp DESC);

-- ===========================================
-- Framework Mappings Indexes
-- ===========================================

-- Index for control-to-framework mapping lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mappings_control
  ON control_mappings(control_id);

-- Index for framework-to-control mapping lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mappings_framework
  ON control_mappings(framework_id);

-- ===========================================
-- Notifications Table Indexes
-- ===========================================

-- Index for user notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);

-- ===========================================
-- Analyze tables to update statistics
-- ===========================================
ANALYZE controls;
ANALYZE control_implementations;
ANALYZE risks;
ANALYZE evidence;
ANALYZE policies;
ANALYZE vendors;
ANALYZE audit_log;
ANALYZE control_mappings;
ANALYZE notifications;

