from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from ..database import get_db
from ..models import Diagnostic as DiagnosticModel, Patient as PatientModel
from ..schemas import Diagnostic, DiagnosticCreate
from ..auth import get_current_user

router = APIRouter()

@router.get("/diagnostics", response_model=List[Diagnostic])
def read_diagnostics(patient_id: Optional[UUID] = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    query = db.query(DiagnosticModel)
    
    # If patient_id is provided, filter by patient
    if patient_id:
        # Verify patient exists
        patient = db.query(PatientModel).filter(PatientModel.id == patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        query = query.filter(DiagnosticModel.patient_id == patient_id)
    
    diagnostics = query.offset(skip).limit(limit).all()
    return diagnostics

@router.post("/diagnostics", response_model=Diagnostic)
def create_diagnostic(diagnostic: DiagnosticCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Verify patient exists
    patient = db.query(PatientModel).filter(PatientModel.id == diagnostic.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    db_diagnostic = DiagnosticModel(
        **diagnostic.dict(),
        created_by_user_id=current_user.id
    )
    db.add(db_diagnostic)
    db.commit()
    db.refresh(db_diagnostic)
    return db_diagnostic

@router.get("/diagnostics/{diagnostic_id}", response_model=Diagnostic)
def read_diagnostic(diagnostic_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    diagnostic = db.query(DiagnosticModel).filter(DiagnosticModel.id == diagnostic_id).first()
    if diagnostic is None:
        raise HTTPException(status_code=404, detail="Diagnostic not found")
    return diagnostic

@router.put("/diagnostics/{diagnostic_id}", response_model=Diagnostic)
def update_diagnostic(diagnostic_id: str, diagnostic: DiagnosticCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_diagnostic = db.query(DiagnosticModel).filter(DiagnosticModel.id == diagnostic_id).first()
    if db_diagnostic is None:
        raise HTTPException(status_code=404, detail="Diagnostic not found")
    for key, value in diagnostic.dict().items():
        if key != "patient_id":  # Don't allow changing patient
            setattr(db_diagnostic, key, value)
    db.commit()
    db.refresh(db_diagnostic)
    return db_diagnostic

@router.delete("/diagnostics/{diagnostic_id}")
def delete_diagnostic(diagnostic_id: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_diagnostic = db.query(DiagnosticModel).filter(DiagnosticModel.id == diagnostic_id).first()
    if db_diagnostic is None:
        raise HTTPException(status_code=404, detail="Diagnostic not found")
    db.delete(db_diagnostic)
    db.commit()
    return {"detail": "Diagnostic deleted"}