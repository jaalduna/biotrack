from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Antibiotic as AntibioticModel
from ..schemas import Antibiotic, AntibioticCreate
from ..auth import get_current_user

router = APIRouter()


@router.get("/antibiotics", response_model=List[Antibiotic])
def read_antibiotics(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):
    antibiotics = (
        db.query(AntibioticModel).filter(AntibioticModel.is_active == True).all()
    )
    return antibiotics


@router.post("/antibiotics", response_model=Antibiotic)
def create_antibiotic(
    antibiotic: AntibioticCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_antibiotic = AntibioticModel(**antibiotic.dict())
    db.add(db_antibiotic)
    db.commit()
    db.refresh(db_antibiotic)
    return db_antibiotic


@router.get("/antibiotics/{antibiotic_id}", response_model=Antibiotic)
def read_antibiotic(
    antibiotic_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    antibiotic = (
        db.query(AntibioticModel).filter(AntibioticModel.id == antibiotic_id).first()
    )
    if antibiotic is None:
        raise HTTPException(status_code=404, detail="Antibiotic not found")
    return antibiotic


@router.put("/antibiotics/{antibiotic_id}", response_model=Antibiotic)
def update_antibiotic(
    antibiotic_id: str,
    antibiotic: AntibioticCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_antibiotic = (
        db.query(AntibioticModel).filter(AntibioticModel.id == antibiotic_id).first()
    )
    if db_antibiotic is None:
        raise HTTPException(status_code=404, detail="Antibiotic not found")
    for key, value in antibiotic.dict().items():
        setattr(db_antibiotic, key, value)
    db.commit()
    db.refresh(db_antibiotic)
    return db_antibiotic


@router.delete("/antibiotics/{antibiotic_id}")
def delete_antibiotic(
    antibiotic_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_antibiotic = (
        db.query(AntibioticModel).filter(AntibioticModel.id == antibiotic_id).first()
    )
    if db_antibiotic is None:
        raise HTTPException(status_code=404, detail="Antibiotic not found")
    db_antibiotic.is_active = False
    db.commit()
    return {"detail": "Antibiotic deleted"}
