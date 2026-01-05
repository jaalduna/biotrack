from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from ..database import get_db
from ..models import (
    DiagnosticCategory as DiagnosticCategoryModel,
    DiagnosticSubcategory as DiagnosticSubcategoryModel,
)
from ..schemas import (
    DiagnosticCategory,
    DiagnosticCategoryCreate,
    DiagnosticSubcategory,
    DiagnosticSubcategoryCreate,
)
from ..auth import get_current_user

router = APIRouter()


@router.get("/diagnostic-categories", response_model=List[DiagnosticCategory])
def read_diagnostic_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    categories = (
        db.query(DiagnosticCategoryModel)
        .filter(DiagnosticCategoryModel.is_active == True)
        .order_by(DiagnosticCategoryModel.sort_order)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return categories


@router.post("/diagnostic-categories", response_model=DiagnosticCategory)
def create_diagnostic_category(
    category: DiagnosticCategoryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_category = DiagnosticCategoryModel(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.get("/diagnostic-categories/{category_id}", response_model=DiagnosticCategory)
def read_diagnostic_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    category = (
        db.query(DiagnosticCategoryModel)
        .filter(DiagnosticCategoryModel.id == category_id)
        .first()
    )
    if category is None:
        raise HTTPException(status_code=404, detail="Diagnostic category not found")
    return category


@router.put("/diagnostic-categories/{category_id}", response_model=DiagnosticCategory)
def update_diagnostic_category(
    category_id: str,
    category: DiagnosticCategoryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_category = (
        db.query(DiagnosticCategoryModel)
        .filter(DiagnosticCategoryModel.id == category_id)
        .first()
    )
    if db_category is None:
        raise HTTPException(status_code=404, detail="Diagnostic category not found")
    for key, value in category.dict().items():
        setattr(db_category, key, value)
    db.commit()
    db.refresh(db_category)
    return db_category


@router.delete("/diagnostic-categories/{category_id}")
def delete_diagnostic_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_category = (
        db.query(DiagnosticCategoryModel)
        .filter(DiagnosticCategoryModel.id == category_id)
        .first()
    )
    if db_category is None:
        raise HTTPException(status_code=404, detail="Diagnostic category not found")
    db_category.is_active = False
    db.commit()
    return {"detail": "Diagnostic category deactivated"}


@router.get("/diagnostic-subcategories", response_model=List[DiagnosticSubcategory])
def read_diagnostic_subcategories(
    category_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(DiagnosticSubcategoryModel).filter(
        DiagnosticSubcategoryModel.is_active == True
    )

    if category_id:
        query = query.filter(DiagnosticSubcategoryModel.category_id == category_id)

    subcategories = (
        query.order_by(DiagnosticSubcategoryModel.sort_order)
        .offset(skip)
        .limit(limit)
        .all()
    )
    return subcategories


@router.post("/diagnostic-subcategories", response_model=DiagnosticSubcategory)
def create_diagnostic_subcategory(
    subcategory: DiagnosticSubcategoryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_subcategory = DiagnosticSubcategoryModel(**subcategory.dict())
    db.add(db_subcategory)
    db.commit()
    db.refresh(db_subcategory)
    return db_subcategory


@router.get(
    "/diagnostic-subcategories/{subcategory_id}", response_model=DiagnosticSubcategory
)
def read_diagnostic_subcategory(
    subcategory_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    subcategory = (
        db.query(DiagnosticSubcategoryModel)
        .filter(DiagnosticSubcategoryModel.id == subcategory_id)
        .first()
    )
    if subcategory is None:
        raise HTTPException(status_code=404, detail="Diagnostic subcategory not found")
    return subcategory


@router.put(
    "/diagnostic-subcategories/{subcategory_id}", response_model=DiagnosticSubcategory
)
def update_diagnostic_subcategory(
    subcategory_id: str,
    subcategory: DiagnosticSubcategoryCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_subcategory = (
        db.query(DiagnosticSubcategoryModel)
        .filter(DiagnosticSubcategoryModel.id == subcategory_id)
        .first()
    )
    if db_subcategory is None:
        raise HTTPException(status_code=404, detail="Diagnostic subcategory not found")
    for key, value in subcategory.dict().items():
        setattr(db_subcategory, key, value)
    db.commit()
    db.refresh(db_subcategory)
    return db_subcategory


@router.delete("/diagnostic-subcategories/{subcategory_id}")
def delete_diagnostic_subcategory(
    subcategory_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_subcategory = (
        db.query(DiagnosticSubcategoryModel)
        .filter(DiagnosticSubcategoryModel.id == subcategory_id)
        .first()
    )
    if db_subcategory is None:
        raise HTTPException(status_code=404, detail="Diagnostic subcategory not found")
    db_subcategory.is_active = False
    db.commit()
    return {"detail": "Diagnostic subcategory deactivated"}
