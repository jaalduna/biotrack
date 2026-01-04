from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from ..database import get_db
from ..models import BedHistory as BedHistoryModel, Patient as PatientModel
from ..schemas import BedHistory, BedHistoryCreate
from ..auth import get_current_user

router = APIRouter()

@router.get("/bed-history", response_model=List[BedHistory])
def read_bed_history(patient_id: Optional[UUID] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    query = db.query(BedHistoryModel)
    
    # If patient_id is provided, filter by patient
    if patient_id:
        # Verify patient exists
        patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        query = query.filter(BedHistoryModel.patient_id == patient_id)
    
    bed_history = query.offset(skip).limit(limit).all()
    return bed_history

@router.post("/bed-history", response_model=BedHistory)
def create_bed_history(bed_history: BedHistoryCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Verify patient exists
    patient = db.query(PatientModel).filter(PatientModel.id == bed_history.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    db_bed_history = BedHistoryModel(**bed_history.dict())
    db.add(db_bed_history)
    db.commit()
    db.refresh(db_bed_history)
    return db_bed_history

@router.get("/bed-history/{bed_history_id}", response_model=BedHistory)
def read_bed_history_entry(bed_history_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    bed_history = db.query(BedHistoryModel).filter(BedHistoryModel.id == bed_history_id).first()
    if bed_history is None:
        raise HTTPException(status_code=404, detail="Bed history entry not found")
    return bed_history

@router.put("/bed-history/{bed_history_id}", response_model=BedHistory)
def update_bed_history(bed_history_id: str, bed_history: BedHistoryCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_bed_history = db.query(BedHistoryModel).filter(BedHistoryModel.id == bed_history_id).first()
    if db_bed_history is None:
        raise HTTPException(status_code=404, detail="Bed history entry not found")
    for key, value in bed_history.dict().items():
        if key != "patient_id":  # Don't allow changing patient
            setattr(db_bed_history, key, value)
    db.commit()
    db.refresh(db_bed_history)
    return db_bed_history

@router.delete("/bed-history/{bed_history_id}")
def delete_bed_history(bed_history_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_bed_history = db.query(BedHistoryModel).filter(BedHistoryModel.id == bed_history_id).first()
    if db_bed_history is None:
        raise HTTPException(status_code=404, detail="Bed history entry not found")
    db.delete(db_bed_history)
    db.commit()
    return {"detail": "Bed history entry deleted"}