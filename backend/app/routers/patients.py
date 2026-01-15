from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Patient as PatientModel, User
from ..schemas import Patient, PatientCreate
from ..auth import get_current_user

router = APIRouter()


@router.get("/patients", response_model=List[Patient])
async def read_patients(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PatientModel)
    # Filter by team_id if user belongs to a team
    if current_user.team_id:
        query = query.filter(PatientModel.team_id == current_user.team_id)
    patients = query.offset(skip).limit(limit).all()
    return patients


@router.post("/patients", response_model=Patient)
async def create_patient(
    patient: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    patient_data = patient.dict()
    # Set team_id from current user
    patient_data["team_id"] = current_user.team_id
    db_patient = PatientModel(**patient_data)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient


@router.get("/patients/{patient_id}", response_model=Patient)
async def read_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PatientModel).filter(PatientModel.id == patient_id)
    # Filter by team_id if user belongs to a team
    if current_user.team_id:
        query = query.filter(PatientModel.team_id == current_user.team_id)
    patient = query.first()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.put("/patients/{patient_id}", response_model=Patient)
async def update_patient(
    patient_id: str,
    patient: PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PatientModel).filter(PatientModel.id == patient_id)
    # Filter by team_id if user belongs to a team
    if current_user.team_id:
        query = query.filter(PatientModel.team_id == current_user.team_id)
    db_patient = query.first()
    if db_patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    for key, value in patient.dict().items():
        setattr(db_patient, key, value)
    db.commit()
    db.refresh(db_patient)
    return db_patient


@router.delete("/patients/{patient_id}")
async def delete_patient(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PatientModel).filter(PatientModel.id == patient_id)
    # Filter by team_id if user belongs to a team
    if current_user.team_id:
        query = query.filter(PatientModel.team_id == current_user.team_id)
    patient = query.first()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    db.delete(patient)
    db.commit()
    return {"message": "Patient deleted"}