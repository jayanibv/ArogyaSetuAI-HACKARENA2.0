#!/bin/bash
# ============================================================================
# AarogyaSetu AI — Production Docker Deployment Orchestrator
# National Health Mission (NHM) ASHA Triage Platform
# ============================================================================

set -e

echo "🚀 [AarogyaSetu AI] Initiating production container orchestration..."

# Step 1: Pre-flight environment validation
if ! [ -x "$(command -v docker)" ]; then
  echo "❌ Error: Docker is not installed on this server. Please install Docker first." >&2
  exit 1
fi

if ! [ -x "$(command -v docker-compose)" ]; then
  echo "❌ Error: docker-compose is not installed. Please install docker-compose first." >&2
  exit 1
fi

# Step 2: Ensure environment configuration is active
if [ ! -f .env ]; then
  echo "⚠️  Warning: .env configuration file not found. Copying default credentials from env.example..."
  cp env.example .env
fi

# Step 3: Run production containers
echo "📦 Building and starting backend FastAPI & frontend Next.js microservices..."
docker-compose down --remove-orphans
docker-compose up -d --build

# Step 4: Health check loop (30s timeout)
echo "🔍 Running telemetry health checks..."
timeout=30
elapsed=0
healthy=false

while [ $elapsed -lt $timeout ]; do
  if curl -s http://localhost:8000/api/health | grep -q '"status":"healthy"'; then
    healthy=true
    break
  fi
  sleep 2
  elapsed=$((elapsed + 2))
done

if [ "$healthy" = true ]; then
  echo "✅ Deployment SUCCESSFUL! All services are active and healthy."
  echo "🌍 Frontend dashboard: http://localhost:3000"
  echo "⚙️  FastAPI endpoint:   http://localhost:8000"
else
  echo "❌ Error: Health check timed out. Please check container logs using: docker-compose logs"
  exit 1
fi
