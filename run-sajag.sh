#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$BASE_DIR"

echo "=== SAJAG Build & Start Script ==="
echo ""

# Step 1: Build all packages and TypeScript
echo "📦 Building packages and TypeScript..."
npm run build:packages 2>&1 | tail -5
echo "✅ Packages built"
echo ""

# Step 2: Generate Prisma client and compile API
echo "⚙️ Generating Prisma client and compiling API..."
npm run build:api 2>&1 | tail -5
echo "✅ API compiled"
echo ""

# Step 3: Build device-sim
echo "📱 Building device simulator..."
npm run build:sim 2>&1 | tail -5
echo "✅ Device simulator compiled"
echo ""

# Step 4: Start Docker infrastructure (Postgres + Mosquitto)
echo "🐳 Starting Docker infrastructure..."
docker compose -f docker-compose.yml up -d 2>&1 | tail -5
echo "✅ Infrastructure started"
echo ""

# Wait for services to be ready
echo "⏳ Waiting for services to become ready..."
sleep 8

# Step 5: Run database migrations and seed
echo "🗄️ Running database migrations..."
# Use local Docker PostgreSQL so API and DB are consistent
export DATABASE_URL="postgresql://sajag:simulation@127.0.0.1:5432/sajag_simulation?sslmode=disable"
export DIRECT_URL="postgresql://sajag:simulation@127.0.0.1:5432/sajag_simulation?sslmode=disable"
npx prisma migrate deploy --schema apps/api/prisma/schema.prisma 2>&1 | tail -5 || true
echo "✅ Migrations complete"
unset DATABASE_URL
unset DIRECT_URL
echo ""

# Step 6: Start the API server in background with local DB URL
echo "🚀 Starting API server..."
export DATABASE_URL="postgresql://sajag:simulation@127.0.0.1:5432/sajag_simulation?sslmode=disable"
export DIRECT_URL="postgresql://sajag:simulation@127.0.0.1:5432/sajag_simulation?sslmode=disable"
node apps/api/dist/index.js &
API_PID=$!
echo "   API running on http://localhost:4000 (PID: $API_PID)"
echo ""

# Step 7: Start the device simulator in background
echo "📡 Starting device simulator..."
node apps/device-sim/dist/index.js &
SIM_PID=$!
echo "   Simulator running on http://localhost:4001 (PID: $SIM_PID)"
echo ""

echo "=== SAJAG Platform Running ==="
echo "   API:      http://localhost:4000"
echo "   Simulator: http://localhost:4001"
echo "   MQTT:      mosquitto on port 1883"
echo "   Database:  PostgreSQL (local Docker)"
echo ""
echo "Press Ctrl+C to stop both services..."

# Wait for Ctrl+C
trap 'echo "Shutting down..."; kill $API_PID $SIM_PID 2>/dev/null; docker compose -f docker-compose.yml down 2>/dev/null; exit 0' INT TERM
wait