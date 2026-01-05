#!/usr/bin/env python3
"""
Script to populate antibiotics table with the provided list of antimicrobials.
"""

import sys
import os
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal
from app.models import Antibiotic

# List of antibiotics provided by user
ANTIBIOTICS_LIST = [
    {"name": "Aciclovir", "type": "antibiotic", "default_start_count": 1},
    {"name": "Amikacina", "type": "antibiotic", "default_start_count": 1},
    {"name": "Amoxicilina", "type": "antibiotic", "default_start_count": 1},
    {
        "name": "Amoxicilina ácido clavulanico",
        "type": "antibiotic",
        "default_start_count": 1,
    },
    {"name": "Ampicilina", "type": "antibiotic", "default_start_count": 1},
    {"name": "Ampicilina sulbactam", "type": "antibiotic", "default_start_count": 1},
    {"name": "Anfotericina B", "type": "antibiotic", "default_start_count": 0},
    {"name": "Anidulafungina", "type": "antibiotic", "default_start_count": 1},
    {"name": "Azitromicina", "type": "antibiotic", "default_start_count": 1},
    {"name": "Aztreonam", "type": "antibiotic", "default_start_count": 1},
    {"name": "Cefazolina", "type": "antibiotic", "default_start_count": 1},
    {"name": "Cefepime", "type": "antibiotic", "default_start_count": 1},
    {"name": "Cefotaxima", "type": "antibiotic", "default_start_count": 1},
    {"name": "Ceftazidima", "type": "antibiotic", "default_start_count": 1},
    {"name": "Ceftazidima avibactam", "type": "antibiotic", "default_start_count": 1},
    {"name": "Ceftolozano tazobactam", "type": "antibiotic", "default_start_count": 1},
    {"name": "Ceftriaxona", "type": "antibiotic", "default_start_count": 1},
    {"name": "Ciprofloxacino", "type": "antibiotic", "default_start_count": 0},
    {"name": "Claritromicina", "type": "antibiotic", "default_start_count": 1},
    {"name": "Cloxacilina", "type": "antibiotic", "default_start_count": 1},
    {"name": "Colistin", "type": "antibiotic", "default_start_count": 0},
    {"name": "Cotrimoxazol", "type": "antibiotic", "default_start_count": 1},
    {"name": "Daptomicina", "type": "antibiotic", "default_start_count": 1},
    {"name": "Doxiciclina", "type": "antibiotic", "default_start_count": 1},
    {"name": "Etambutol", "type": "antibiotic", "default_start_count": 1},
    {"name": "Fluconazol", "type": "antibiotic", "default_start_count": 1},
    {"name": "Ganciclovir", "type": "antibiotic", "default_start_count": 1},
    {"name": "Gentamicina", "type": "antibiotic", "default_start_count": 0},
    {"name": "Isoniazida", "type": "antibiotic", "default_start_count": 1},
    {"name": "Isavuconazol", "type": "antibiotic", "default_start_count": 1},
    {"name": "Itraconazol", "type": "antibiotic", "default_start_count": 1},
    {"name": "Levofloxacino", "type": "antibiotic", "default_start_count": 0},
    {"name": "Linezolid", "type": "antibiotic", "default_start_count": 1},
    {"name": "Metronidazol", "type": "antibiotic", "default_start_count": 0},
    {"name": "Nistatina", "type": "antibiotic", "default_start_count": 1},
    {"name": "Oseltamivir", "type": "antibiotic", "default_start_count": 1},
    {"name": "Penicilina benzatina", "type": "antibiotic", "default_start_count": 1},
    {"name": "Penicilina G", "type": "antibiotic", "default_start_count": 1},
    {"name": "Pirazinamida", "type": "antibiotic", "default_start_count": 1},
    {"name": "Rifampicina", "type": "antibiotic", "default_start_count": 1},
    {"name": "Tigeciclina", "type": "antibiotic", "default_start_count": 1},
    {"name": "Vancomicina", "type": "antibiotic", "default_start_count": 1},
    {"name": "Voriconazol", "type": "antibiotic", "default_start_count": 1},
]


def populate_antibiotics():
    db = SessionLocal()
    try:
        print("Populating antibiotics table...")

        for antibiotic_data in ANTIBIOTICS_LIST:
            # Check if antibiotic already exists
            existing = (
                db.query(Antibiotic)
                .filter(Antibiotic.name == antibiotic_data["name"])
                .first()
            )
            if existing:
                print(
                    f"Antibiotic '{antibiotic_data['name']}' already exists, skipping..."
                )
                continue

            # Create new antibiotic
            antibiotic = Antibiotic(**antibiotic_data)
            db.add(antibiotic)
            print(f"Added: {antibiotic_data['name']}")

        db.commit()
        print(f"Successfully populated {len(ANTIBIOTICS_LIST)} antibiotics!")

    except Exception as e:
        print(f"Error populating antibiotics: {e}")
        db.rollback()
        return False
    finally:
        db.close()

    return True


if __name__ == "__main__":
    success = populate_antibiotics()
    sys.exit(0 if success else 1)
