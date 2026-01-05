import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from uuid import uuid4
from app.main import app
from app.database import get_testing_db, testing_engine, TestingSessionLocal, Base
from app.models import DiagnosticCategory, DiagnosticSubcategory
from app.schemas import DiagnosticCategoryCreate, DiagnosticSubcategoryCreate

client = TestClient(app)


@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=testing_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def sample_category():
    return {
        "name": "Test Category",
        "code": "T00-T99",
        "description": "Test category description",
        "sort_order": 10,
    }


@pytest.fixture
def sample_subcategory():
    return {
        "name": "Test Subcategory",
        "code": "T01",
        "description": "Test subcategory description",
        "sort_order": 1,
    }


class TestDiagnosticCategories:
    def test_read_diagnostic_categories_empty(self, db_session):
        response = client.get("/api/v1/diagnostic-categories")
        assert response.status_code == 200
        assert response.json() == []

    def test_create_diagnostic_category_success(self, db_session, sample_category):
        response = client.post("/api/v1/diagnostic-categories", json=sample_category)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == sample_category["name"]
        assert data["code"] == sample_category["code"]
        assert data["description"] == sample_category["description"]
        assert data["sort_order"] == sample_category["sort_order"]
        assert "id" in data
        assert "created_at" in data

    def test_create_diagnostic_category_duplicate_code(
        self, db_session, sample_category
    ):
        client.post("/api/v1/diagnostic-categories", json=sample_category)
        response = client.post("/api/v1/diagnostic-categories", json=sample_category)
        assert response.status_code == 422

    def test_create_diagnostic_category_invalid_data(self, db_session):
        invalid_data = {"name": "", "code": ""}
        response = client.post("/api/v1/diagnostic-categories", json=invalid_data)
        assert response.status_code == 422

    def test_read_diagnostic_category_success(self, db_session, sample_category):
        create_response = client.post(
            "/api/v1/diagnostic-categories", json=sample_category
        )
        category_id = create_response.json()["id"]

        response = client.get(f"/api/v1/diagnostic-categories/{category_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == sample_category["name"]
        assert data["code"] == sample_category["code"]

    def test_read_diagnostic_category_not_found(self, db_session):
        fake_id = str(uuid4())
        response = client.get(f"/api/v1/diagnostic-categories/{fake_id}")
        assert response.status_code == 404
        assert response.json()["detail"] == "Diagnostic category not found"

    def test_update_diagnostic_category_success(self, db_session, sample_category):
        create_response = client.post(
            "/api/v1/diagnostic-categories", json=sample_category
        )
        category_id = create_response.json()["id"]

        update_data = {
            "name": "Updated Category",
            "code": "U00-U99",
            "description": "Updated description",
            "sort_order": 20,
        }

        response = client.put(
            f"/api/v1/diagnostic-categories/{category_id}", json=update_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["code"] == update_data["code"]

    def test_update_diagnostic_category_not_found(self, db_session, sample_category):
        fake_id = str(uuid4())
        response = client.put(
            f"/api/v1/diagnostic-categories/{fake_id}", json=sample_category
        )
        assert response.status_code == 404

    def test_deactivate_diagnostic_category_success(self, db_session, sample_category):
        create_response = client.post(
            "/api/v1/diagnostic-categories", json=sample_category
        )
        category_id = create_response.json()["id"]

        response = client.delete(f"/api/v1/diagnostic-categories/{category_id}")
        assert response.status_code == 200
        assert response.json()["detail"] == "Diagnostic category deactivated"

    def test_deactivate_diagnostic_category_not_found(self, db_session):
        fake_id = str(uuid4())
        response = client.delete(f"/api/v1/diagnostic-categories/{fake_id}")
        assert response.status_code == 404


class TestDiagnosticSubcategories:
    def test_read_diagnostic_subcategories_empty(self, db_session):
        response = client.get("/api/v1/diagnostic-subcategories")
        assert response.status_code == 200
        assert response.json() == []

    def test_read_diagnostic_subcategories_by_category(
        self, db_session, sample_category, sample_subcategory
    ):
        category_response = client.post(
            "/api/v1/diagnostic-categories", json=sample_category
        )
        category_id = category_response.json()["id"]

        subcategory_with_category = {**sample_subcategory, "category_id": category_id}
        client.post("/api/v1/diagnostic-subcategories", json=subcategory_with_category)

        response = client.get(
            f"/api/v1/diagnostic-subcategories?category_id={category_id}"
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == sample_subcategory["name"]

    def test_create_diagnostic_subcategory_success(
        self, db_session, sample_category, sample_subcategory
    ):
        category_response = client.post(
            "/api/v1/diagnostic-categories", json=sample_category
        )
        category_id = category_response.json()["id"]

        subcategory_with_category = {**sample_subcategory, "category_id": category_id}
        response = client.post(
            "/api/v1/diagnostic-subcategories", json=subcategory_with_category
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == sample_subcategory["name"]
        assert data["code"] == sample_subcategory["code"]
        assert data["category_id"] == category_id

    def test_create_diagnostic_subcategory_invalid_category(
        self, db_session, sample_subcategory
    ):
        fake_category_id = str(uuid4())
        subcategory_with_fake_category = {
            **sample_subcategory,
            "category_id": fake_category_id,
        }
        response = client.post(
            "/api/v1/diagnostic-subcategories", json=subcategory_with_fake_category
        )
        assert response.status_code == 422

    def test_read_diagnostic_subcategory_success(
        self, db_session, sample_category, sample_subcategory
    ):
        category_response = client.post(
            "/api/v1/diagnostic-categories", json=sample_category
        )
        category_id = category_response.json()["id"]

        subcategory_with_category = {**sample_subcategory, "category_id": category_id}
        create_response = client.post(
            "/api/v1/diagnostic-subcategories", json=subcategory_with_category
        )
        subcategory_id = create_response.json()["id"]

        response = client.get(f"/api/v1/diagnostic-subcategories/{subcategory_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == sample_subcategory["name"]
        assert data["category_id"] == category_id

    def test_read_diagnostic_subcategory_not_found(self, db_session):
        fake_id = str(uuid4())
        response = client.get(f"/api/v1/diagnostic-subcategories/{fake_id}")
        assert response.status_code == 404
        assert response.json()["detail"] == "Diagnostic subcategory not found"

    def test_update_diagnostic_subcategory_success(
        self, db_session, sample_category, sample_subcategory
    ):
        category_response = client.post(
            "/api/v1/diagnostic-categories", json=sample_category
        )
        category_id = category_response.json()["id"]

        subcategory_with_category = {**sample_subcategory, "category_id": category_id}
        create_response = client.post(
            "/api/v1/diagnostic-subcategories", json=subcategory_with_category
        )
        subcategory_id = create_response.json()["id"]

        update_data = {
            "name": "Updated Subcategory",
            "code": "U01",
            "description": "Updated description",
            "category_id": category_id,
            "sort_order": 10,
        }

        response = client.put(
            f"/api/v1/diagnostic-subcategories/{subcategory_id}", json=update_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]

    def test_deactivate_diagnostic_subcategory_success(
        self, db_session, sample_category, sample_subcategory
    ):
        category_response = client.post(
            "/api/v1/diagnostic-categories", json=sample_category
        )
        category_id = category_response.json()["id"]

        subcategory_with_category = {**sample_subcategory, "category_id": category_id}
        create_response = client.post(
            "/api/v1/diagnostic-subcategories", json=subcategory_with_category
        )
        subcategory_id = create_response.json()["id"]

        response = client.delete(f"/api/v1/diagnostic-subcategories/{subcategory_id}")
        assert response.status_code == 200
        assert response.json()["detail"] == "Diagnostic subcategory deactivated"


class TestDiagnosticCategoriesIntegration:
    def test_category_subcategory_relationship(
        self, db_session, sample_category, sample_subcategory
    ):
        category_response = client.post(
            "/api/v1/diagnostic-categories", json=sample_category
        )
        category_id = category_response.json()["id"]

        subcategory_with_category = {**sample_subcategory, "category_id": category_id}
        subcategory_response = client.post(
            "/api/v1/diagnostic-subcategories", json=subcategory_with_category
        )
        subcategory_id = subcategory_response.json()["id"]

        category_detail_response = client.get(
            f"/api/v1/diagnostic-categories/{category_id}"
        )
        category_data = category_detail_response.json()

        subcategory_detail_response = client.get(
            f"/api/v1/diagnostic-subcategories/{subcategory_id}"
        )
        subcategory_data = subcategory_detail_response.json()

        assert subcategory_data["category_id"] == category_data["id"]
        assert category_data["id"] == subcategory_data["category_id"]

    def test_filter_active_categories_only(self, db_session):
        all_categories = client.get("/api/v1/diagnostic-categories")
        assert all_categories.status_code == 200

        active_category = {
            "name": "Active Category",
            "code": "A00-A99",
            "description": "Should be visible",
            "sort_order": 1,
            "is_active": True,
        }

        client.post("/api/v1/diagnostic-categories", json=active_category)

        response = client.get("/api/v1/diagnostic-categories")
        data = response.json()
        category_names = [cat["name"] for cat in data]
        assert "Active Category" in category_names
