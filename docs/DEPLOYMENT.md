# BioTrack Deployment Guide

This guide covers deploying BioTrack to Railway, the recommended platform for this application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Railway Deployment](#railway-deployment)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Post-Deployment](#post-deployment)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

- A [Railway](https://railway.app) account
- A GitHub account (for CI/CD)
- Your domain (optional, Railway provides free subdomains)
- Stripe account (for payments, optional)
- SendGrid account (for emails, optional)

---

## Railway Deployment

### Step 1: Create a New Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub repository
5. Select the `biotrack` repository

### Step 2: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will automatically provision the database
4. Copy the `DATABASE_URL` from the PostgreSQL service variables

### Step 3: Deploy Backend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. In the service settings:
   - **Root Directory**: `backend`
   - **Watch Paths**: `backend/**`
4. Add environment variables (see [Environment Variables](#environment-variables))
5. The backend will auto-deploy

### Step 4: Deploy Frontend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository again
3. In the service settings:
   - **Root Directory**: `/` (root)
   - **Watch Paths**: Leave empty or `src/**,public/**`
4. Add environment variables:
   - `VITE_API_BASE_URL`: Your backend URL (e.g., `https://biotrack-backend-production.up.railway.app/api/v1`)
5. The frontend will auto-deploy

### Step 5: Configure Networking

1. For each service, go to **Settings** → **Networking**
2. Click **"Generate Domain"** to get a public URL
3. Or add your custom domain

---

## Environment Variables

### Backend Variables (Required)

```bash
# Database (auto-provided by Railway PostgreSQL)
DATABASE_URL=postgresql://...

# Security (REQUIRED - generate with: openssl rand -hex 32)
SECRET_KEY=your-64-character-hex-string

# CORS (your frontend domain)
CORS_ORIGINS=https://your-frontend.up.railway.app

# Frontend URL for email links
FRONTEND_URL=https://your-frontend.up.railway.app
```

### Backend Variables (Optional)

```bash
# Email (SendGrid)
SENDGRID_API_KEY=SG.xxx
FROM_EMAIL=noreply@yourdomain.com

# Payments (Stripe)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_BASIC_PRICE_ID=price_xxx
STRIPE_PREMIUM_PRICE_ID=price_xxx

# JWT Settings
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
```

### Frontend Variables

```bash
# Backend API URL
VITE_API_BASE_URL=https://your-backend.up.railway.app/api/v1
```

### Generate SECRET_KEY

Run this command to generate a secure secret key:

```bash
openssl rand -hex 32
```

---

## Database Setup

### Run Migrations

After the backend is deployed, you need to run database migrations:

1. Go to your backend service in Railway
2. Open the **"Deploy"** tab
3. Click **"View Logs"** to ensure the app started
4. Open the service shell or use Railway CLI:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Run migrations
railway run --service biotrack-backend alembic upgrade head
```

### Seed Initial Data (Optional)

```bash
railway run --service biotrack-backend python seed_antibiotics.py
railway run --service biotrack-backend python seed_diagnostic_categories.py
```

---

## Post-Deployment

### Verify Deployment

1. **Backend Health Check**: Visit `https://your-backend.up.railway.app/api/v1/health`
   - Should return: `{"status": "healthy", "service": "biotrack-api"}`

2. **Database Connectivity**: Visit `https://your-backend.up.railway.app/api/v1/health/ready`
   - Should return: `{"status": "ready", "database": "connected"}`

3. **Frontend**: Visit your frontend URL
   - Should load the BioTrack application

### Set Up CI/CD

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Add secret: `RAILWAY_TOKEN`
   - Get this from Railway: **Account Settings** → **Tokens** → **Create Token**
3. Push to `main` branch to trigger automatic deployments

### Configure Custom Domain

1. In Railway, go to your service → **Settings** → **Networking**
2. Click **"+ Custom Domain"**
3. Enter your domain (e.g., `app.biotrack.com`)
4. Add the provided CNAME record to your DNS provider
5. Wait for SSL certificate provisioning (automatic)

---

## Troubleshooting

### Common Issues

#### "SECRET_KEY environment variable is required"

The backend requires a `SECRET_KEY` environment variable. Add it in Railway:
```
SECRET_KEY=<output of: openssl rand -hex 32>
```

#### CORS Errors

Ensure `CORS_ORIGINS` includes your frontend domain:
```
CORS_ORIGINS=https://your-frontend.up.railway.app
```

#### Database Connection Failed

1. Check that PostgreSQL service is running
2. Verify `DATABASE_URL` is correctly set
3. Check the health endpoint: `/api/v1/health/ready`

#### Frontend Shows Blank Page

1. Check browser console for errors
2. Verify `VITE_API_BASE_URL` points to your backend
3. Ensure backend CORS allows frontend origin

### View Logs

```bash
# Backend logs
railway logs --service biotrack-backend

# Frontend logs
railway logs --service biotrack-frontend
```

### Restart Services

In Railway dashboard, click **"Restart"** on any service to restart it.

---

## Cost Estimation

Railway pricing (as of 2024):

| Resource | Cost |
|----------|------|
| Starter Plan | $5/month (includes $5 credit) |
| PostgreSQL | ~$5-10/month |
| Backend Service | ~$5-10/month |
| Frontend Service | ~$2-5/month |
| **Total Estimated** | **$15-30/month** |

For hobby/testing: Railway's free tier includes $5/month credit, enough for light testing.

---

## Alternative Deployment Options

While Railway is recommended, BioTrack can also be deployed to:

- **Render**: Similar to Railway, good free tier
- **DigitalOcean App Platform**: More control, slightly more complex
- **Fly.io**: Global edge deployment
- **Self-hosted VPS**: Full control, requires more DevOps knowledge

For VPS deployment, use `docker-compose.prod.yml`:

```bash
# Copy environment file
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# Start services
docker-compose -f docker-compose.prod.yml up -d
```
