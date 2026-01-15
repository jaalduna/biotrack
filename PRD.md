# BioTrack Product Requirements Document (PRD)

## Overview

BioTrack is a full-stack medical application for tracking patient diagnostics and antibiotic treatments in hospital settings.

## Deployment Status

See [docs/RAILWAY_DEPLOYMENT_PROGRESS.md](docs/RAILWAY_DEPLOYMENT_PROGRESS.md) for detailed deployment progress and issue tracking.

---

## Current Tasks

### Task: Implement Authentication for Beta Release

**Priority**: Critical
**Status**: ✅ COMPLETED (2026-01-15)
**Assigned**: Development
**Target**: Beta release with real patient data protection

#### Problem Statement

The application currently allows unauthenticated access to all pages and API endpoints. With real patient data, authentication is mandatory before beta release to ensure:
- Only authorized users can access patient information
- Multi-tenant data isolation (team_id filtering)
- Compliance with medical data protection requirements

#### Current State Analysis

| Component | Status | Issue |
|-----------|--------|-------|
| Backend auth endpoints | ✅ Built | `/api/v1/auth/login`, `/api/v1/auth/register` functional |
| LoginPage UI | ✅ Routed | `src/pages/LoginPage.tsx` at `/login` |
| AuthContext | ✅ Built | JWT handling, login/register functions ready |
| Patients API | ✅ Protected | `get_current_user` + `team_id` filtering |
| Frontend routes | ✅ Protected | ProtectedRoute wrapper redirects to `/login` |

#### Implementation Plan

##### Phase 1: Wire Up Authentication Routes (Frontend) ✅ COMPLETED

**Files modified**: `src/router/router.app.tsx`, `src/components/ProtectedRoute.tsx`

**Completed**:
1. ✅ Added public routes for `/login` and `/register`
2. ✅ RegisterPage already exists
3. ✅ Added ProtectedRoute wrapper with redirect preservation
4. ✅ Unauthenticated users redirected to `/login?redirect=...`

##### Phase 2: Secure Patients API (Backend - Critical) ✅ COMPLETED

**Files modified**: `backend/app/routers/patients.py`, `backend/app/models.py`

**Completed**:
1. ✅ Import `get_current_user` from `..auth`
2. ✅ Added `current_user = Depends(get_current_user)` to all endpoints
3. ✅ Added `team_id` filtering to all queries
4. ✅ Create endpoint sets `team_id` from current user
5. ✅ Backend tests: `backend/tests/test_patients_auth.py` (15 tests)
6. ✅ Frontend auth tests: `src/tests/auth.test.tsx` (11 tests)

##### Phase 3: Frontend Auth Integration ✅ COMPLETED

**Files modified**: `src/services/Api.tsx`, `src/components/UserHeader.tsx`

**Completed**:
1. ✅ API service includes JWT token in Authorization header (via `getAuthHeaders()`)
2. ✅ Logout button in UserHeader component
3. ✅ Added `authFetch` wrapper that handles 401 responses with redirect to login
4. ✅ Current user info displayed in UserHeader
5. ✅ Tests added: `src/tests/api.test.ts` (10 tests for 401 handling)

##### Phase 4: Testing & Verification ✅ COMPLETED

**Verified** (2026-01-15):
1. ✅ Registration flow: New users can register and receive JWT token
2. ✅ Login flow: Users can login with credentials and receive JWT token
3. ✅ Protected routes: Unit tests verify redirect to login (3 tests pass)
4. ✅ API 401: Without token returns `{"detail":"Not authenticated"}`
5. ✅ API 401: Invalid token returns `{"detail":"Could not validate credentials"}`
6. ✅ Team isolation: Users only see patients from their own team
7. ✅ Patient access: Authenticated users with team can access patient data

---

## Completed Tasks

### Task: Fix Railway Backend Deployment

**Priority**: Critical
**Status**: ✅ RESOLVED (2026-01-14)
**Assigned**: DevOps
**Resolution**: Option C (Disable config-as-code) + Environment variable fix
**Lessons Learned**: [001-railway-monorepo-deployment.md](docs/lessons-learned/001-railway-monorepo-deployment.md)

<details>
<summary>View Resolution Details</summary>

#### Problem Statement

The Railway backend service (energetic-trust) fails to build because Railway ignores the backend-specific `railway.toml` configuration and instead uses the root (frontend) configuration, causing it to build with the wrong Dockerfile.

#### Root Cause

Railway's config-as-code resolution prioritizes the repository root `railway.toml` over subdirectory configs, even when the service's "Root Directory" is set to `/backend`.

#### Resolution Steps Applied

1. **In Railway Dashboard (energetic-trust service)**:
   - Disabled config-as-code
   - Set Builder to "Dockerfile"
   - Set Dockerfile Path to `Dockerfile.railway`

2. **Configure Deploy Settings**:
   - Set Healthcheck Path to `/api/v1/health`
   - Set Healthcheck Timeout to `100`
   - Set Restart Policy to "On Failure" with 3 retries

3. **Frontend Configuration**:
   - Updated `API_BASE_URL` environment variable

</details>

---

## Success Criteria

### Deployment (Completed)
- [x] Backend builds successfully with Python 3.11 slim image
- [x] Backend passes health check at `/api/v1/health`
- [x] Backend connects to PostgreSQL and runs migrations
- [x] Frontend can reach backend API endpoints (via runtime config.js)

### Authentication (Completed)
- [x] Login page accessible at `/biotrack/login`
- [x] Registration page accessible at `/biotrack/register`
- [x] Unauthenticated users redirected to login
- [x] Patients API requires valid JWT token
- [x] Patients API filters by user's team_id
- [x] User can register, login, and access patient data
- [x] User can logout and is redirected to login
- [x] End-to-end testing verification (Phase 4)

---

## Related Documentation

- [Railway Deployment Progress](docs/RAILWAY_DEPLOYMENT_PROGRESS.md)
- [Lessons Learned](docs/lessons-learned/README.md)
- [Development Guide](DEVELOPMENT.md)
- [Database Architecture](DATABASE_ARCHITECTURE.md)

---

## Deployed Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | https://energetic-trust-production-0ccc.up.railway.app | React + Vite (nginx) |
| Backend | https://biotrack-production-a927.up.railway.app | FastAPI + PostgreSQL |
| Database | Internal Railway connection | PostgreSQL |

> **Note**: Service names are swapped in Railway (biotrack serves backend, energetic-trust serves frontend). See [lessons learned](docs/lessons-learned/001-railway-monorepo-deployment.md) for details.

---

## Tech Stack & Testing Requirements

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Context (AuthContext, TeamContext)
- **Routing**: React Router v7
- **Testing**: Vitest + React Testing Library

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy
- **Database**: PostgreSQL
- **Authentication**: JWT (python-jose) + bcrypt
- **Migrations**: Alembic
- **Testing**: pytest + httpx

### Testing Guidelines

All new features must include tests:

**Backend (pytest)**:
```bash
cd backend
pytest tests/ -v  # Run all tests
pytest tests/test_patients_auth.py -v  # Run specific test file
```

**Frontend (vitest)**:
```bash
npm run test  # Run all tests
npm run test -- src/tests/auth.test.tsx --run  # Run specific test file
npm run test:ui  # Run with interactive UI
```

**Test Requirements**:
- API endpoints: Test authentication (401 without token), authorization (team isolation), and CRUD operations
- Frontend: Test component rendering, user interactions, and auth flows
- New features require tests before merge to main branch
