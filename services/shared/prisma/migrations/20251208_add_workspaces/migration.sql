-- Migration: Add Multi-Workspace Support
-- Creates workspace tables and migrates existing data to default workspaces

-- Create WorkspaceStatus enum
CREATE TYPE "WorkspaceStatus" AS ENUM ('active', 'inactive', 'archived');

-- Create WorkspaceRole enum
CREATE TYPE "WorkspaceRole" AS ENUM ('owner', 'manager', 'contributor', 'viewer');

-- Add multi_workspace_enabled column to organizations
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "multi_workspace_enabled" BOOLEAN NOT NULL DEFAULT false;

-- Create workspaces table
CREATE TABLE IF NOT EXISTS "workspaces" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "organization_id" TEXT NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "status" "WorkspaceStatus" NOT NULL DEFAULT 'active',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("organization_id", "slug")
);

CREATE INDEX IF NOT EXISTS "workspaces_organization_id_status_idx" ON "workspaces"("organization_id", "status");

-- Create workspace_members table
CREATE TABLE IF NOT EXISTS "workspace_members" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "workspace_id" TEXT NOT NULL REFERENCES "workspaces"("id") ON DELETE CASCADE,
    "user_id" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "role" "WorkspaceRole" NOT NULL DEFAULT 'viewer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE ("workspace_id", "user_id")
);

CREATE INDEX IF NOT EXISTS "workspace_members_user_id_idx" ON "workspace_members"("user_id");

-- Add workspace_id columns to workspace-scoped entities
ALTER TABLE "control_implementations" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT REFERENCES "workspaces"("id");
ALTER TABLE "evidence" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT REFERENCES "workspaces"("id");
ALTER TABLE "risks" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT REFERENCES "workspaces"("id");
ALTER TABLE "vendors" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT REFERENCES "workspaces"("id");
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT REFERENCES "workspaces"("id");
ALTER TABLE "audits" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT REFERENCES "workspaces"("id");
ALTER TABLE "frameworks" ADD COLUMN IF NOT EXISTS "workspace_id" TEXT REFERENCES "workspaces"("id");

-- Create indexes for workspace_id columns
CREATE INDEX IF NOT EXISTS "control_implementations_workspace_id_idx" ON "control_implementations"("workspace_id");
CREATE INDEX IF NOT EXISTS "evidence_workspace_id_idx" ON "evidence"("workspace_id");
CREATE INDEX IF NOT EXISTS "risks_workspace_id_idx" ON "risks"("workspace_id");
CREATE INDEX IF NOT EXISTS "vendors_workspace_id_idx" ON "vendors"("workspace_id");
CREATE INDEX IF NOT EXISTS "assets_workspace_id_idx" ON "assets"("workspace_id");
CREATE INDEX IF NOT EXISTS "audits_workspace_id_idx" ON "audits"("workspace_id");
CREATE INDEX IF NOT EXISTS "frameworks_workspace_id_idx" ON "frameworks"("workspace_id");

-- Update the unique constraint on control_implementations to include workspace_id
-- First, drop the old constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'control_implementations_control_id_organization_id_key'
    ) THEN
        ALTER TABLE "control_implementations" 
        DROP CONSTRAINT "control_implementations_control_id_organization_id_key";
    END IF;
END $$;

-- Add new unique constraint including workspace_id
ALTER TABLE "control_implementations" 
ADD CONSTRAINT "control_implementations_control_id_organization_id_workspace_key" 
UNIQUE ("control_id", "organization_id", "workspace_id");

-- Note: For existing organizations, workspaceId will remain NULL (legacy data)
-- The application handles NULL workspaceId as "org-wide" when multi_workspace_enabled is false
-- When multi_workspace_enabled is turned on, a migration function creates the default workspace

