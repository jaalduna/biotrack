from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta, datetime
import secrets

from .. import models, schemas
from ..database import get_db
from ..auth import (
    get_password_hash,
    authenticate_user,
    create_access_token,
    create_password_reset_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_active_user,
)
from ..services.email import send_verification_email

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=schemas.Token, status_code=status.HTTP_201_CREATED)
async def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """Register a new user."""
    # Check if user already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Generate email verification token
    verification_token = secrets.token_urlsafe(32)
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        email_verified=False,
        email_verification_token=verification_token,
        email_verification_expires=datetime.utcnow() + timedelta(days=1)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Send verification email
    await send_verification_email(new_user.email, verification_token)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }

@router.post("/login", response_model=schemas.Token)
def login(user_credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login with email and password."""
    user = authenticate_user(db, user_credentials.email, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/password-reset-request")
def request_password_reset(
    request: schemas.PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Request a password reset token."""
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    # Don't reveal if user exists or not (security best practice)
    if not user:
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # Create reset token
    token, expires = create_password_reset_token()
    user.password_reset_token = token
    user.password_reset_expires = expires
    db.commit()
    
    # TODO: Send email with reset link in background
    # For now, we'll just log the token (in production, send via email)
    print(f"Password reset token for {user.email}: {token}")
    print(f"Reset link: http://localhost:5173/biotrack/reset-password?token={token}")
    
    return {"message": "If the email exists, a password reset link has been sent"}

@router.post("/password-reset")
def reset_password(reset: schemas.PasswordReset, db: Session = Depends(get_db)):
    """Reset password using the reset token."""
    user = db.query(models.User).filter(
        models.User.password_reset_token == reset.token
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )
    
    # Check if token is expired
    if user.password_reset_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired"
        )
    
    # Update password
    user.hashed_password = get_password_hash(reset.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    
    return {"message": "Password successfully reset"}

@router.get("/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """Get all users (for admin purposes)."""
    users = db.query(models.User).all()
    return users

@router.post("/verify-email/{token}")
def verify_email(token: str, db: Session = Depends(get_db)):
    """Verify email address with token"""
    # Find user by verification token
    user = db.query(models.User).filter(
        models.User.email_verification_token == token
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid verification token"
        )
    
    # Check if already verified
    if user.email_verified:
        return {
            "message": "Email already verified",
            "email_verified": True
        }
    
    # Check if token expired
    if user.email_verification_expires and user.email_verification_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification link has expired. Please request a new one."
        )
    
    # Verify email
    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_expires = None
    db.commit()
    
    return {
        "message": "Email verified successfully",
        "email_verified": True
    }

@router.post("/resend-verification-email")
async def resend_verification_email(
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Resend email verification link"""
    if current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )
    
    # Generate new token
    verification_token = secrets.token_urlsafe(32)
    current_user.email_verification_token = verification_token
    current_user.email_verification_expires = datetime.utcnow() + timedelta(days=1)
    db.commit()
    
    # Send email
    await send_verification_email(current_user.email, verification_token)
    
    return {"message": "Verification email sent"}
