from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Unit as UnitModel
from ..schemas import Unit, UnitCreate

router = APIRouter()


@router.get("/units", response_model=List[Unit])
def read_units(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    units = db.query(UnitModel).offset(skip).limit(limit).all()
    return units


@router.post("/units", response_model=Unit)
def create_unit(unit: UnitCreate, db: Session = Depends(get_db)):
    db_unit = UnitModel(**unit.dict())
    db.add(db_unit)
    db.commit()
    db.refresh(db_unit)
    return db_unit


@router.put("/units/{unit_id}", response_model=Unit)
def update_unit(unit_id: str, unit: UnitCreate, db: Session = Depends(get_db)):
    db_unit = db.query(UnitModel).filter(UnitModel.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    for key, value in unit.dict().items():
        setattr(db_unit, key, value)

    db.commit()
    db.refresh(db_unit)
    return db_unit


@router.delete("/units/{unit_id}")
def delete_unit(unit_id: str, db: Session = Depends(get_db)):
    db_unit = db.query(UnitModel).filter(UnitModel.id == unit_id).first()
    if not db_unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    db.delete(db_unit)
    db.commit()
    return {"message": "Unit deleted successfully"}
