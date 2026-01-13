import os
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from uuid import UUID
import secrets

from . import models
from .database import get_db

# Configuration - loaded from environment variables
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is required")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7)))  # 7 days default

# HTTP Bearer for token authentication
security = HTTPBearer()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_password_reset_token() -> tuple[str, datetime]:
    """Create a password reset token and its expiration time."""
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(hours=1)  # Token valid for 1 hour
    return token, expires


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> models.User:
    """Get the current authenticated user from the JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials

        # BETA MODE: Accept beta tokens without JWT validation
        if token.startswith("beta_token_"):
            # Create or retrieve beta user from database
            beta_user_id = UUID("00000000-0000-0000-0000-000000000001")
            beta_user = (
                db.query(models.User).filter(models.User.id == beta_user_id).first()
            )

            if not beta_user:
                # Create beta user in database
                beta_user = models.User(
                    id=beta_user_id,
                    name="Beta Tester",
                    email="beta@biotrack.app",
                    role="advanced",
                    team_id=None,
                    team_role=None,
                    is_active=True,
                    email_verified=True,
                    hashed_password="",  # Not used for beta
                )
                db.add(beta_user)
                db.commit()
                db.refresh(beta_user)

            return beta_user

        # PRODUCTION MODE: Validate JWT as normal
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == UUID(user_id)).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    return user


async def get_current_active_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """Ensure the user is active."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def require_advanced_role(
    current_user: models.User = Depends(get_current_active_user),
) -> models.User:
    """Require the user to have the advanced role."""
    if current_user.role != "advanced":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires advanced user privileges",
        )
    return current_user


async def get_current_verified_user(
    current_user: models.User = Depends(get_current_active_user),
) -> models.User:
    """Ensure the user has verified their email address."""
    if not current_user.email_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address to access this feature",
        )
    return current_user


def authenticate_user(db: Session, email: str, password: str) -> Optional[models.User]:
    """Authenticate a user by email and password."""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
