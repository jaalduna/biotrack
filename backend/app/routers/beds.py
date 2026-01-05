from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Bed as BedModel
from ..schemas import Bed, BedCreate

router = APIRouter()

@router.get("/beds", response_model=List[Bed])
def read_beds(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    beds = db.query(BedModel).offset(skip).limit(limit).all()
    return beds

@router.post("/beds", response_model=Bed)
def create_bed(bed: BedCreate, db: Session = Depends(get_db)):
    db_bed = BedModel(**bed.dict())
    db.add(db_bed)
    db.commit()
    db.refresh(db_bed)
    return db_bed