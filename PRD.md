# BioTrack Product Requirements Document (PRD)

## Overview

BioTrack is a full-stack medical application for tracking patient diagnostics and antibiotic treatments in hospital settings.

## Deployment Status

See [docs/RAILWAY_DEPLOYMENT_PROGRESS.md](docs/RAILWAY_DEPLOYMENT_PROGRESS.md) for detailed deployment progress and issue tracking.

---

## Current Tasks

### Task: Implement Authentication for Beta Release

**Priority**: Critical
**Status**: 🔄 IN PROGRESS
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
| LoginPage UI | ✅ Built | `src/pages/LoginPage.tsx` exists but not routed |
| AuthContext | ✅ Built | JWT handling, login/register functions ready |
| Patients API | ❌ Unprotected | No `get_current_user`, no `team_id` filtering |
| Frontend routes | ❌ Unprotected | No authentication guard |

#### Implementation Plan

##### Phase 1: Wire Up Authentication Routes (Frontend)

**Files to modify**: `src/router/router.app.tsx`

**Steps**:
1. Add public routes for `/login` and `/register`
2. Create `RegisterPage.tsx` (or use existing if available)
3. Add route protection wrapper for authenticated routes
4. Redirect unauthenticated users to `/login`

##### Phase 2: Secure Patients API (Backend - Critical)

**Files to modify**: `backend/app/routers/patients.py`

**Steps**:
1. Import `get_current_user` from `..auth`
2. Add `current_user = Depends(get_current_user)` to all endpoints
3. Add `team_id` filtering to all queries:
   ```python
   .filter(PatientModel.team_id == current_user.team_id)
   ```
4. Update create endpoint to set `team_id` from current user

##### Phase 3: Frontend Auth Integration

**Files to modify**: `src/services/Api.tsx`, `src/components/AppLayout.tsx`

**Steps**:
1. Ensure API service includes JWT token in Authorization header
2. Add logout button to AppLayout
3. Handle 401 responses (redirect to login)
4. Display current user info in UI

##### Phase 4: Testing & Verification

**Steps**:
1. Test registration flow end-to-end
2. Test login flow end-to-end
3. Verify protected routes redirect to login
4. Verify API returns 401 without valid token
5. Verify team_id isolation (users only see their team's patients)

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

### Authentication (In Progress)
- [ ] Login page accessible at `/biotrack/login`
- [ ] Registration page accessible at `/biotrack/register`
- [ ] Unauthenticated users redirected to login
- [ ] Patients API requires valid JWT token
- [ ] Patients API filters by user's team_id
- [ ] User can register, login, and access patient data
- [ ] User can logout and is redirected to login

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
