from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from .models import Base
from .routers import (
    patients,
    diagnostics,
    treatments,
    units,
    beds,
    bed_history,
    auth,
    teams,
    invitations,
    subscriptions,
    antibiotics,
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="BioTrack API", version="1.0.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://your-frontend-domain.com",
    ],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(patients.router, prefix="/api/v1", tags=["patients"])
app.include_router(diagnostics.router, prefix="/api/v1", tags=["diagnostics"])
app.include_router(treatments.router, prefix="/api/v1", tags=["treatments"])
app.include_router(units.router, prefix="/api/v1", tags=["units"])
app.include_router(beds.router, prefix="/api/v1", tags=["beds"])
app.include_router(bed_history.router, prefix="/api/v1", tags=["bed_history"])
app.include_router(teams.router, prefix="/api/v1", tags=["teams"])
app.include_router(invitations.router, prefix="/api/v1", tags=["invitations"])
app.include_router(subscriptions.router, prefix="/api/v1", tags=["subscriptions"])
app.include_router(antibiotics.router, prefix="/api/v1", tags=["antibiotics"])


@app.get("/")
def read_root():
    return {"message": "BioTrack API is running"}
