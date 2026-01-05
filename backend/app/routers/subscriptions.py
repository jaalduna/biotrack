from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from datetime import datetime, timedelta
import stripe
import os
from .. import models, schemas
from ..database import get_db
from ..auth import get_current_active_user

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_placeholder")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_placeholder")

# Stripe Price IDs (these need to be created in your Stripe dashboard)
STRIPE_PRICES = {
    "basic": os.getenv("STRIPE_BASIC_PRICE_ID", "price_basic_placeholder"),
    "premium": os.getenv("STRIPE_PREMIUM_PRICE_ID", "price_premium_placeholder")
}


@router.post("/checkout")
async def create_checkout_session(
    plan: str,  # "basic" or "premium"
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a Stripe checkout session for subscription"""
    
    # Verify user doesn't already have a team
    if current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already belongs to a team"
        )
    
    # Validate plan
    if plan not in ["basic", "premium"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid plan. Must be 'basic' or 'premium'"
        )
    
    # Get price ID
    price_id = STRIPE_PRICES.get(plan)
    if not price_id or price_id.endswith("_placeholder"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Stripe is not configured. Please add price IDs to environment variables."
        )
    
    try:
        # Create Stripe checkout session
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173/biotrack")
        
        checkout_session = stripe.checkout.Session.create(
            customer_email=current_user.email,
            mode="subscription",
            payment_method_types=["card"],
            line_items=[
                {
                    "price": price_id,
                    "quantity": 1,
                }
            ],
            success_url=f"{frontend_url}/teams/setup?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{frontend_url}/subscription/checkout?cancelled=true",
            metadata={
                "user_id": str(current_user.id),
                "plan": plan,
            }
        )
        
        return {
            "url": checkout_session.url,
            "session_id": checkout_session.id
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stripe error: {str(e)}"
        )


@router.post("/portal")
async def create_customer_portal(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a Stripe customer portal session for managing subscription"""
    
    # Get user's team
    if not current_user.team_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not belong to a team"
        )
    
    team = db.query(models.Team).filter(models.Team.id == current_user.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    if not team.stripe_customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Stripe customer associated with this team"
        )
    
    try:
        # Create Stripe customer portal session
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173/biotrack")
        
        portal_session = stripe.billing_portal.Session.create(
            customer=team.stripe_customer_id,
            return_url=f"{frontend_url}/teams/manage",
        )
        
        return {
            "url": portal_session.url
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stripe error: {str(e)}"
        )


@router.get("/status")
async def get_subscription_status(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get current subscription status"""
    
    if not current_user.team_id:
        return {
            "has_team": False,
            "subscription_status": None
        }
    
    team = db.query(models.Team).filter(models.Team.id == current_user.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Calculate days remaining in trial
    days_remaining = None
    if team.subscription_status == "trial" and team.trial_ends_at:
        delta = team.trial_ends_at - datetime.utcnow()
        days_remaining = max(0, delta.days)
    
    return {
        "has_team": True,
        "team_id": str(team.id),
        "team_name": team.name,
        "subscription_status": team.subscription_status,
        "subscription_plan": team.subscription_plan,
        "member_limit": team.member_limit,
        "trial_ends_at": team.trial_ends_at.isoformat() if team.trial_ends_at else None,
        "days_remaining": days_remaining,
        "stripe_customer_id": team.stripe_customer_id,
        "stripe_subscription_id": team.stripe_subscription_id
    }


@router.post("/downgrade")
async def downgrade_subscription(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Downgrade from Premium to Basic (with member limit validation)"""
    
    # Verify user is team owner
    if not current_user.team_id or current_user.team_role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only team owners can manage subscriptions"
        )
    
    team = db.query(models.Team).filter(models.Team.id == current_user.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    
    # Check current plan
    if team.subscription_plan != "premium":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team is not on premium plan"
        )
    
    # Count current members
    member_count = db.query(models.User).filter(models.User.team_id == team.id).count()
    
    # Basic plan allows 5 members, premium allows 15
    if member_count > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot downgrade. Team has {member_count} members. Remove members to get under 5 members first."
        )
    
    # Update subscription in Stripe
    if team.stripe_subscription_id:
        try:
            subscription = stripe.Subscription.retrieve(team.stripe_subscription_id)
            
            # Update subscription to basic plan
            stripe.Subscription.modify(
                team.stripe_subscription_id,
                items=[{
                    'id': subscription['items']['data'][0].id,
                    'price': STRIPE_PRICES["basic"],
                }],
                proration_behavior='create_prorations',  # Prorate the change
            )
            
        except stripe.error.StripeError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Stripe error: {str(e)}"
            )
    
    # Update team
    team.subscription_plan = "basic"
    team.member_limit = 5
    team.updated_at = datetime.utcnow()
    db.commit()
    
    return {
        "message": "Successfully downgraded to basic plan",
        "plan": "basic",
        "member_limit": 5
    }


@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """Handle Stripe webhook events"""
    
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        # Verify webhook signature
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
        
    except ValueError:
        # Invalid payload
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        # Invalid signature
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle different event types
    event_type = event['type']
    
    if event_type == "checkout.session.completed":
        # Payment successful, create team
        session = event['data']['object']
        
        user_id = session['metadata'].get('user_id')
        plan = session['metadata'].get('plan', 'basic')
        
        if user_id:
            user = db.query(models.User).filter(models.User.id == user_id).first()
            if user and not user.team_id:
                # Create team
                member_limit = 5 if plan == "basic" else 15
                team = models.Team(
                    name=f"{user.name}'s Team",
                    subscription_status="active",
                    subscription_plan=plan,
                    member_limit=member_limit,
                    stripe_customer_id=session.get('customer'),
                    stripe_subscription_id=session.get('subscription')
                )
                db.add(team)
                db.flush()
                
                # Assign user as team owner
                user.team_id = team.id
                user.team_role = "owner"
                user.role = "advanced"
                
                db.commit()
    
    elif event_type == "customer.subscription.updated":
        # Subscription plan changed
        subscription = event['data']['object']
        
        # Find team by subscription ID
        team = db.query(models.Team).filter(
            models.Team.stripe_subscription_id == subscription['id']
        ).first()
        
        if team:
            # Update subscription status
            status_mapping = {
                "active": "active",
                "past_due": "active",  # Keep active but may need payment
                "canceled": "cancelled",
                "unpaid": "expired",
                "incomplete": "trial",
                "incomplete_expired": "expired"
            }
            
            team.subscription_status = status_mapping.get(
                subscription['status'], 
                "active"
            )
            team.updated_at = datetime.utcnow()
            db.commit()
    
    elif event_type == "customer.subscription.deleted":
        # Subscription cancelled
        subscription = event['data']['object']
        
        # Find team by subscription ID
        team = db.query(models.Team).filter(
            models.Team.stripe_subscription_id == subscription['id']
        ).first()
        
        if team:
            team.subscription_status = "cancelled"
            team.updated_at = datetime.utcnow()
            db.commit()
    
    elif event_type == "invoice.payment_failed":
        # Payment failed
        invoice = event['data']['object']
        customer_id = invoice.get('customer')
        
        # Find team by customer ID
        team = db.query(models.Team).filter(
            models.Team.stripe_customer_id == customer_id
        ).first()
        
        if team:
            # TODO: Send email notification in Phase 4
            # send_payment_failed_email(team.owner_email, team.name)
            pass
    
    return {"status": "success"}
