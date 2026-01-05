from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from uuid import UUID

# User schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str = "basic"  # basic, advanced

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: UUID
    team_id: Optional[UUID] = None
    team_role: Optional[str] = None
    is_active: bool
    email_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

# Patient schemas
class PatientBase(BaseModel):
    rut: str
    name: str
    age: Optional[int] = None
    status: str
    unit: str
    bed_number: Optional[int] = None
    has_ending_soon_program: Optional[bool] = None

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Diagnostic schemas
class DiagnosticBase(BaseModel):
    diagnosis_name: str
    diagnosis_code: Optional[str] = None
    date_diagnosed: Optional[date] = None
    severity: Optional[str] = None
    notes: Optional[str] = None
    created_by: Optional[str] = None

class DiagnosticCreate(DiagnosticBase):
    patient_id: UUID

class Diagnostic(DiagnosticBase):
    id: UUID
    patient_id: UUID
    created_by_user_id: Optional[UUID] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Treatment schemas
class TreatmentBase(BaseModel):
    antibiotic_name: str
    antibiotic_type: str
    start_date: Optional[date] = None
    days_applied: int = 0
    programmed_days: Optional[int] = None
    status: str
    start_count: Optional[int] = None
    dosage: Optional[str] = None

class TreatmentCreate(TreatmentBase):
    patient_id: UUID

class Treatment(TreatmentBase):
    id: UUID
    patient_id: UUID
    created_by_user_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Unit schemas
class UnitBase(BaseModel):
    name: str
    description: Optional[str] = None

class UnitCreate(UnitBase):
    pass

class Unit(UnitBase):
    id: UUID

    class Config:
        from_attributes = True

# Bed schemas
class BedBase(BaseModel):
    bed_number: int
    is_occupied: bool = False

class BedCreate(BedBase):
    unit_id: UUID

class Bed(BedBase):
    id: UUID
    unit_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Bed History schemas
class BedHistoryBase(BaseModel):
    start_date: date
    end_date: Optional[date] = None
    notes: Optional[str] = None

class BedHistoryCreate(BedHistoryBase):
    patient_id: UUID
    bed_id: UUID

class BedHistory(BedHistoryBase):
    id: UUID
    patient_id: UUID
    bed_id: UUID

    class Config:
        from_attributes = True

# Team schemas
class TeamCreate(BaseModel):
    name: str

class TeamUpdate(BaseModel):
    name: Optional[str] = None

class TeamResponse(BaseModel):
    id: UUID
    name: str
    subscription_status: Optional[str] = "trial"
    subscription_plan: Optional[str] = None
    member_limit: Optional[int] = 5
    trial_ends_at: Optional[datetime] = None
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TeamMemberResponse(BaseModel):
    id: UUID
    name: str
    email: str
    team_role: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class UpdateMemberRole(BaseModel):
    role: str  # admin, member

# Invitation schemas
class InvitationCreate(BaseModel):
    email: EmailStr
    role: str = "member"  # admin, member

class TeamInvitationCreate(BaseModel):
    email: EmailStr
    role: str = "member"  # admin, member

class InvitationResponse(BaseModel):
    id: UUID
    team_id: UUID
    email: str
    role: str
    status: str
    expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TeamInvitationResponse(BaseModel):
    id: UUID
    team_id: UUID
    email: str
    role: str
    status: str
    token: Optional[str] = None
    expires_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
# Email Verification schemas
class EmailVerify(BaseModel):
    token: str

class EmailVerifyResponse(BaseModel):
    message: str
    email_verified: bool
