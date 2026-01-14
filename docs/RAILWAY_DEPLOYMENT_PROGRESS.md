# Railway Deployment Progress Report

**Date**: January 14, 2026
**Status**: Both services deployed - URLs swapped, needs env var fix

## Overview

This document tracks the deployment progress of BioTrack to Railway. The application consists of:
- **Frontend**: React + Vite application (service: `biotrack`)
- **Backend**: FastAPI + PostgreSQL API (service: `energetic-trust`)
- **Database**: Railway PostgreSQL (service: `Postgres`)

## Current State

| Service | Status | URL | Note |
|---------|--------|-----|------|
| biotrack | ✅ Deployed | https://biotrack-production-a927.up.railway.app | Serving Backend (swapped) |
| energetic-trust | ✅ Deployed | https://energetic-trust-production-0ccc.up.railway.app | Serving Frontend (swapped) |
| PostgreSQL | ✅ Online | Internal railway connection | |

## Problem Description

### Root Cause: Config-as-Code File Resolution

Railway is ignoring the backend-specific `railway.toml` and using the root (frontend) configuration instead.

**Evidence from build logs:**
```
found 'railway.toml' at 'backend/railway.toml'
found config-as-code file at 'railway.toml'
using selected config-as-code file 'railway.toml' (ignoring 'backend/railway.toml')
```

This causes Railway to use:
- **Wrong Dockerfile**: Frontend's `Dockerfile` (nginx + node) instead of backend's `Dockerfile.railway` (python)
- **Wrong health check**: `/` instead of `/api/v1/health`

### Build Error

```
Build Failed: build daemon returned an error
failed to solve: failed to compute cache key:
"/docker-entrypoint.sh": not found
```

The build is attempting to copy `docker-entrypoint.sh` which exists in the frontend root but not in the backend directory.

## Deployment Attempts

### Attempt 1: Rename Dockerfile.backend to Dockerfile
- **Action**: Renamed `backend/Dockerfile.backend` → `backend/Dockerfile`
- **Result**: ❌ Failed - Railway still used root Dockerfile

### Attempt 2: Change branch to develop
- **Action**: Set deployment branch to `develop` in Railway settings
- **Result**: ❌ Failed - Same error persisted

### Attempt 3: Set config file path to backend/railway.toml
- **Action**: Changed Railway config file path to `/backend/railway.toml`
- **Result**: ❌ Failed - Railway UI showed "The value is set in /railway.toml" (still reading root)

### Attempt 4: Use relative config file path
- **Action**: Changed config file path to `railway.toml` (relative)
- **Result**: ❌ Failed - Railway resolved this to root `/railway.toml`

### Attempt 5: Rename to Dockerfile.railway with explicit dockerfilePath
- **Action**:
  - Renamed `backend/Dockerfile` → `backend/Dockerfile.railway`
  - Updated `backend/railway.toml` with `dockerfilePath = "Dockerfile.railway"`
- **Result**: ❌ Failed - Railway ignored `backend/railway.toml`, still used root config

### Attempt 6: Disable config-as-code in UI + rename Dockerfile
- **Action**:
  - Cleared "Railway config file path" in Railway UI
  - Renamed `backend/Dockerfile.railway` → `backend/Dockerfile`
- **Result**: ❌ Failed - Railway now correctly uses `backend/railway.toml` but config still pointed to old filename
- **Build log**: "ignoring less specific config file for railway.toml, ignored: 'railway.toml' will keep: 'backend/railway.toml'"
- **Error**: "couldn't locate the dockerfile at path Dockerfile.railway in code archive"

### Attempt 7: Fix dockerfilePath in backend/railway.toml
- **Action**:
  - Updated `backend/railway.toml` to use `dockerfilePath = "Dockerfile"` instead of `dockerfilePath = "Dockerfile.railway"`
  - Committed and pushed to `develop` branch
- **Result**: ✅ Build succeeded! But service URLs are swapped

## Current State (Updated)

Both services deployed successfully, but URLs are reversed:

| Service Name | URL | Actually Serving |
|--------------|-----|------------------|
| biotrack | https://biotrack-production-a927.up.railway.app | Backend (FastAPI) ✅ |
| energetic-trust | https://energetic-trust-production-0ccc.up.railway.app | Frontend (nginx) ✅ |

**Health check verification:**
```bash
$ curl https://biotrack-production-a927.up.railway.app/api/v1/health
{"status":"healthy","service":"biotrack-api"}
```

## Next Step

Update frontend's `API_BASE_URL` environment variable to point to the correct backend URL:
- Service: `energetic-trust` (the frontend)
- Variable: `API_BASE_URL`
- Value: `https://biotrack-production-a927.up.railway.app/api/v1`

## File Structure

```
biotrack/
├── Dockerfile                    # Frontend Dockerfile (nginx)
├── docker-entrypoint.sh          # Frontend entrypoint
├── nginx.conf                    # Frontend nginx config
├── railway.toml                  # Frontend Railway config
├── backend/
│   ├── Dockerfile                # Backend Dockerfile (python)
│   ├── railway.toml              # Backend Railway config (now being used)
│   ├── start.sh                  # Backend startup script
│   └── requirements.txt
└── src/                          # Frontend React code
```

## Current Railway Settings (energetic-trust service)

| Setting | Value |
|---------|-------|
| Source Repo | jaalduna/biotrack |
| Root Directory | /backend |
| Branch | develop |
| Config File Path | railway.toml |
| Builder | Dockerfile |

## Key Insight

Railway's config-as-code resolution always prioritizes files at the repository root, regardless of the "Root Directory" setting. The `railway.toml` path is resolved from the repo root, not from the service's root directory.

## Environment Variables (Backend)

The following variables are configured on the energetic-trust service:

| Variable | Value |
|----------|-------|
| DATABASE_URL | `${{Postgres.DATABASE_URL}}` |
| SECRET_KEY | (configured) |
| ALGORITHM | HS256 |
| ACCESS_TOKEN_EXPIRE_MINUTES | 10080 |
| ALLOWED_ORIGINS | https://biotrack-production-a927.up.railway.app |

## Next Steps

See [PRD.md](../PRD.md) for the resolution plan.
