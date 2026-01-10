# =============================================================================
# GCP Deployment Script - GigaChad GRC Development Version
# =============================================================================
# This script will:
# 1. Reset the GCP instance (factory reset - wipe data)
# 2. Install all dependencies on the instance
# 3. Deploy the development version of GigaChad GRC
# =============================================================================

param(
    [Parameter(Mandatory=$false)]
    [string]$InstanceName = "gigachad",
    
    [Parameter(Mandatory=$false)]
    [string]$Zone = "us-central1-c",
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = "",
    
    [Parameter(Mandatory=$false)]
    [string]$RepoUrl = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipReset,
    
    [Parameter(Mandatory=$false)]
    [switch]$UseLocalTransfer
)

$ErrorActionPreference = "Continue"

# Colors for output
function Write-Step { param($msg) Write-Host "`n[STEP] " -ForegroundColor Cyan -NoNewline; Write-Host $msg -ForegroundColor White }
function Write-Success { param($msg) Write-Host "[OK] " -ForegroundColor Green -NoNewline; Write-Host $msg }
function Write-Error-Msg { param($msg) Write-Host "[ERROR] " -ForegroundColor Red -NoNewline; Write-Host $msg }
function Write-Info { param($msg) Write-Host "[INFO] " -ForegroundColor Yellow -NoNewline; Write-Host $msg }

Write-Host @"
================================================================
                                                                
   GigaChad GRC - GCP Development Deployment                
                                                                
================================================================

"@ -ForegroundColor Cyan

# =============================================================================
# Step 1: Check Prerequisites
# =============================================================================
Write-Step "Checking Prerequisites..."

# Check gcloud CLI
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Error-Msg "gcloud CLI not found. Please install Google Cloud SDK:"
    Write-Info "https://cloud.google.com/sdk/docs/install"
    exit 1
}
Write-Success "gcloud CLI found: $(gcloud --version | Select-Object -First 1)"

# Get project ID if not provided
if ([string]::IsNullOrWhiteSpace($ProjectId)) {
    $ProjectId = gcloud config get-value project 2>$null
    if ([string]::IsNullOrWhiteSpace($ProjectId)) {
        Write-Error-Msg "No project ID specified and no default project found."
        Write-Info "Set it with: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    }
}
Write-Success "Using GCP Project: $ProjectId"

# Verify instance exists or will be created
Write-Info "Checking if instance exists..."
$instanceExists = gcloud compute instances describe $InstanceName --zone=$Zone --project=$ProjectId 2>$null
if (-not $instanceExists -and -not $SkipReset) {
    Write-Info "Instance '$InstanceName' not found. It will be created during reset."
}

# Check repository URL
if ([string]::IsNullOrWhiteSpace($RepoUrl) -and -not $UseLocalTransfer) {
    Write-Info ""
    Write-Info "No repository URL specified. Options:"
    Write-Info "  1. Provide -RepoUrl parameter with your Git repository URL"
    Write-Info "  2. Use -UseLocalTransfer to transfer local files from Cursor/gigachad-grc"
    Write-Info ""
    $response = Read-Host "Do you want to use local file transfer? (y/n)"
    if ($response -eq 'y' -or $response -eq 'Y') {
        $UseLocalTransfer = $true
    } else {
        $RepoUrl = Read-Host "Enter your Git repository URL (e.g., https://github.com/YOUR_ORG/gigachad-grc.git)"
        if ([string]::IsNullOrWhiteSpace($RepoUrl)) {
            Write-Error-Msg "Repository URL is required"
            exit 1
        }
    }
}

# =============================================================================
# Step 2: Reset Instance (Factory Reset)
# =============================================================================
if (-not $SkipReset) {
    Write-Step "Ensuring GCP Instance is ready..."
    
    # Check if instance exists
    $ErrorActionPreference = "SilentlyContinue"
    $instanceCheck = gcloud compute instances describe $InstanceName --zone=$Zone --project=$ProjectId --format="get(status)" 2>&1
    $instanceExists = ($LASTEXITCODE -eq 0)
    $ErrorActionPreference = "Continue"
    
    if ($instanceExists) {
        Write-Info "Instance '$InstanceName' found."
        
        # Check if instance is running
        $instanceStatus = gcloud compute instances describe $InstanceName --zone=$Zone --project=$ProjectId --format="get(status)" 2>$null
        if ($instanceStatus -ne "RUNNING") {
            Write-Info "Instance is not running (status: $instanceStatus). Starting instance..."
            gcloud compute instances start $InstanceName --zone=$Zone --project=$ProjectId 2>&1 | Out-Null
            Write-Info "Waiting 30 seconds for instance to start..."
            Start-Sleep -Seconds 30
        } else {
            Write-Success "Instance is already running"
        }
    } else {
        # Instance doesn't exist, create it
        Write-Info "Instance does not exist. Creating new instance..."
        $machineType = "e2-standard-2"
        $bootDiskSize = "75"
        $tags = "http-server,https-server"
        
        Write-Info "  Machine Type: $machineType"
        Write-Info "  Boot Disk Size: ${bootDiskSize}GB"
        Write-Info "  Tags: $tags"
        
        $createOutput = gcloud compute instances create $InstanceName `
            --zone=$Zone `
            --project=$ProjectId `
            --image-family=ubuntu-2204-lts `
            --image-project=ubuntu-os-cloud `
            --machine-type=$machineType `
            --boot-disk-size=$bootDiskSize `
            --boot-disk-type=pd-standard `
            --tags=$tags `
            --scopes=cloud-platform 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error-Msg "Failed to create instance!"
            Write-Host $createOutput -ForegroundColor Red
            exit 1
        }
        
        Write-Success "Instance created successfully"
        
        Write-Info "Waiting for instance to be ready (90 seconds)..."
        Start-Sleep -Seconds 90
    }
    
    # Wait for SSH to be available
    Write-Info "Waiting for SSH to be available..."
    $maxAttempts = 30
    $attempt = 0
    while ($attempt -lt $maxAttempts) {
        $sshTest = gcloud compute ssh $InstanceName --zone=$Zone --project=$ProjectId --command="echo 'SSH ready'" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "SSH is ready"
            break
        }
        $attempt++
        Write-Info "Waiting for SSH... (attempt $attempt/$maxAttempts)"
        Start-Sleep -Seconds 5
    }
    
    if ($attempt -eq $maxAttempts) {
        Write-Error-Msg "SSH connection failed after $maxAttempts attempts"
        exit 1
    }
}

# =============================================================================
# Step 3: Create Remote Setup Script
# =============================================================================
Write-Step "Creating remote setup script..."

# Create bash script content using single-quoted here-string to avoid PowerShell parsing
$remoteScript = @'
#!/bin/bash
set -eo pipefail

echo "[SETUP] Starting GigaChad GRC Development Deployment..."

# Clean up any corrupted Docker apt sources from previous failed runs
echo "[SETUP] Cleaning up any corrupted apt sources..."
rm -f /etc/apt/sources.list.d/docker.list 2>/dev/null || true

# Update system
echo "[SETUP] Updating system packages..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq || { echo "[ERROR] apt-get update failed"; exit 1; }
apt-get upgrade -y -qq

# Install prerequisites
echo "[SETUP] Installing prerequisites..."
apt-get install -y -qq ca-certificates curl gnupg lsb-release git build-essential apt-transport-https software-properties-common

# Install Docker
echo "[SETUP] Installing Docker..."
if ! command -v docker &> /dev/null; then
    # Clean up old Docker GPG key if exists
    rm -f /etc/apt/keyrings/docker.gpg 2>/dev/null || true
    
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    
    # Get architecture and Ubuntu codename
    ARCH=$(dpkg --print-architecture)
    CODENAME=$(. /etc/os-release && echo "$VERSION_CODENAME")
    
    # Add Docker repository
    echo "deb [arch=${ARCH} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${CODENAME} stable" > /etc/apt/sources.list.d/docker.list
    
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    echo "[OK] Docker installed"
else
    echo "[OK] Docker already installed: $(docker --version)"
fi

# Install Node.js 20.x
echo "[SETUP] Installing Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
    echo "[OK] Node.js installed: $(node --version)"
else
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 20 ]; then
        echo "[INFO] Upgrading Node.js to 20.x..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y -qq nodejs
    fi
    echo "[OK] Node.js: $(node --version)"
fi

# Verify Docker is running
echo "[SETUP] Verifying Docker..."
systemctl enable docker
systemctl start docker
docker info > /dev/null 2>&1 || { echo "[ERROR] Docker is not running"; exit 1; }
echo "[OK] Docker is running"

# Create application directory
echo "[SETUP] Setting up application directory..."
APP_DIR="/opt/gigachad-grc"
mkdir -p $APP_DIR
cd $APP_DIR

# Clone or transfer repository
REPO_URL="$1"
USE_LOCAL_TRANSFER="$2"

if [ "$USE_LOCAL_TRANSFER" = "true" ]; then
    echo "[SETUP] Repository was transferred from local machine..."
    if [ -z "$(ls -A . 2>/dev/null)" ]; then
        echo "[ERROR] Local repository transfer incomplete. Directory is empty."
        exit 1
    fi
    echo "[OK] Using transferred repository"
elif [ -d ".git" ]; then
    echo "[SETUP] Repository already exists, updating..."
    git pull || echo "[INFO] Failed to pull (may be fine if already up to date)"
    echo "[OK] Repository checked/updated"
else
    if [ -n "$REPO_URL" ] && [ "$REPO_URL" != "" ] && [ "$REPO_URL" != "null" ]; then
        echo "[SETUP] Cloning repository from: $REPO_URL"
        git clone $REPO_URL . || { echo "[ERROR] Failed to clone repository"; exit 1; }
        echo "[OK] Repository cloned"
    else
        echo "[ERROR] No repository URL provided and no existing repository found"
        exit 1
    fi
fi

echo "[OK] Repository ready"

# Setup environment
echo "[SETUP] Setting up environment configuration..."
cd $APP_DIR

if [ ! -f ".env" ]; then
    echo "[SETUP] Generating .env file with secure secrets..."
    
    ENCRYPTION_KEY=$(openssl rand -hex 32 2>/dev/null || head -c 32 /dev/urandom | xxd -p | tr -d '\n')
    JWT_SECRET=$(openssl rand -base64 48 2>/dev/null || head -c 48 /dev/urandom | base64 | tr -d '\n')
    SESSION_SECRET=$(openssl rand -base64 48 2>/dev/null || head -c 48 /dev/urandom | base64 | tr -d '\n')
    POSTGRES_PASSWORD=$(openssl rand -base64 24 2>/dev/null | tr -d '\n' | tr '+/' '-_' || head -c 24 /dev/urandom | base64 | tr '+/' '-_')
    REDIS_PASSWORD=$(openssl rand -base64 24 2>/dev/null | tr -d '\n' | tr '+/' '-_' || head -c 24 /dev/urandom | base64 | tr '+/' '-_')
    MINIO_PASSWORD=$(openssl rand -base64 20 2>/dev/null | tr -d '\n' | tr '+/' '-_' || head -c 20 /dev/urandom | base64 | tr '+/' '-_')
    
    cat > ".env" << ENVEOF
# ============================================================================
# GigaChad GRC - Environment Configuration
# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# ============================================================================

NODE_ENV=development

# Security Secrets (auto-generated)
ENCRYPTION_KEY=${ENCRYPTION_KEY}
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}

# Database
POSTGRES_USER=grc
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=gigachad_grc
DATABASE_URL=postgresql://grc:${POSTGRES_PASSWORD}@postgres:5432/gigachad_grc

# Redis
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379

# RustFS (S3-Compatible Object Storage)
MINIO_ROOT_USER=rustfsadmin
MINIO_ROOT_PASSWORD=${MINIO_PASSWORD}
MINIO_ENDPOINT=localhost
MINIO_PORT=9000

# Authentication
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin
KEYCLOAK_REALM=gigachad-grc
USE_DEV_AUTH=true

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=1000

# Logging
LOG_LEVEL=debug

# Frontend
VITE_API_URL=http://localhost:3001
VITE_ENABLE_DEV_AUTH=true
VITE_ENABLE_AI_MODULE=true
ENVEOF
    
    chmod 600 ".env"
    echo "[OK] .env file created"
else
    echo "[OK] .env file already exists"
fi

# Make scripts executable
echo "[SETUP] Making scripts executable..."
chmod +x start.sh init.sh 2>/dev/null || true

# Start services with Docker Compose (development mode)
echo "[SETUP] Starting GigaChad GRC services with Docker Compose (development mode)..."

# Use docker compose (newer) or docker-compose (older)
if docker compose version &> /dev/null 2>&1; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "[ERROR] Neither 'docker compose' nor 'docker-compose' found"
    exit 1
fi

# Build and start all services
echo "[SETUP] Building and starting all services (this may take 5-10 minutes)..."

# Check which compose files exist
if [ -f "docker-compose.dev.yml" ]; then
    echo "[INFO] Using docker-compose.yml with docker-compose.dev.yml"
    $DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.dev.yml up -d --build || { echo "[ERROR] Failed to start services"; exit 1; }
elif [ -f "docker-compose.yml" ]; then
    echo "[INFO] Using docker-compose.yml only"
    $DOCKER_COMPOSE -f docker-compose.yml up -d --build || { echo "[ERROR] Failed to start services"; exit 1; }
else
    echo "[ERROR] No docker-compose.yml found in repository"
    exit 1
fi

# Initialize Database
echo "[SETUP] Initializing Database..."
echo "[INFO] Waiting for Postgres..."
sleep 20

# Create keycloak schema (using -T for non-interactive execution)
# We use the password variable that was generated earlier in the script
echo "[INFO] Creating Keycloak schema..."
$DOCKER_COMPOSE exec -T -e PGPASSWORD=$POSTGRES_PASSWORD postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "CREATE SCHEMA IF NOT EXISTS keycloak;" || echo "[WARN] Failed to create keycloak schema (might already exist)"

# Push Prisma Schema
echo "[INFO] Pushing Prisma Schema..."
# Try both paths just in case (dev vs prod image structure)
$DOCKER_COMPOSE exec -T controls npx prisma db push --schema=/app/node_modules/.prisma/client/schema.prisma --skip-generate || \
$DOCKER_COMPOSE exec -T controls npx prisma db push --schema=../shared/prisma/schema.prisma --skip-generate || \
echo "[WARN] Database migration failed. You may need to run 'prisma db push' manually."

# Restart Keycloak to ensure it picks up the schema and table changes
echo "[INFO] Restarting Keycloak..."
$DOCKER_COMPOSE restart keycloak

# Wait for services to be healthy
echo "[SETUP] Waiting for services to start..."
sleep 30

# Check service health
echo "[SETUP] Checking service health..."
max_attempts=60
attempt=0

while [ $attempt -lt $max_attempts ]; do
    # Check if any containers are running
    if $DOCKER_COMPOSE ps 2>/dev/null | grep -q "Up\|running"; then
        echo "[OK] Services are running"
        break
    fi
    attempt=$((attempt + 1))
    if [ $attempt -eq $max_attempts ]; then
        echo "[WARN] Services may not be fully healthy yet. Check logs with: $DOCKER_COMPOSE logs"
        break
    fi
    echo "[INFO] Waiting for services... (attempt $attempt/$max_attempts)"
    sleep 5
done

# Display status
echo "[SETUP] Service Status:"
$DOCKER_COMPOSE ps

# Get external IP
echo "[SETUP] Getting external IP address..."
EXTERNAL_IP=$(curl -s http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/access-configs/0/external-ip -H "Metadata-Flavor: Google" || echo "Not available")

echo ""
echo "================================================================"
echo "   GigaChad GRC Development Deployment Complete!"
echo "================================================================"
echo ""
echo "Access Points:"
echo "   Frontend:    http://${EXTERNAL_IP}:3000 (or http://localhost:3000 from SSH tunnel)"
echo "   API Docs:    http://${EXTERNAL_IP}:3001/api/docs"
echo "   Keycloak:    http://${EXTERNAL_IP}:8080 (admin/admin)"
echo "   RustFS:      http://${EXTERNAL_IP}:9001 (rustfsadmin/...)"
echo "   Grafana:     http://${EXTERNAL_IP}:3003 (admin/admin)"
echo ""
echo "To access via SSH tunnel, run on your local machine:"
echo "   gcloud compute ssh PLACEHOLDER_INSTANCE_NAME --zone=PLACEHOLDER_ZONE --project=PLACEHOLDER_PROJECT_ID -- -L 3000:localhost:3000 -L 3001:localhost:3001 -L 8080:localhost:8080 -N"
echo ""
echo "To view logs:"
echo "   $DOCKER_COMPOSE logs -f"
echo ""
echo "To stop services:"
echo "   $DOCKER_COMPOSE down"
echo ""
echo "To restart services:"
echo "   $DOCKER_COMPOSE restart"
echo ""
echo "[OK] Deployment complete!"
'@

# Replace placeholders with actual values
$remoteScript = $remoteScript -replace 'PLACEHOLDER_INSTANCE_NAME', $InstanceName
$remoteScript = $remoteScript -replace 'PLACEHOLDER_ZONE', $Zone
$remoteScript = $remoteScript -replace 'PLACEHOLDER_PROJECT_ID', $ProjectId

# Convert Windows line endings (CRLF) to Unix line endings (LF)
$remoteScript = $remoteScript -replace "`r`n", "`n"
$remoteScript = $remoteScript -replace "`r", "`n"

# Save script to temp file with Unix line endings
$tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
[System.IO.File]::WriteAllText($tempScript, $remoteScript, [System.Text.UTF8Encoding]::new($false))

# =============================================================================
# Step 4: Transfer Files (if using local transfer)
# =============================================================================
if ($UseLocalTransfer) {
    Write-Step "Transferring local repository to instance..."
    
    $localRepoPath = "$PSScriptRoot\..\Cursor\gigachad-grc"
    if (-not (Test-Path $localRepoPath)) {
        Write-Error-Msg "Local repository not found at: $localRepoPath"
        Write-Info "Please ensure the repository exists at: Cursor\gigachad-grc"
        Write-Info "Or use -RepoUrl parameter with a Git repository URL instead"
        exit 1
    }
    
    Write-Info "Creating archive of repository..."
    $archivePath = [System.IO.Path]::GetTempFileName() + ".tar.gz"
    $archiveDir = Split-Path $archivePath
    $archiveName = Split-Path $archivePath -Leaf
    
    # Use tar to create archive (available on Windows 10+)
    Push-Location (Split-Path $localRepoPath -Parent)
    try {
        $repoFolderName = Split-Path $localRepoPath -Leaf
        tar -czf $archivePath $repoFolderName 2>&1 | Out-Null
        
        if (-not (Test-Path $archivePath)) {
            Write-Error-Msg "Failed to create archive. tar command may not be available."
            Write-Info "Please install tar for Windows or use Git repository instead:"
            Write-Info "  1. Push your code to GitHub/GitLab"
            Write-Info "  2. Use -RepoUrl parameter with your repository URL"
            exit 1
        }
    } catch {
        Write-Error-Msg "Failed to create archive: $_"
        Write-Info "Please use Git repository URL instead with -RepoUrl parameter"
        exit 1
    }
    finally {
        Pop-Location
    }
    
    Write-Info "Transferring archive to instance (this may take a few minutes for large repos)..."
    gcloud compute scp $archivePath ${InstanceName}:/tmp/gigachad-grc.tar.gz --zone=$Zone --project=$ProjectId
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Msg "Failed to transfer archive to instance"
        Remove-Item $archivePath -ErrorAction SilentlyContinue
        exit 1
    }
    
    Write-Info "Extracting archive on instance..."
    gcloud compute ssh $InstanceName --zone=$Zone --project=$ProjectId --command="mkdir -p /opt/gigachad-grc && cd /opt && tar -xzf /tmp/gigachad-grc.tar.gz && if [ -d gigachad-grc ]; then mv gigachad-grc/* gigachad-grc/.[!.]* gigachad-grc/.??* . 2>/dev/null || mv gigachad-grc/* . 2>/dev/null; rmdir gigachad-grc 2>/dev/null || true; fi && rm -f /tmp/gigachad-grc.tar.gz"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error-Msg "Failed to extract archive on instance"
    }
    
    Remove-Item $archivePath -ErrorAction SilentlyContinue
    
    Write-Success "Repository transferred successfully"
}

# =============================================================================
# Step 5: Transfer and Execute Setup Script
# =============================================================================
Write-Step "Transferring setup script to instance..."

# Copy script to instance
gcloud compute scp $tempScript ${InstanceName}:/tmp/setup-gigachad.sh --zone=$Zone --project=$ProjectId
if ($LASTEXITCODE -ne 0) {
    Write-Error-Msg "Failed to copy setup script to instance"
    exit 1
}
Write-Success "Setup script transferred"

# Make script executable and run it
Write-Step "Executing setup script on instance (this will take 10-15 minutes)..."

Write-Info "Note: This may take 10-15 minutes. Progress will be shown below..."
Write-Info "The script will install Docker, Node.js, clone/setup the repository,"
Write-Info "and start all GigaChad GRC services in development mode."
Write-Info ""

# Prepare arguments for remote script
$repoUrlArg = if ([string]::IsNullOrWhiteSpace($RepoUrl)) { "" } else { $RepoUrl }
$useLocalArg = if ($UseLocalTransfer) { "true" } else { "false" }

# Execute the script with arguments
gcloud compute ssh $InstanceName --zone=$Zone --project=$ProjectId --command="chmod +x /tmp/setup-gigachad.sh && sudo /tmp/setup-gigachad.sh '$repoUrlArg' '$useLocalArg'"

if ($LASTEXITCODE -eq 0) {
    Write-Success "Deployment completed successfully!"
    
    # Get external IP
    Write-Step "Getting external IP address..."
    $externalIP = gcloud compute instances describe $InstanceName --zone=$Zone --project=$ProjectId --format="get(networkInterfaces[0].accessConfigs[0].natIP)"
    
    if (-not [string]::IsNullOrWhiteSpace($externalIP)) {
        Write-Host ""
        Write-Host "================================================================" -ForegroundColor Green
        Write-Host "                                                                " -ForegroundColor Green
        Write-Host "   Deployment Complete!                                        " -ForegroundColor Green
        Write-Host "                                                                " -ForegroundColor Green
        Write-Host "================================================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Access your application at:" -ForegroundColor Cyan
        Write-Host "   Frontend:    http://$externalIP:3000" -ForegroundColor White
        Write-Host "   API Docs:    http://$externalIP:3001/api/docs" -ForegroundColor White
        Write-Host "   Keycloak:    http://$externalIP:8080" -ForegroundColor White
        Write-Host ""
        Write-Host "To create SSH tunnel for secure access, run:" -ForegroundColor Yellow
        Write-Host "   gcloud compute ssh $InstanceName --zone=$Zone --project=$ProjectId -- -L 3000:localhost:3000 -L 3001:localhost:3001 -L 8080:localhost:8080 -N" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Then access at:" -ForegroundColor Yellow
        Write-Host "   http://localhost:3000" -ForegroundColor White
        Write-Host ""
    }
} else {
    Write-Error-Msg "Deployment failed. Check the output above for details."
    Write-Info "You can SSH into the instance to debug:"
    Write-Info "   gcloud compute ssh $InstanceName --zone=$Zone --project=$ProjectId"
    exit 1
}

# Cleanup
Remove-Item $tempScript -ErrorAction SilentlyContinue

Write-Host ""
Write-Success "All done! Deployment script completed successfully."

