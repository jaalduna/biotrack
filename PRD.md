# BioTrack Product Requirements Document (PRD)

## Overview

BioTrack is a full-stack medical application for tracking patient diagnostics and antibiotic treatments in hospital settings.

## Deployment Status

See [docs/RAILWAY_DEPLOYMENT_PROGRESS.md](docs/RAILWAY_DEPLOYMENT_PROGRESS.md) for detailed deployment progress and issue tracking.

---

## Current Tasks

### Task: Fix Railway Backend Deployment

**Priority**: Critical
**Status**: ✅ RESOLVED (2026-01-14)
**Assigned**: DevOps
**Resolution**: Option C (Disable config-as-code) + Environment variable fix
**Lessons Learned**: [001-railway-monorepo-deployment.md](docs/lessons-learned/001-railway-monorepo-deployment.md)

#### Problem Statement

The Railway backend service (energetic-trust) fails to build because Railway ignores the backend-specific `railway.toml` configuration and instead uses the root (frontend) configuration, causing it to build with the wrong Dockerfile.

#### Root Cause

Railway's config-as-code resolution prioritizes the repository root `railway.toml` over subdirectory configs, even when the service's "Root Directory" is set to `/backend`.

---

## Resolution Plan

### Option A: Remove dockerfilePath from root railway.toml (Recommended)

**Rationale**: If the root `railway.toml` doesn't specify a `dockerfilePath`, Railway may fall back to auto-detection within the service's root directory.

**Steps**:
1. Edit `/railway.toml` to remove the `dockerfilePath` directive
2. Rename `backend/Dockerfile.railway` back to `backend/Dockerfile`
3. Commit and push changes
4. Verify Railway builds with the correct Dockerfile

**Risk**: Low - Frontend service may need manual reconfiguration

---

### Option B: Use separate railway.toml files with unique names

**Rationale**: Avoid conflict by using distinctly named config files for each service.

**Steps**:
1. Rename `/railway.toml` → `/railway.frontend.toml`
2. Rename `/backend/railway.toml` → `/backend/railway.backend.toml`
3. Configure each Railway service to use its specific config file path
4. Commit and push changes

**Risk**: Medium - Requires UI changes in Railway dashboard for both services

---

### Option C: Disable config-as-code and use Railway UI settings only

**Rationale**: Eliminate config file conflicts by managing all settings through Railway's dashboard.

**Steps**:
1. Delete both `railway.toml` files or set `enableConfigAsCode = false`
2. Configure backend service settings manually:
   - Builder: Dockerfile
   - Dockerfile Path: `Dockerfile.railway` (or rename to `Dockerfile`)
   - Health Check Path: `/api/v1/health`
   - Health Check Timeout: 100s
   - Restart Policy: On Failure (3 retries)
3. Verify frontend service settings remain correct
4. Trigger redeploy

**Risk**: Low - Settings are explicit and not subject to file resolution issues

---

### Option D: Consolidate to monorepo-aware railway.toml

**Rationale**: Use Railway's service-specific configuration blocks in a single file.

**Steps**:
1. Create a single `railway.toml` at root with service-specific sections:
```toml
# Frontend service configuration
[services.biotrack]
dockerfilePath = "Dockerfile"
healthcheckPath = "/"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3

# Backend service configuration
[services.energetic-trust]
rootDirectory = "backend"
dockerfilePath = "backend/Dockerfile.railway"
healthcheckPath = "/api/v1/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 3
```
2. Delete `/backend/railway.toml`
3. Commit and push changes

**Risk**: Medium - Requires validation that Railway supports this format

---

## Recommended Action Plan

Execute **Option C** first as it has the lowest risk and most direct control:

### Step-by-Step Instructions

1. **In Railway Dashboard (energetic-trust service)**:
   - Go to Settings → Config-as-code
   - Set Railway config file path to empty/none (disable config-as-code)

2. **Configure Build Settings**:
   - Go to Settings → Build
   - Verify Builder is "Dockerfile"
   - If there's a Dockerfile Path field, set it to `Dockerfile.railway`

3. **Configure Deploy Settings**:
   - Go to Settings → Deploy
   - Set Healthcheck Path to `/api/v1/health`
   - Set Healthcheck Timeout to `100`
   - Set Restart Policy to "On Failure" with 3 retries

4. **Trigger Redeploy**:
   - Go to Deployments
   - Click "Redeploy" on the latest deployment or trigger a new one

5. **Verify**:
   - Check build logs show `python:3.11-slim` base image
   - Check health endpoint responds: `curl https://energetic-trust-production-0ccc.up.railway.app/api/v1/health`

6. **If successful, configure frontend**:
   - Update `biotrack` service's `API_BASE_URL` environment variable
   - Set to: `https://energetic-trust-production-0ccc.up.railway.app/api/v1`

---

## Success Criteria

- [x] Backend builds successfully with Python 3.11 slim image
- [x] Backend passes health check at `/api/v1/health`
- [x] Backend connects to PostgreSQL and runs migrations
- [x] Frontend can reach backend API endpoints (via runtime config.js)
- [ ] User authentication works end-to-end (needs manual verification)

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
