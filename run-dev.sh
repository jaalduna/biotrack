#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  BioTrack Development Environment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}Error: docker-compose is required but not installed.${NC}"; exit 1; }
command -v poetry >/dev/null 2>&1 || { echo -e "${RED}Error: poetry is required but not installed.${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}Error: npm is required but not installed.${NC}"; exit 1; }

echo -e "${YELLOW}Starting PostgreSQL database...${NC}"
docker-compose -f docker-compose.dev.yml up -d db
sleep 5

echo -e "${YELLOW}Setting up Python backend...${NC}"
cd backend

if [ ! -d ".venv" ] && [ ! -d "venv" ]; then
    echo -e "${YELLOW}Installing Python dependencies with Poetry...${NC}"
    poetry install
fi

echo -e "${YELLOW}Running database migrations...${NC}"
poetry run alembic upgrade head
cd ..

echo ""
echo -e "${GREEN}Database ready on localhost:5434${NC}"
echo ""

if [ ! -x "node_modules/.bin/vite" ]; then
    echo -e "${YELLOW}Installing npm dependencies...${NC}"
    npm install || npm install --legacy-peer-deps || { echo -e "${RED}npm install failed${NC}"; exit 1; }
fi

echo -e "${YELLOW}Starting FastAPI backend...${NC}"
cd backend
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

echo -e "${YELLOW}Starting Vite dev server...${NC}"
npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Services Started${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}Frontend:  http://localhost:5173${NC}"
echo -e "${GREEN}Backend:   http://localhost:8000${NC}"
echo -e "${GREEN}Database:  localhost:5434${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

trap "echo 'Stopping services...'; kill $BACKEND_PID $FRONTEND_PID; docker-compose -f docker-compose.dev.yml down; exit 0" SIGINT

wait
