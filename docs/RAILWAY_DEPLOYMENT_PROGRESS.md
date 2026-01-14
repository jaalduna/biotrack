# Railway Deployment Progress Report

**Date**: January 14, 2026
**Status**: Backend deployment failing, Frontend deployed but not functional

## Overview

This document tracks the deployment progress of BioTrack to Railway. The application consists of:
- **Frontend**: React + Vite application (service: `biotrack`)
- **Backend**: FastAPI + PostgreSQL API (service: `energetic-trust`)
- **Database**: Railway PostgreSQL (service: `Postgres`)

## Current State

| Service | Status | URL |
|---------|--------|-----|
| Frontend (biotrack) | ✅ Deployed | https://biotrack-production-a927.up.railway.app |
| Backend (energetic-trust) | ❌ Build Failing | https://energetic-trust-production-0ccc.up.railway.app |
| PostgreSQL | ✅ Online | Internal railway connection |

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

## File Structure

```
biotrack/
├── Dockerfile                    # Frontend Dockerfile (nginx)
├── docker-entrypoint.sh          # Frontend entrypoint
├── nginx.conf                    # Frontend nginx config
├── railway.toml                  # Frontend Railway config
├── backend/
│   ├── Dockerfile.railway        # Backend Dockerfile (python)
│   ├── railway.toml              # Backend Railway config (IGNORED by Railway)
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
