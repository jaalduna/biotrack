from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    Text,
    Boolean,
    ForeignKey,
    TIMESTAMP,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime, timedelta
from .database import Base


class Team(Base):
    __tablename__ = "teams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    subscription_status = Column(
        String(20), default="trial"
    )  # trial, active, cancelled, expired
    subscription_plan = Column(String(50), nullable=True)  # basic, premium
    member_limit = Column(Integer, default=5)
    trial_ends_at = Column(TIMESTAMP, nullable=True)
    stripe_customer_id = Column(String(100), nullable=True)
    stripe_subscription_id = Column(String(100), nullable=True)
    deleted_at = Column(TIMESTAMP, nullable=True)
    deletion_scheduled_for = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    members = relationship("User", back_populates="team")
    invitations = relationship("TeamInvitation", back_populates="team")


class TeamInvitation(Base):
    __tablename__ = "team_invitations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    invited_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(String(20), default="member")  # admin, member
    token = Column(String(100), nullable=False, unique=True, index=True)
    expires_at = Column(TIMESTAMP, nullable=False)
    status = Column(
        String(20), default="pending"
    )  # pending, accepted, cancelled, expired
    accepted_at = Column(TIMESTAMP, nullable=True)
    accepted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # Relationships
    team = relationship("Team", back_populates="invitations")
    inviter = relationship("User", foreign_keys=[invited_by])
    acceptor = relationship("User", foreign_keys=[accepted_by])


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False, default="basic")  # basic, advanced
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    team_role = Column(String, nullable=True)  # owner, admin, member
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    email_verification_token = Column(String, nullable=True)
    email_verification_expires = Column(TIMESTAMP, nullable=True)
    password_reset_token = Column(String, nullable=True)
    password_reset_expires = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # Relationships
    team = relationship("Team", back_populates="members")
    created_diagnostics = relationship(
        "Diagnostic",
        back_populates="creator",
        foreign_keys="Diagnostic.created_by_user_id",
    )
    created_treatments = relationship(
        "Treatment",
        back_populates="creator",
        foreign_keys="Treatment.created_by_user_id",
    )


class Patient(Base):
    __tablename__ = "patients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey("teams.id"), nullable=True)
    rut = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    age = Column(Integer)
    status = Column(String, nullable=False)  # waiting, active, archived
    unit = Column(String, nullable=False)
    bed_number = Column(Integer)
    has_ending_soon_program = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    diagnostics = relationship("Diagnostic", back_populates="patient")
    treatments = relationship("Treatment", back_populates="patient")
    bed_history = relationship("BedHistory", back_populates="patient")


class Diagnostic(Base):
    __tablename__ = "diagnostics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    category_id = Column(
        UUID(as_uuid=True), ForeignKey("diagnostic_categories.id"), nullable=True
    )
    subcategory_id = Column(
        UUID(as_uuid=True), ForeignKey("diagnostic_subcategories.id"), nullable=True
    )
    diagnosis_name = Column(String, nullable=False)
    diagnosis_code = Column(String)
    date_diagnosed = Column(Date)
    severity = Column(String)  # mild, moderate, severe, critical
    notes = Column(Text)
    created_by = Column(String)  # Legacy field for name
    created_by_user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    patient = relationship("Patient", back_populates="diagnostics")
    creator = relationship(
        "User", back_populates="created_diagnostics", foreign_keys=[created_by_user_id]
    )
    category = relationship("DiagnosticCategory", back_populates="diagnostics")
    subcategory = relationship("DiagnosticSubcategory", back_populates="diagnostics")


class Treatment(Base):
    __tablename__ = "treatments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    antibiotic_name = Column(String, nullable=False)
    antibiotic_type = Column(String, nullable=False)  # antibiotic, corticoide
    start_date = Column(Date)
    days_applied = Column(Integer, default=0)
    programmed_days = Column(Integer)
    status = Column(String, nullable=False)  # active, suspended, extended, finished
    start_count = Column(Integer)  # 0 or 1
    dosage = Column(String)
    created_by_user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    patient = relationship("Patient", back_populates="treatments")
    creator = relationship(
        "User", back_populates="created_treatments", foreign_keys=[created_by_user_id]
    )


class Unit(Base):
    __tablename__ = "units"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text)

    beds = relationship("Bed", back_populates="unit")


class Bed(Base):
    __tablename__ = "beds"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    unit_id = Column(UUID(as_uuid=True), ForeignKey("units.id"), nullable=False)
    bed_number = Column(Integer, nullable=False)
    is_occupied = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())

    unit = relationship("Unit", back_populates="beds")
    bed_history = relationship("BedHistory", back_populates="bed")


class BedHistory(Base):
    __tablename__ = "bed_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("patients.id"), nullable=False)
    bed_id = Column(UUID(as_uuid=True), ForeignKey("beds.id"), nullable=False)
    start_date = Column(Date)
    end_date = Column(Date)
    notes = Column(Text)

    patient = relationship("Patient", back_populates="bed_history")
    bed = relationship("Bed", back_populates="bed_history")


class Antibiotic(Base):
    __tablename__ = "antibiotics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    type = Column(String(20), nullable=False)
    default_start_count = Column(Integer, nullable=False, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class DiagnosticCategory(Base):
    __tablename__ = "diagnostic_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(20), nullable=False, unique=True)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    subcategories = relationship(
        "DiagnosticSubcategory", back_populates="category", cascade="all, delete-orphan"
    )
    diagnostics = relationship("Diagnostic", back_populates="category")


class DiagnosticSubcategory(Base):
    __tablename__ = "diagnostic_subcategories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id = Column(
        UUID(as_uuid=True), ForeignKey("diagnostic_categories.id"), nullable=False
    )
    name = Column(String(300), nullable=False)
    code = Column(String(50), nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    category = relationship("DiagnosticCategory", back_populates="subcategories")
    diagnostics = relationship("Diagnostic", back_populates="subcategory")
