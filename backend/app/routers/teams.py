from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime, timedelta
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_active_user, get_current_verified_user

router = APIRouter(prefix="/teams", tags=["teams"])

# Helper function to check if user is team owner
def require_team_owner(current_user: models.User = Depends(get_current_active_user)):
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not part of a team"
        )
    if current_user.team_role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team owners can perform this action"
        )
    return current_user

# Helper function to check if user is team admin or owner
def require_team_admin_or_owner(current_user: models.User = Depends(get_current_active_user)):
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not part of a team"
        )
    if current_user.team_role not in ["owner", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team owners or admins can perform this action"
        )
    return current_user


@router.post("/", response_model=schemas.TeamResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team: schemas.TeamCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new team (called during subscription checkout)"""
    # Check if user already has a team
    if current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already belongs to a team"
        )
    
    # Create team with trial period (14 days)
    new_team = models.Team(
        name=team.name,
        subscription_status="trial",
        subscription_plan="basic",  # Default to basic plan
        member_limit=5,  # Default to 5 members (basic plan limit)
        trial_ends_at=datetime.utcnow() + timedelta(days=14)
    )
    db.add(new_team)
    db.flush()  # Get team ID
    
    # Assign user as team owner
    current_user.team_id = new_team.id
    current_user.team_role = "owner"
    current_user.role = "advanced"
    
    db.commit()
    db.refresh(new_team)
    
    return new_team


@router.get("/{team_id}", response_model=schemas.TeamResponse)
def get_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_verified_user)
):
    """Get team details"""
    # Verify user belongs to this team
    if current_user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this team"
        )
    
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    return team


@router.put("/{team_id}", response_model=schemas.TeamResponse)
def update_team(
    team_id: UUID,
    team_update: schemas.TeamUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_team_owner)
):
    """Update team details (owner only)"""
    if current_user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this team"
        )
    
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Update team name
    if team_update.name:
        team.name = team_update.name
    
    team.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(team)
    
    return team


@router.delete("/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def soft_delete_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_team_owner)
):
    """Soft delete team with 30-day grace period (owner only)"""
    if current_user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this team"
        )
    
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Soft delete with 30-day grace period
    team.deleted_at = datetime.utcnow()
    team.deletion_scheduled_for = datetime.utcnow() + timedelta(days=30)
    db.commit()
    
    return None


@router.post("/{team_id}/restore", response_model=schemas.TeamResponse)
def restore_team(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_team_owner)
):
    """Restore a soft-deleted team (owner only)"""
    if current_user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this team"
        )
    
    team = db.query(models.Team).filter(models.Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Restore team
    team.deleted_at = None
    team.deletion_scheduled_for = None
    db.commit()
    db.refresh(team)
    
    return team


@router.get("/{team_id}/members", response_model=List[schemas.TeamMemberResponse])
def get_team_members(
    team_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_verified_user)
):
    """Get all team members"""
    # Verify user belongs to this team
    if current_user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this team"
        )
    
    members = db.query(models.User).filter(models.User.team_id == team_id).all()
    return members


@router.put("/{team_id}/members/{user_id}/role", response_model=schemas.TeamMemberResponse)
def update_member_role(
    team_id: UUID,
    user_id: UUID,
    role_update: schemas.UpdateMemberRole,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_team_owner)
):
    """Update a team member's role (owner only)"""
    if current_user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this team"
        )
    
    # Cannot change own role
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.team_id == team_id
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found in this team")
    
    # Validate role
    if role_update.role not in ["admin", "member"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role. Must be 'admin' or 'member'"
        )
    
    user.team_role = role_update.role
    db.commit()
    db.refresh(user)
    
    return user


@router.delete("/{team_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_team_member(
    team_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_team_admin_or_owner)
):
    """Remove a member from the team (admin or owner)
    
    Note: All data created by this user will be preserved and remain visible to the team.
    """
    if current_user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this team"
        )
    
    # Cannot remove self
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove yourself from the team. Transfer ownership first or delete the team."
        )
    
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.team_id == team_id
    ).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found in this team")
    
    # Cannot remove the team owner (must transfer ownership first)
    if user.team_role == "owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove team owner. Transfer ownership first."
        )
    
    # Remove user from team (data created by user is preserved)
    user.team_id = None
    user.team_role = None
    user.role = "basic"
    
    db.commit()
    
    return None

@router.post("/{team_id}/transfer-ownership", status_code=status.HTTP_200_OK)
def transfer_team_ownership(
    team_id: UUID,
    new_owner_id: UUID,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_team_owner)
):
    """Transfer team ownership to another member (owner only)"""

    if current_user.team_id != team_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this team"
        )

    # Cannot transfer to self
    if current_user.id == new_owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot transfer ownership to yourself"
        )

    # Check if new owner is a member of this team
    new_owner = db.query(models.User).filter(
        models.User.id == new_owner_id,
        models.User.team_id == team_id
    ).first()

    if not new_owner:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found in this team"
        )

    # Transfer ownership
    current_user.team_role = "admin"  # Current owner becomes admin
    new_owner.team_role = "owner"     # New user becomes owner

    db.commit()

    return {"message": f"Ownership transferred to {new_owner.name}"}


@router.post("/leave", status_code=status.HTTP_200_OK)
def leave_team(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_verified_user)
):
    """Leave current team (cannot be owner)"""

    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not part of any team"
        )

    # Owners cannot leave (must transfer ownership first)
    if current_user.team_role == "owner":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team owners cannot leave. Transfer ownership first or delete the team."
        )

    # Remove user from team
    current_user.team_id = None
    current_user.team_role = None
    current_user.role = "basic"

    db.commit()

    return {"message": "Successfully left the team"}
