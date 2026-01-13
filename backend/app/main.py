import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from .database import engine, SessionLocal
from .models import Base
from .routers import (
    patients,
    diagnostics,
    treatments,
    units,
    beds,
    bed_configurations,
    bed_history,
    auth,
    teams,
    invitations,
    subscriptions,
    antibiotics,
    diagnostic_categories,
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="BioTrack API", version="1.0.0")

# CORS configuration from environment
def get_cors_origins() -> list[str]:
    """Get CORS origins from environment variable or use defaults."""
    cors_origins = os.getenv("CORS_ORIGINS", "")
    if cors_origins:
        return [origin.strip() for origin in cors_origins.split(",")]
    # Default development origins
    return [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(patients.router, prefix="/api/v1", tags=["patients"])
app.include_router(diagnostics.router, prefix="/api/v1", tags=["diagnostics"])
app.include_router(treatments.router, prefix="/api/v1", tags=["treatments"])
app.include_router(units.router, prefix="/api/v1", tags=["units"])
app.include_router(beds.router, prefix="/api/v1", tags=["beds"])
app.include_router(
    bed_configurations.router, prefix="/api/v1", tags=["bed_configurations"]
)
app.include_router(bed_history.router, prefix="/api/v1", tags=["bed_history"])
app.include_router(teams.router, prefix="/api/v1", tags=["teams"])
app.include_router(invitations.router, prefix="/api/v1", tags=["invitations"])
app.include_router(subscriptions.router, prefix="/api/v1", tags=["subscriptions"])
app.include_router(antibiotics.router, prefix="/api/v1", tags=["antibiotics"])
app.include_router(
    diagnostic_categories.router, prefix="/api/v1", tags=["diagnostic_categories"]
)


@app.get("/")
def read_root():
    return {"message": "BioTrack API is running"}


@app.get("/api/v1/health")
def health_check():
    """Health check endpoint for load balancers and container orchestration."""
    return {"status": "healthy", "service": "biotrack-api"}


@app.get("/api/v1/health/ready")
def readiness_check():
    """Readiness check - verifies database connectivity."""
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        return {"status": "not_ready", "database": "disconnected", "error": str(e)}
