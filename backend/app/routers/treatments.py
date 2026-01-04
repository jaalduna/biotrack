from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from ..database import get_db
from ..models import Treatment as TreatmentModel, Patient as PatientModel
from ..schemas import Treatment, TreatmentCreate
from ..auth import get_current_user

router = APIRouter()

@router.get("/treatments", response_model=List[Treatment])
def read_treatments(patient_id: UUID = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    query = db.query(TreatmentModel)
    
    # If patient_id is provided, filter by patient
    if patient_id:
        # Verify patient belongs to user's team
        patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        query = query.filter(TreatmentModel.patient_id == patient_id)
    
    treatments = query.offset(skip).limit(limit).all()
    return treatments

@router.post("/treatments", response_model=Treatment)
def create_treatment(treatment: TreatmentCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Verify patient exists
    patient = db.query(PatientModel).filter(PatientModel.id == treatment.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    db_treatment = TreatmentModel(
        **treatment.dict(),
        created_by_user_id=current_user.id
    )
    db.add(db_treatment)
    db.commit()
    db.refresh(db_treatment)
    return db_treatment

@router.get("/treatments/{treatment_id}", response_model=Treatment)
def read_treatment(treatment_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    treatment = db.query(TreatmentModel).filter(TreatmentModel.id == treatment_id).first()
    if treatment is None:
        raise HTTPException(status_code=404, detail="Treatment not found")
    return treatment

@router.put("/treatments/{treatment_id}", response_model=Treatment)
def update_treatment(treatment_id: str, treatment: TreatmentCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_treatment = db.query(TreatmentModel).filter(TreatmentModel.id == treatment_id).first()
    if db_treatment is None:
        raise HTTPException(status_code=404, detail="Treatment not found")
    for key, value in treatment.dict().items():
        if key != "patient_id":  # Don't allow changing patient
            setattr(db_treatment, key, value)
    db.commit()
    db.refresh(db_treatment)
    return db_treatment

@router.delete("/treatments/{treatment_id}")
def delete_treatment(treatment_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_treatment = db.query(TreatmentModel).filter(TreatmentModel.id == treatment_id).first()
    if db_treatment is None:
        raise HTTPException(status_code=404, detail="Treatment not found")
    db.delete(db_treatment)
    db.commit()
    return {"detail": "Treatment deleted"}