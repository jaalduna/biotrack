#!/bin/bash

# Biotrack Development Environment Startup Script
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Biotrack development environment...${NC}"

# 1. Start PostgreSQL if not running
if ! docker ps | grep -q biotrack-db; then
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    docker run -d --name biotrack-db \
        -e POSTGRES_DB=biotrack \
        -e POSTGRES_USER=user \
        -e POSTGRES_PASSWORD=password \
        -p 5432:5432 \
        postgres:15 2>/dev/null || docker start biotrack-db
    
    # Wait for postgres to be ready
    echo "Waiting for PostgreSQL to be ready..."
    sleep 3
else
    echo -e "${GREEN}PostgreSQL already running${NC}"
fi

echo -e "${YELLOW}Starting Backend...${NC}"
(
    cd "$SCRIPT_DIR/backend"
    poetry install --quiet 2>/dev/null
    echo -e "${GREEN}Backend running on http://localhost:8000${NC}"
    exec poetry run uvicorn app.main:app --reload --port 8000
) &
BACKEND_PID=$!
sleep 2

cleanup() {
    echo -e "\n${YELLOW}Stopping services...${NC}"
    kill $BACKEND_PID 2>/dev/null
    echo -e "${GREEN}Done${NC}"
}
trap cleanup EXIT

echo -e "${YELLOW}Starting Frontend...${NC}"
npm install --silent
npm run dev
