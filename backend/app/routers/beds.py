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


@router.put("/beds/{bed_id}", response_model=Bed)
def update_bed(bed_id: str, bed: BedCreate, db: Session = Depends(get_db)):
    db_bed = db.query(BedModel).filter(BedModel.id == bed_id).first()
    if not db_bed:
        raise HTTPException(status_code=404, detail="Bed not found")

    for key, value in bed.dict().items():
        setattr(db_bed, key, value)

    db.commit()
    db.refresh(db_bed)
    return db_bed


@router.delete("/beds/{bed_id}")
def delete_bed(bed_id: str, db: Session = Depends(get_db)):
    db_bed = db.query(BedModel).filter(BedModel.id == bed_id).first()
    if not db_bed:
        raise HTTPException(status_code=404, detail="Bed not found")

    db.delete(db_bed)
    db.commit()
    return {"message": "Bed deleted successfully"}
