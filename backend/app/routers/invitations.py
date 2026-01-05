from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timedelta
import secrets
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_active_user, get_current_verified_user
from ..services.email import send_invitation_email

router = APIRouter(tags=["invitations"])

def generate_invitation_token() -> str:
    """Generate a secure random token for invitations"""
    return secrets.token_urlsafe(32)


@router.post("/teams/{team_id}/invitations", response_model=schemas.TeamInvitationResponse, status_code=status.HTTP_201_CREATED)
async def send_invitation(
    team_id: UUID,
    invitation: schemas.TeamInvitationCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_verified_user)
):
    """Send a team invitation (admin or owner only)"""
    # Verify user belongs to this team and has permission
    if current_user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this team"
        )
    
    if current_user.team_role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team owners or admins can send invitations"
        )
    
    # Get team to check member limit
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Count current members
    current_member_count = db.query(models.User).filter(models.User.team_id == team_id).count()
    
    # Count pending invitations
    pending_invitations = db.query(models.TeamInvitation).filter(
        models.TeamInvitation.team_id == team_id,
        models.TeamInvitation.status == "pending"
    ).count()
    
    # Check if adding this invitation would exceed limit
    if current_member_count + pending_invitations >= team.member_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team member limit ({team.member_limit}) reached. Remove members or upgrade plan."
        )
    
    # Check if user already has a pending invitation
    existing_invitation = db.query(models.TeamInvitation).filter(
        models.TeamInvitation.team_id == team_id,
        models.TeamInvitation.email == invitation.email,
        models.TeamInvitation.status == "pending"
    ).first()
    
    if existing_invitation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An invitation has already been sent to this email"
        )
    
    # Check if user with this email already exists in the team
    existing_user = db.query(models.User).filter(
        models.User.email == invitation.email,
        models.User.team_id == team_id
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this team"
        )
    
    # Create invitation
    token = generate_invitation_token()
    new_invitation = models.TeamInvitation(
        team_id=team_id,
        email=invitation.email,
        invited_by=current_user.id,
        role=invitation.role,
        token=token,
        expires_at=datetime.utcnow() + timedelta(days=7),
        status="pending"
    )
    
    db.add(new_invitation)
    db.commit()
    db.refresh(new_invitation)
    
    # Send invitation email
    try:
        await send_invitation_email(
            to_email=invitation.email,
            team_name=team.name,
            invited_by=current_user.name or current_user.email,
            token=token
        )
    except Exception as e:
        # Log error but don't fail the invitation creation
        import logging
        logging.getLogger(__name__).error(f"Failed to send invitation email: {str(e)}")
    
    return new_invitation


@router.get("/teams/{team_id}/invitations", response_model=List[schemas.TeamInvitationResponse])
def list_invitations(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """List all team invitations (team members only)"""
    # Verify user belongs to this team
    if current_user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this team"
        )
    
    invitations = db.query(models.TeamInvitation).filter(
        models.TeamInvitation.team_id == team_id
    ).all()
    
    return invitations


@router.delete("/teams/{team_id}/invitations/{invitation_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_invitation(
    team_id: UUID,
    invitation_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Cancel a pending invitation (admin or owner only)"""
    # Verify user belongs to this team and has permission
    if current_user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this team"
        )
    
    if current_user.team_role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team owners or admins can cancel invitations"
        )
    
    invitation = db.query(models.TeamInvitation).filter(
        models.TeamInvitation.id == invitation_id,
        models.TeamInvitation.team_id == team_id
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    if invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only cancel pending invitations"
        )
    
    invitation.status = "cancelled"
    db.commit()
    
    return None


@router.post("/teams/{team_id}/invitations/{invitation_id}/resend", response_model=schemas.TeamInvitationResponse)
async def resend_invitation(
    team_id: UUID,
    invitation_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Resend an invitation email (admin or owner only)"""
    # Verify user belongs to this team and has permission
    if current_user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this team"
        )
    
    if current_user.team_role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team owners or admins can resend invitations"
        )
    
    invitation = db.query(models.TeamInvitation).filter(
        models.TeamInvitation.id == invitation_id,
        models.TeamInvitation.team_id == team_id
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    if invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only resend pending invitations"
        )
    
    # Extend expiration by 7 days from now
    invitation.expires_at = datetime.utcnow() + timedelta(days=7)
    db.commit()
    db.refresh(invitation)
    
    # Get team for email
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    
    # Send invitation email
    try:
        await send_invitation_email(
            to_email=invitation.email,
            team_name=team.name,
            invited_by=current_user.name or current_user.email,
            token=invitation.token
        )
    except Exception as e:
        # Log error but don't fail the resend
        import logging
        logging.getLogger(__name__).error(f"Failed to resend invitation email: {str(e)}")
    
    return invitation


@router.get("/invitations/{token}", response_model=schemas.TeamInvitationResponse)
def get_invitation_by_token(
    token: str,
    db: Session = Depends(get_db)
):
    """Get invitation details by token (public endpoint for invitation acceptance page)"""
    invitation = db.query(models.TeamInvitation).filter(
        models.TeamInvitation.token == token
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    # Check if invitation has expired
    if invitation.expires_at < datetime.utcnow():
        invitation.status = "expired"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation has expired"
        )
    
    if invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This invitation is {invitation.status}"
        )
    
    return invitation


@router.post("/invitations/{token}/accept", response_model=schemas.UserResponse)
def accept_invitation(
    token: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_verified_user)
):
    """Accept a team invitation (authenticated user)"""
    invitation = db.query(models.TeamInvitation).filter(
        models.TeamInvitation.token == token
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    # Verify email matches
    if invitation.email != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invitation was sent to a different email address"
        )
    
    # Check if invitation has expired
    if invitation.expires_at < datetime.utcnow():
        invitation.status = "expired"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invitation has expired"
        )
    
    if invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This invitation is {invitation.status}"
        )
    
    # Check if user already belongs to a team
    if current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already belong to a team. Leave your current team first."
        )
    
    # Get team to verify it still exists and has space
    team = db.query(models.Team).filter(models.Team.id == invitation.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Count current members
    current_member_count = db.query(models.User).filter(models.User.team_id == team.id).count()
    if current_member_count >= team.member_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team has reached its member limit"
        )
    
    # Add user to team
    current_user.team_id = invitation.team_id
    current_user.team_role = invitation.role
    current_user.role = "advanced"  # Grant advanced access
    
    # Mark invitation as accepted
    invitation.status = "accepted"
    invitation.accepted_at = datetime.utcnow()
    invitation.accepted_by = current_user.id
    
    db.commit()
    db.refresh(current_user)
    
    return current_user


@router.post("/invitations/{token}/accept-and-register", response_model=schemas.Token)
async def accept_invitation_and_register(
    token: str,
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    """
    For NEW users: Create account and accept invitation in one step.
    Email must match the invitation email.
    """
    from ..auth import get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
    from ..services.email import send_verification_email
    
    # 1. Get invitation by token
    invitation = db.query(models.TeamInvitation).filter(
        models.TeamInvitation.token == token
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")
    
    # 2. Validate invitation
    if invitation.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invitation is {invitation.status}"
        )
    
    if invitation.expires_at < datetime.utcnow():
        invitation.status = "expired"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has expired"
        )
    
    # 3. Verify email matches invitation
    if user_data.email != invitation.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You must register with the invited email: {invitation.email}"
        )
    
    # 4. Check user doesn't already exist
    existing_user = db.query(models.User).filter(
        models.User.email == user_data.email
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account already exists. Please login instead."
        )
    
    # 5. Get team
    team = db.query(models.Team).filter(models.Team.id == invitation.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # 6. Check team has space
    current_members = db.query(models.User).filter(
        models.User.team_id == team.id
    ).count()
    
    if current_members >= team.member_limit:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team has reached member limit ({team.member_limit})"
        )
    
    # 7. Create user account
    hashed_password = get_password_hash(user_data.password)
    
    # Generate email verification token
    verification_token = secrets.token_urlsafe(32)
    
    new_user = models.User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed_password,
        role=user_data.role or "advanced",  # Grant advanced access when joining team
        team_id=team.id,
        team_role=invitation.role,  # Use role from invitation
        email_verified=False,  # Require verification
        email_verification_token=verification_token,
        email_verification_expires=datetime.utcnow() + timedelta(days=1)
    )
    
    db.add(new_user)
    
    # 8. Mark invitation as accepted
    invitation.status = "accepted"
    invitation.accepted_at = datetime.utcnow()
    invitation.accepted_by = new_user.id
    
    db.commit()
    db.refresh(new_user)
    
    # 9. Send verification email
    await send_verification_email(new_user.email, verification_token)
    
    # 10. Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(new_user.id)},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }
