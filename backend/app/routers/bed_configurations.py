from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import Unit, Bed
from pydantic import BaseModel

router = APIRouter()


class BedConfigurationBase(BaseModel):
    unit: str
    bedCount: int
    startNumber: int
    endNumber: int


class BedConfiguration(BedConfigurationBase):
    id: str


class BedConfigurationCreate(BedConfigurationBase):
    pass


class BedConfigurationUpdate(BaseModel):
    unit: Optional[str] = None
    bedCount: Optional[int] = None
    startNumber: Optional[int] = None
    endNumber: Optional[int] = None


# In-memory store for demo purposes - in production, use a proper table
bed_configurations = []


@router.get("/bed-configurations", response_model=List[BedConfiguration])
def read_bed_configurations():
    return bed_configurations


@router.get("/bed-configurations/{config_id}", response_model=BedConfiguration)
def read_bed_configuration(config_id: str):
    config = next((c for c in bed_configurations if c.id == config_id), None)
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")
    return config


@router.post("/bed-configurations", response_model=BedConfiguration)
def create_bed_configuration(config: BedConfigurationCreate):
    new_config = BedConfiguration(id=str(len(bed_configurations) + 1), **config.dict())
    bed_configurations.append(new_config)
    return new_config


@router.put("/bed-configurations/{config_id}", response_model=BedConfiguration)
def update_bed_configuration(config_id: str, config: BedConfigurationUpdate):
    existing = next((c for c in bed_configurations if c.id == config_id), None)
    if not existing:
        raise HTTPException(status_code=404, detail="Configuration not found")

    update_data = config.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(existing, field, value)

    return existing


@router.delete("/bed-configurations/{config_id}")
def delete_bed_configuration(config_id: str):
    config = next((c for c in bed_configurations if c.id == config_id), None)
    if not config:
        raise HTTPException(status_code=404, detail="Configuration not found")

    bed_configurations.remove(config)
    return {"message": "Configuration deleted successfully"}
