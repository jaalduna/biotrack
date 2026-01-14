# Lesson Learned: Railway Monorepo Deployment Configuration

**Date**: January 14, 2026
**Category**: DevOps / Deployment
**Severity**: Critical (blocked production deployment)
**Time to Resolution**: ~2 hours
**Related PRD**: [PRD.md](../../PRD.md)
**Deployment Progress**: [RAILWAY_DEPLOYMENT_PROGRESS.md](../RAILWAY_DEPLOYMENT_PROGRESS.md)

---

## Executive Summary

Railway's config-as-code resolution in monorepos does NOT respect the service's "Root Directory" setting. The platform resolves `railway.toml` paths from the repository root, causing services to use incorrect Dockerfiles and configurations when multiple services exist in the same repository.

---

## Problem Description

### Symptoms
- Backend service builds failed with errors like `nginx.conf not found` or `docker-entrypoint.sh not found`
- Build logs showed Railway using frontend's Dockerfile instead of backend's
- Multiple deployment attempts failed despite correct-looking configuration

### Root Cause
Railway has a **two-phase config resolution** that is not well documented:

1. **Config File Discovery**: Railway searches for `railway.toml` files and applies specificity rules
2. **Config File Selection**: The selected config's paths (like `dockerfilePath`) are resolved relative to the config file location

**Critical Insight**: When "Root Directory" is set to `/backend`, Railway does NOT look for `railway.toml` inside `/backend` first. It still prioritizes the repository root config.

### Build Log Evidence
```
found 'railway.toml' at 'backend/railway.toml'
found config-as-code file at 'railway.toml'
using selected config-as-code file 'railway.toml' (ignoring 'backend/railway.toml')
```

This log clearly shows Railway found both configs but **chose the root one**.

---

## Resolution Journey

| Attempt | Action | Result | Learning |
|---------|--------|--------|----------|
| 1 | Rename Dockerfile.backend → Dockerfile | ❌ Failed | Dockerfile naming doesn't matter if wrong config is used |
| 2 | Change branch to develop | ❌ Failed | Branch doesn't affect config resolution |
| 3 | Set config path to `/backend/railway.toml` | ❌ Failed | UI shows "value set in /railway.toml" - root overrides |
| 4 | Use relative config path `railway.toml` | ❌ Failed | Resolves to root, not service directory |
| 5 | Rename to `Dockerfile.railway` + explicit path | ❌ Failed | Root config still takes precedence |
| 6 | Disable config-as-code in UI | ❌ Partial | Changed behavior! Now uses `backend/railway.toml` but old path |
| 7 | Fix `dockerfilePath` in backend config | ✅ Success | Config now points to correct Dockerfile |

**Key Breakthrough**: Disabling config-as-code in Railway UI changed the resolution behavior, causing Railway to use the more specific `backend/railway.toml` instead of root.

---

## Solution Applied

### Option C from PRD.md: Disable Config-as-Code + Manual Configuration

1. **Railway UI**: Cleared "Railway config file path" to disable config-as-code for the backend service
2. **Config Update**: Changed `backend/railway.toml`:
   ```toml
   [build]
   dockerfilePath = "Dockerfile"  # Was "Dockerfile.railway"
   ```
3. **Environment Variable**: Updated `VITE_API_BASE_URL` to point to correct backend URL
4. **Redeploy**: Triggered frontend redeploy to pick up new environment variable

---

## Diagnostic Workflow

### When Railway Build Fails

```
┌─────────────────────────────────────────────────────────────┐
│                    BUILD FAILURE                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Check Build Logs for Config Resolution             │
│                                                             │
│  Look for lines like:                                       │
│  - "found config-as-code file at..."                        │
│  - "using selected config-as-code file..."                  │
│  - "ignoring '...' will keep: '...'"                        │
└─────────────────────────────────────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
┌─────────────────────────┐   ┌─────────────────────────┐
│ Wrong config selected?  │   │ Correct config selected │
│                         │   │ but wrong Dockerfile?   │
│ → Disable config-as-code│   │                         │
│   in Railway UI         │   │ → Check dockerfilePath  │
│ → Or use Option D:      │   │   in railway.toml       │
│   consolidated config   │   │ → Verify file exists    │
└─────────────────────────┘   └─────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Verify Dockerfile Content                          │
│                                                             │
│  Check base image in logs:                                  │
│  - Python service should show: FROM python:3.11-slim        │
│  - Frontend should show: FROM node:... or FROM nginx:...    │
│                                                             │
│  If wrong base image → wrong Dockerfile is being used       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: After Successful Build - Verify Deployment         │
│                                                             │
│  curl <service-url>/api/v1/health   # For backend           │
│  curl <service-url>/                # Check HTML for frontend│
│                                                             │
│  If responses are swapped → services deployed to wrong URLs │
└─────────────────────────────────────────────────────────────┘
```

### Quick Diagnostic Commands

```bash
# Check which service is actually running at a URL
curl -s <url>/api/v1/health  # Should return JSON for backend
curl -s <url>/ | head -5     # Should return HTML for frontend

# Check frontend's runtime config
curl -s <frontend-url>/config.js  # Should show API_BASE_URL

# Check response headers for clues
curl -s -I <url> | grep -i "content-type\|server"
```

---

## Prevention Checklist

### Before Deploying Monorepo to Railway

- [ ] **Config File Audit**: List all `railway.toml` files and their `dockerfilePath` values
- [ ] **Dockerfile Naming**: Ensure Dockerfiles have unique, descriptive names if multiple exist
- [ ] **Root Directory**: Verify each service's "Root Directory" in Railway UI
- [ ] **Config-as-Code Setting**: Decide whether to use config files or UI-only settings
- [ ] **Environment Variables**: Pre-configure all required env vars before first deploy

### After Each Deployment

- [ ] **Build Logs**: Verify correct config file and Dockerfile were used
- [ ] **Health Check**: Curl health endpoints to verify correct service deployed
- [ ] **Runtime Config**: For frontend, verify `config.js` has correct API URL
- [ ] **End-to-End Test**: Try login or basic API call to verify connectivity

---

## Railway Configuration Options for Monorepos

### Option A: Remove Root Config (Low Risk)
- Delete `dockerfilePath` from root `railway.toml`
- Let Railway auto-detect Dockerfiles per service
- **Pro**: Simple
- **Con**: Less explicit control

### Option B: Unique Config Names (Medium Risk)
- `railway.frontend.toml`, `railway.backend.toml`
- Configure each service to use its specific config
- **Pro**: Clear separation
- **Con**: Requires UI configuration for each service

### Option C: Disable Config-as-Code (Low Risk) ✅ USED
- Clear config file path in Railway UI
- Configure build settings manually in UI
- **Pro**: Most explicit control, avoids resolution issues
- **Con**: Settings not in version control

### Option D: Consolidated Config (Medium Risk)
- Single `railway.toml` with service-specific sections:
  ```toml
  [services.frontend]
  dockerfilePath = "Dockerfile"

  [services.backend]
  rootDirectory = "backend"
  dockerfilePath = "backend/Dockerfile"
  ```
- **Pro**: All config in one place
- **Con**: Requires validation that Railway supports this format

---

## Related Files

| File | Purpose |
|------|---------|
| `/railway.toml` | Frontend Railway config |
| `/backend/railway.toml` | Backend Railway config |
| `/Dockerfile` | Frontend Dockerfile (nginx) |
| `/backend/Dockerfile` | Backend Dockerfile (Python) |
| `/docker-entrypoint.sh` | Frontend runtime config injection |
| `/backend/start.sh` | Backend startup (migrations + uvicorn) |

---

## Tags

`#railway` `#deployment` `#monorepo` `#docker` `#config-as-code` `#devops` `#debugging`

---

## References

- [Railway Config-as-Code Docs](https://docs.railway.app/deploy/config-as-code)
- [Railway Monorepo Setup](https://docs.railway.app/deploy/monorepo)
- [PRD.md - Resolution Options](../../PRD.md)
