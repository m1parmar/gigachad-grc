-- CreateTable for MCP Credentials (encrypted storage)
CREATE TABLE IF NOT EXISTS "mcp_credentials" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "server_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "server_name" TEXT NOT NULL,
    "encrypted_env" TEXT NOT NULL,
    "configured_integrations" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mcp_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "mcp_credentials_server_id_key" ON "mcp_credentials"("server_id");

-- CreateIndex
CREATE INDEX "mcp_credentials_template_id_idx" ON "mcp_credentials"("template_id");

-- CreateIndex
CREATE INDEX "mcp_credentials_created_by_idx" ON "mcp_credentials"("created_by");

-- Comment on table
COMMENT ON TABLE "mcp_credentials" IS 'Stores encrypted credentials for MCP server configurations';
COMMENT ON COLUMN "mcp_credentials"."encrypted_env" IS 'AES-256-GCM encrypted environment variables containing API keys and secrets';




