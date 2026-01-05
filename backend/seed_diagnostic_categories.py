from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import DiagnosticCategory, DiagnosticSubcategory
from app.database import DATABASE_URL
import uuid

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


DIAGNOSTICS_DATA = {
    "diagnostics": [
        {
            "category": "SNC (Sistema Nervioso Central)",
            "items": [
                "ABSCESO CEREBRAL",
                "EMPIEMA SUBDURAL",
                "ENCEFALITIS (MENINGOENCEFALITIS AGUDA LINFOCITARIA)",
                "INFECCIÓN SNC EN PACIENTE VIH",
                "MENINGITIS AGUDA BACTERIANA",
                "MENINGITIS AGUDA VIRAL",
                "VENTRICULITIS/MENINGITIS POST QUIRÚRGICA",
            ],
        },
        {
            "category": "OFTALMOLOGÍA",
            "items": [
                "ENDOFTALMITIS",
                "CELULITIS ORBITARIA",
                "MASTOIDITIS",
                "OTITIS EXTERNA",
                "OTITIS EXTERNA MALIGNA",
                "OTITIS MEDIA AGUDA",
                "SINUSITIS AGUDA",
                "INFECCIÓN ODONTÓGENA",
            ],
        },
        {
            "category": "BRONQUIOS",
            "items": [
                "BRONQUITIS AGUDA O EXACERBACIONES DE BRONQUITIS CRÓNICA",
            ],
        },
        {
            "category": "CARDIOVASCULARES",
            "items": [
                "BACTERIEMIA CON FOCO DESCONOCIDO",
                "BACTERIEMIA RELACIONADA A CATÉTER",
                "BACTERIEMIA RELACIONADA A CATÉTER HD",
                "ENDOCARDITIS INFECCIOSA SOBRE DISPOSITIVOS INTRAVASCULARES",
                "ENDOCARDITIS INFECCIOSA VÁLVULA NATIVA",
                "ENDOCARDITIS INFECCIOSA VÁLVULA PROTÉSICA PRECOZ",
                "PERICARDITIS INFECCIOSA",
            ],
        },
        {
            "category": "GÁSTRICA E INTRAABDOMINAL",
            "items": [
                "ABSCESO ESPLÉNICO",
                "ABSCESO HEPÁTICO",
                "APENDICITIS COMPLICADA",
                "COLANGITIS",
                "COLECISTITIS",
                "DIARREA INFECCIOSA SEVERA (SHIGELLA, SALMONELLA, ETC.)",
                "DIVERTICULITIS COMPLICADA",
                "INFECCIÓN INTRAABDOMINAL POST-QUIRÚRGICA",
                "INFECCIONES DE LA VÍA BILIAR",
                "PANCREATITIS INFECTADA",
                "PERITONITIS ASOCIADA A DIÁLISIS PERITONEAL",
                "PERITONITIS BACTERIANA ESPONTÁNEA",
                "PERITONITIS SECUNDARIA",
                "PERITONITIS TERCIARIA",
            ],
        },
        {
            "category": "PIEL Y PARTES BLANDAS",
            "items": [
                "ABSCESO CUTÁNEO",
                "ARTRITIS SÉPTICA",
                "CELULITIS POR MORDEDURA",
                "ERISIPELA",
                "FASCEITIS NECROTIZANTE",
                "FRACTURA EXPUESTA",
                "IMPÉTIGO Y HERIDAS CUTÁNEAS SUPERFICIALES INFECTADAS",
                "INFECCIÓN DE SITIO OPERATORIO - ABDOMEN (INCLUYE TRACTO GI Y GENITOURINARIO)",
                "INFECCIÓN DE SITIO OPERATORIO - CABEZA Y CUELLO",
                "INFECCIÓN DE SITIO OPERATORIO - TÓRAX Y EXTREMIDADES",
                "INFECCIONES DE PRÓTESIS Y MATERIAL DE OSTEOSÍNTESIS",
                "INFECCIONES NO SUPURATIVAS",
                "INFECCIONES SUPURATIVAS",
                "OSTEOMIELITIS",
                "PIE DIABÉTICO COMPLICADO",
                "PIE DIABÉTICO NO COMPLICADO",
            ],
        },
        {
            "category": "GINECOLOGÍA Y OBSTETRICIA",
            "items": [
                "INFECCIONES OBSTÉTRICAS O GINECOLÓGICAS, ITS EN MUJERES",
                "PROSTATITIS, ORQUITIS Y EPIDIDIMITIS, ITS EN HOMBRES",
            ],
        },
        {
            "category": "SEPSIS",
            "items": [
                "SEPSIS CLÍNICA (SOSPECHA DE INFECCIÓN DEL TORRENTE SANGUÍNEO SIN CONFIRMACIÓN DE LABORATORIO/RESULTADOS NO DISPONIBLES, NO SE REALIZARON CULTIVOS DE SANGRE O CULTIVO SANGUÍNEO NEGATIVO), EXCLUYENDO NEUTROPENIA FEBRIL",
            ],
        },
        {
            "category": "NEUTROPENIA FEBRIL",
            "items": [
                "NEUTROPENIA FEBRIL U OTRA MANIFESTACIÓN DE INFECCIÓN EN HUÉSPED INMUNOCOMPROMETIDO (EJ., VIH, QUIMIOTERAPIA, ETC.) SIN SITIO ANATÓMICO CLARO",
            ],
        },
        {
            "category": "VÍA RESPIRATORIA BAJA",
            "items": [
                "NEUMONÍA ASOCIADA A LA ATENCIÓN EN SALUD",
                "NEUMONÍA ASOCIADA A LA VENTILACIÓN MECÁNICA",
            ],
        },
        {
            "category": "SIRS",
            "items": [
                "RESPUESTA INFLAMATORIA SISTÉMICA SIN SITIO ANATÓMICO CLARO",
            ],
        },
    ]
}


def seed_diagnostic_categories():
    db = SessionLocal()

    try:
        categories_list = DIAGNOSTICS_DATA.get("diagnostics", [])

        print(f"Seeding {len(categories_list)} diagnostic categories...")

        for idx, cat_data in enumerate(categories_list, start=1):
            category_name = cat_data.get("category")
            category_code = category_name.replace(" ", "_").upper()[:20]

            existing_category = (
                db.query(DiagnosticCategory)
                .filter(DiagnosticCategory.code == category_code)
                .first()
            )

            if existing_category:
                print(f"  Category '{category_name}' already exists, skipping...")
                continue

            category = DiagnosticCategory(
                id=uuid.uuid4(),
                name=category_name,
                code=category_code,
                is_active=True,
                sort_order=idx,
            )
            db.add(category)
            db.flush()

            items = cat_data.get("items", [])
            print(
                f"  Created category: {category_name} with {len(items)} subcategories"
            )

            for sub_idx, item_name in enumerate(items, start=1):
                item_code = item_name[:50]

                subcategory = DiagnosticSubcategory(
                    id=uuid.uuid4(),
                    category_id=category.id,
                    name=item_name,
                    code=item_code,
                    is_active=True,
                    sort_order=sub_idx,
                )
                db.add(subcategory)

        db.commit()
        print("✓ Diagnostic categories seeded successfully!")

    except Exception as e:
        db.rollback()
        print(f"✗ Error seeding diagnostic categories: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_diagnostic_categories()
