"""
Seed script to populate the antibiotics table with initial data.
Run with: python seed_antibiotics.py
"""

import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Antibiotic

antibiotics_data = [
    {"name": "Aciclovir", "type": "antibiotic", "default_start_count": 0},
    {"name": "Amikacina", "type": "antibiotic", "default_start_count": 0},
    {"name": "Amoxicilina", "type": "antibiotic", "default_start_count": 1},
    {
        "name": "Amoxicilina ácido clavulanico",
        "type": "antibiotic",
        "default_start_count": 0,
    },
    {"name": "Ampicilina", "type": "antibiotic", "default_start_count": 0},
    {"name": "Ampicilina sulbactam", "type": "antibiotic", "default_start_count": 0},
    {"name": "Anfotericina B", "type": "antibiotic", "default_start_count": 0},
    {"name": "Anidulafungina", "type": "antibiotic", "default_start_count": 0},
    {"name": "Azitromicina", "type": "antibiotic", "default_start_count": 1},
    {"name": "Aztreonam", "type": "antibiotic", "default_start_count": 0},
    {"name": "Cefazolina", "type": "antibiotic", "default_start_count": 0},
    {"name": "Cefepime", "type": "antibiotic", "default_start_count": 0},
    {"name": "Cefotaxima", "type": "antibiotic", "default_start_count": 0},
    {"name": "Ceftazidima", "type": "antibiotic", "default_start_count": 0},
    {"name": "Ceftazidima avibactam", "type": "antibiotic", "default_start_count": 0},
    {"name": "Ceftolozano tazobactam", "type": "antibiotic", "default_start_count": 0},
    {"name": "Ceftriaxona", "type": "antibiotic", "default_start_count": 0},
    {"name": "Ciprofloxacino", "type": "antibiotic", "default_start_count": 0},
    {"name": "Claritromicina", "type": "antibiotic", "default_start_count": 0},
    {"name": "Cloxacilina", "type": "antibiotic", "default_start_count": 0},
    {"name": "Colistin", "type": "antibiotic", "default_start_count": 0},
    {"name": "Cotrimoxazol", "type": "antibiotic", "default_start_count": 0},
    {"name": "Daptomicina", "type": "antibiotic", "default_start_count": 0},
    {"name": "Doxiciclina", "type": "antibiotic", "default_start_count": 1},
    {"name": "Etambutol", "type": "antibiotic", "default_start_count": 0},
    {"name": "Fluconazol", "type": "antibiotic", "default_start_count": 0},
    {"name": "Ganciclovir", "type": "antibiotic", "default_start_count": 0},
    {"name": "Gentamicina", "type": "antibiotic", "default_start_count": 0},
    {"name": "Isoniazida", "type": "antibiotic", "default_start_count": 0},
    {"name": "Isavuconazol", "type": "antibiotic", "default_start_count": 0},
    {"name": "Itraconazol", "type": "antibiotic", "default_start_count": 0},
    {"name": "Levofloxacino", "type": "antibiotic", "default_start_count": 0},
    {"name": "Linezolid", "type": "antibiotic", "default_start_count": 0},
    {"name": "Metronidazol", "type": "antibiotic", "default_start_count": 0},
    {"name": "Nistatina", "type": "antibiotic", "default_start_count": 0},
    {"name": "Oseltamivir", "type": "antibiotic", "default_start_count": 0},
    {"name": "Penicilina benzatina", "type": "antibiotic", "default_start_count": 0},
    {"name": "Penicilina G", "type": "antibiotic", "default_start_count": 1},
    {"name": "Pirazinamida", "type": "antibiotic", "default_start_count": 0},
    {"name": "Rifampicina", "type": "antibiotic", "default_start_count": 0},
    {"name": "Tigeciclina", "type": "antibiotic", "default_start_count": 0},
    {"name": "Vancomicina", "type": "antibiotic", "default_start_count": 0},
    {"name": "Voriconazol", "type": "antibiotic", "default_start_count": 0},
]


def seed_antibiotics():
    db: Session = SessionLocal()

    try:
        for antibiotic_data in antibiotics_data:
            existing = (
                db.query(Antibiotic)
                .filter(Antibiotic.name == antibiotic_data["name"])
                .first()
            )

            if not existing:
                antibiotic = Antibiotic(**antibiotic_data)
                db.add(antibiotic)
                print(f"Added: {antibiotic_data['name']} ({antibiotic_data['type']})")
            else:
                print(f"Skipped (already exists): {antibiotic_data['name']}")

        db.commit()
        print(f"\n✅ Successfully seeded {len(antibiotics_data)} antibiotics")

    except Exception as e:
        print(f"❌ Error seeding antibiotics: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding antibiotics...")
    seed_antibiotics()
