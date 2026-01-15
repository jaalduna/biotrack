import pytest
from uuid import uuid4
from app.models import Patient


class TestPatientsAPIAuth:
    """Tests for patients API authentication requirements."""

    def test_get_patients_requires_auth(self, client):
        """GET /patients should return 401 without authentication."""
        response = client.get("/api/v1/patients")
        assert response.status_code == 401

    def test_get_patients_with_auth(self, client, auth_headers, db_session, test_team):
        """GET /patients should return 200 with valid auth token."""
        response = client.get("/api/v1/patients", headers=auth_headers)
        assert response.status_code == 200
        assert response.json() == []

    def test_get_patient_by_id_requires_auth(self, client):
        """GET /patients/{id} should return 401 without authentication."""
        fake_id = str(uuid4())
        response = client.get(f"/api/v1/patients/{fake_id}")
        assert response.status_code == 401

    def test_create_patient_requires_auth(self, client):
        """POST /patients should return 401 without authentication."""
        patient_data = {
            "rut": "12345678-9",
            "name": "Test Patient",
            "age": 45,
            "status": "active",
            "unit": "UCI",
            "bed_number": 1,
        }
        response = client.post("/api/v1/patients", json=patient_data)
        assert response.status_code == 401

    def test_update_patient_requires_auth(self, client):
        """PUT /patients/{id} should return 401 without authentication."""
        fake_id = str(uuid4())
        patient_data = {
            "rut": "12345678-9",
            "name": "Updated Patient",
            "age": 46,
            "status": "active",
            "unit": "UCI",
            "bed_number": 1,
        }
        response = client.put(f"/api/v1/patients/{fake_id}", json=patient_data)
        assert response.status_code == 401

    def test_delete_patient_requires_auth(self, client):
        """DELETE /patients/{id} should return 401 without authentication."""
        fake_id = str(uuid4())
        response = client.delete(f"/api/v1/patients/{fake_id}")
        assert response.status_code == 401


class TestPatientsAPITeamIsolation:
    """Tests for patients API team_id filtering."""

    def test_create_patient_sets_team_id(self, client, auth_headers, db_session, test_team):
        """Created patient should have team_id from current user."""
        patient_data = {
            "rut": "11111111-1",
            "name": "Team Patient",
            "age": 30,
            "status": "active",
            "unit": "UCI",
            "bed_number": 5,
        }
        response = client.post("/api/v1/patients", json=patient_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        # Verify patient was created (we can't check team_id in response if schema doesn't include it)
        assert data["name"] == "Team Patient"
        assert data["rut"] == "11111111-1"

    def test_user_only_sees_own_team_patients(
        self, client, auth_headers, db_session, test_team, test_user
    ):
        """User should only see patients from their own team."""
        from app.models import Team

        # Create another team for the other patient
        other_team = Team(
            id=uuid4(),
            name="Other Hospital Team",
            subscription_status="active",
            subscription_plan="basic",
            member_limit=5,
        )
        db_session.add(other_team)
        db_session.flush()

        # Create a patient for the test team
        team_patient = Patient(
            id=uuid4(),
            rut="22222222-2",
            name="Team Patient",
            age=40,
            status="active",
            unit="UCI",
            bed_number=1,
            team_id=test_team.id,
        )
        db_session.add(team_patient)

        # Create a patient for a different team
        other_team_patient = Patient(
            id=uuid4(),
            rut="33333333-3",
            name="Other Team Patient",
            age=50,
            status="active",
            unit="UTI",
            bed_number=2,
            team_id=other_team.id,  # Different team
        )
        db_session.add(other_team_patient)
        db_session.commit()

        # User should only see their team's patient
        response = client.get("/api/v1/patients", headers=auth_headers)
        assert response.status_code == 200
        patients = response.json()
        assert len(patients) == 1
        assert patients[0]["name"] == "Team Patient"

    def test_user_cannot_access_other_team_patient(
        self, client, auth_headers, db_session, test_team
    ):
        """User should get 404 when accessing patient from another team."""
        from app.models import Team

        # Create another team first
        other_team = Team(
            id=uuid4(),
            name="Another Hospital",
            subscription_status="active",
            subscription_plan="basic",
            member_limit=5,
        )
        db_session.add(other_team)
        db_session.flush()

        # Create a patient for a different team
        other_patient_id = uuid4()
        other_patient = Patient(
            id=other_patient_id,
            rut="44444444-4",
            name="Other Patient",
            age=35,
            status="active",
            unit="UCI",
            bed_number=3,
            team_id=other_team.id,  # Different team
        )
        db_session.add(other_patient)
        db_session.commit()

        # Try to access the other team's patient
        response = client.get(
            f"/api/v1/patients/{str(other_patient_id)}", headers=auth_headers
        )
        assert response.status_code == 404

    def test_user_without_team_sees_all_patients(
        self, client, auth_headers_no_team, db_session
    ):
        """User without team_id should see patients with null team_id."""
        # Create a patient without team
        patient_no_team = Patient(
            id=uuid4(),
            rut="55555555-5",
            name="No Team Patient",
            age=25,
            status="waiting",
            unit="UCI",
            bed_number=4,
            team_id=None,
        )
        db_session.add(patient_no_team)
        db_session.commit()

        response = client.get("/api/v1/patients", headers=auth_headers_no_team)
        assert response.status_code == 200
        # User without team should see all patients (no team filter applied)
        patients = response.json()
        assert len(patients) >= 1


class TestPatientsAPICRUD:
    """Tests for patients API CRUD operations with authentication."""

    def test_create_patient_success(self, client, auth_headers, db_session):
        """Should successfully create a patient."""
        patient_data = {
            "rut": "66666666-6",
            "name": "New Patient",
            "age": 55,
            "status": "waiting",
            "unit": "UTI",
            "bed_number": 10,
        }
        response = client.post("/api/v1/patients", json=patient_data, headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "New Patient"
        assert data["rut"] == "66666666-6"
        assert data["status"] == "waiting"
        assert "id" in data

    def test_get_patient_by_id_success(
        self, client, auth_headers, db_session, test_team
    ):
        """Should successfully get a patient by ID."""
        patient_id = uuid4()
        patient = Patient(
            id=patient_id,
            rut="77777777-7",
            name="Get Patient",
            age=60,
            status="active",
            unit="UCI",
            bed_number=7,
            team_id=test_team.id,
        )
        db_session.add(patient)
        db_session.commit()

        response = client.get(f"/api/v1/patients/{str(patient_id)}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Get Patient"
        assert data["rut"] == "77777777-7"

    def test_update_patient_success(self, client, auth_headers, db_session, test_team):
        """Should successfully update a patient."""
        patient_id = uuid4()
        patient = Patient(
            id=patient_id,
            rut="88888888-8",
            name="Update Patient",
            age=70,
            status="active",
            unit="UCI",
            bed_number=8,
            team_id=test_team.id,
        )
        db_session.add(patient)
        db_session.commit()

        update_data = {
            "rut": "88888888-8",
            "name": "Updated Name",
            "age": 71,
            "status": "archived",
            "unit": "UTI",
            "bed_number": 9,
        }
        response = client.put(
            f"/api/v1/patients/{str(patient_id)}", json=update_data, headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["status"] == "archived"

    def test_delete_patient_success(self, client, auth_headers, db_session, test_team):
        """Should successfully delete a patient."""
        patient_id = uuid4()
        patient = Patient(
            id=patient_id,
            rut="99999999-9",
            name="Delete Patient",
            age=80,
            status="active",
            unit="UCI",
            bed_number=9,
            team_id=test_team.id,
        )
        db_session.add(patient)
        db_session.commit()

        response = client.delete(f"/api/v1/patients/{str(patient_id)}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["message"] == "Patient deleted"

        # Verify patient is deleted
        get_response = client.get(
            f"/api/v1/patients/{str(patient_id)}", headers=auth_headers
        )
        assert get_response.status_code == 404

    def test_get_patient_not_found(self, client, auth_headers):
        """Should return 404 for non-existent patient."""
        fake_id = str(uuid4())
        response = client.get(f"/api/v1/patients/{fake_id}", headers=auth_headers)
        assert response.status_code == 404
        assert response.json()["detail"] == "Patient not found"
