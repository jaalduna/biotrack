import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set test environment variables before importing app
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only-12345678901234567890"
# Use PostgreSQL for testing to avoid UUID compatibility issues with SQLite
TESTING_DATABASE_URL = os.environ.get(
    "TESTING_DATABASE_URL",
    "postgresql://user:password@localhost:5434/biotrack_test"
)
os.environ["DATABASE_URL"] = TESTING_DATABASE_URL

from app.main import app
from app.database import Base, get_db
from app.models import User, Team
from app.auth import get_password_hash, create_access_token

# Create test database engine
engine = create_engine(TESTING_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="function")
def db_session():
    """Create tables and yield a database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def test_team(db_session):
    """Create a test team."""
    import uuid
    team = Team(
        id=uuid.uuid4(),
        name="Test Hospital Team",
        subscription_status="active",
        subscription_plan="premium",
        member_limit=20,
    )
    db_session.add(team)
    db_session.commit()
    db_session.refresh(team)
    return team


@pytest.fixture
def test_user(db_session, test_team):
    """Create a test user with a team."""
    import uuid
    user = User(
        id=uuid.uuid4(),
        name="Test User",
        email="testuser@example.com",
        hashed_password=get_password_hash("TestPassword123"),
        role="advanced",
        team_id=test_team.id,
        team_role="owner",
        is_active=True,
        email_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_user_no_team(db_session):
    """Create a test user without a team."""
    import uuid
    user = User(
        id=uuid.uuid4(),
        name="No Team User",
        email="noteam@example.com",
        hashed_password=get_password_hash("TestPassword123"),
        role="basic",
        team_id=None,
        team_role=None,
        is_active=True,
        email_verified=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user):
    """Generate auth headers for the test user."""
    token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_no_team(test_user_no_team):
    """Generate auth headers for user without team."""
    token = create_access_token(data={"sub": str(test_user_no_team.id)})
    return {"Authorization": f"Bearer {token}"}
