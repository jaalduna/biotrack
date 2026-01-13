# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BioTrack is a full-stack medical application for tracking patient diagnostics and antibiotic treatments in hospital settings. It uses a multi-tenant architecture where multiple hospital teams share a single database with row-level isolation via `team_id`.

## Development Commands

### Full Stack Development (Recommended)
```bash
./run-dev.sh  # Starts PostgreSQL, backend, and frontend
```

### Frontend Only
```bash
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Build for production
npm run build:check  # TypeScript check + build
npm run lint         # ESLint
npm run test         # Run vitest tests
npm run test:ui      # Run tests with UI
```

### Backend Only
```bash
cd backend
source venv/bin/activate  # or: python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head  # Run migrations
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Database
```bash
docker-compose -f docker-compose.dev.yml up -d  # Start PostgreSQL (port 5434)
docker-compose -f docker-compose.dev.yml exec db psql -U user -d biotrack  # Connect
```

### Running a Single Test
```bash
# Frontend (vitest)
npm run test -- src/tests/PatientsPage.test.tsx

# Backend (pytest)
cd backend
pytest tests/test_diagnostic_categories.py -v
```

## Architecture

### Frontend (React + TypeScript)
- **Entry**: `src/main.tsx` wraps app with `AuthProvider` > `TeamProvider` > `RouterProvider`
- **Router**: `src/router/router.app.tsx` - uses react-router with `/biotrack` basename
- **Pages**: `src/pages/` - main views (PatientsPage, PatientsDetailPage, TeamManagementPage, etc.)
- **Components**: `src/components/` - reusable UI components, patient-specific components in `components/patients/`
- **UI Components**: `src/components/ui/` - shadcn/ui primitives (Radix-based)
- **Contexts**: `src/contexts/AuthContext.tsx` (auth state), `src/contexts/TeamContext.tsx` (team state)
- **Services**: `src/services/Api.tsx` - centralized API client for all backend calls

### Backend (FastAPI + SQLAlchemy)
- **Entry**: `backend/app/main.py` - FastAPI app with CORS, registers all routers under `/api/v1`
- **Routers**: `backend/app/routers/` - one file per domain (patients, treatments, diagnostics, teams, auth, etc.)
- **Models**: `backend/app/models.py` - SQLAlchemy ORM models for all tables
- **Schemas**: `backend/app/schemas.py` - Pydantic models for request/response validation
- **Auth**: `backend/app/auth.py` - JWT authentication, password hashing
- **Migrations**: `backend/alembic/versions/` - database migrations

### Key Data Model Concepts
- **Multi-tenancy**: All patient data is scoped by `team_id`. Every query MUST filter by team_id.
- **Teams**: Hospital teams with subscription plans (basic: 5 members, premium: 20 members)
- **Users**: Belong to one team, have `team_role` (owner/admin/member) and `role` (basic/advanced for features)
- **Patients**: Core entity with RUT (Chilean ID), unit (UCI/UTI), bed assignment
- **Treatments**: Antibiotic/corticoid programs with start_date, programmed_days, days_applied
- **Diagnostics**: Patient diagnoses with severity levels

### API Pattern
All API routes follow: `GET/POST/PUT/DELETE /api/v1/{resource}`

API docs available at: http://localhost:8000/docs

## Services & Ports
| Service | Port |
|---------|------|
| Frontend (Vite) | 5173 |
| Backend (FastAPI) | 8000 |
| PostgreSQL (dev) | 5434 |
