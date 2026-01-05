# BioTrack

A full-stack application for tracking patient diagnostics and antibiotic treatments.

## Structure

- `backend/`: FastAPI backend with PostgreSQL
- `frontend/`: React frontend (PWA capable)

## Development

Run with Docker Compose:

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Database: localhost:5432

## Deployment

- Backend: Deploy to Railway/Render with PostgreSQL
- Frontend: Deploy to Vercel/Netlify as PWA

## Splitting Repos

To split into separate repos:
1. Move `backend/` to `biotrack-backend` repo
2. Keep root as `biotrack-frontend` repo