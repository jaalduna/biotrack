"""
Email service for sending notifications.

This module provides email functionality for the BioTrack application.
Uses SendGrid for email delivery.
"""

from typing import Optional
import os
import logging

logger = logging.getLogger(__name__)

# Email configuration (to be set in environment variables)
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
FROM_EMAIL = os.getenv("FROM_EMAIL", "noreply@biotrack.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173/biotrack")

# Check if SendGrid is configured
SENDGRID_ENABLED = bool(SENDGRID_API_KEY and SENDGRID_API_KEY != "")

if SENDGRID_ENABLED:
    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import Mail
        logger.info("SendGrid email service enabled")
    except ImportError:
        logger.warning("SendGrid package not installed. Email sending disabled.")
        SENDGRID_ENABLED = False
else:
    logger.warning("SendGrid API key not configured. Emails will be logged only.")


async def send_invitation_email(to_email: str, team_name: str, invited_by: str, token: str) -> bool:
    """
    Send a team invitation email.
    
    Args:
        to_email: Recipient email address
        team_name: Name of the team
        invited_by: Email of the person who sent the invitation
        token: Invitation token for acceptance link
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    invitation_link = f"{FRONTEND_URL}/invitations/accept/{token}"
    
    subject = f"Team invitation from {invited_by}"
    
    # Plain text version (important for spam filters)
    text_content = f"""
Hi,

{invited_by} has invited you to join their team "{team_name}" on BioTrack.

To accept this invitation, please click the link below:
{invitation_link}

This invitation will expire in 7 days.

If you don't have a BioTrack account, you'll be prompted to create one when you accept the invitation.

If you have any questions, please contact {invited_by}.

Best regards,
BioTrack Team
    """
    
    # HTML version with improved deliverability
    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Team Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px;">
                            <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Team Invitation</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 24px;">
                                Hello,
                            </p>
                            <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 24px;">
                                <strong>{invited_by}</strong> has invited you to join their team <strong>"{team_name}"</strong> on BioTrack.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 32px 0;">
                                <tr>
                                    <td style="border-radius: 6px; background-color: #2563eb;">
                                        <a href="{invitation_link}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500;">Accept Invitation</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 24px 0 8px 0; color: #6b6b6b; font-size: 14px; line-height: 20px;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="margin: 0 0 24px 0; padding: 12px; background-color: #f8f8f8; border-radius: 4px; color: #2563eb; font-size: 14px; word-break: break-all;">
                                {invitation_link}
                            </p>
                            
                            <p style="margin: 0 0 8px 0; color: #6b6b6b; font-size: 14px; line-height: 20px;">
                                This invitation expires in 7 days.
                            </p>
                            <p style="margin: 0; color: #6b6b6b; font-size: 14px; line-height: 20px;">
                                If you don't have a BioTrack account, you'll be able to create one when accepting the invitation.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 40px; border-top: 1px solid #e5e5e5;">
                            <p style="margin: 0; color: #9b9b9b; font-size: 13px; line-height: 18px;">
                                Best regards,<br>
                                BioTrack Team
                            </p>
                            <p style="margin: 16px 0 0 0; color: #9b9b9b; font-size: 12px; line-height: 16px;">
                                If you have questions, please contact {invited_by}.
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Email footer with unsubscribe -->
                <table role="presentation" style="width: 600px; max-width: 100%; margin-top: 24px;">
                    <tr>
                        <td style="padding: 0 20px; text-align: center;">
                            <p style="margin: 0; color: #9b9b9b; font-size: 12px; line-height: 16px;">
                                This is a transactional email. You received this because {invited_by} invited you to join their team.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """
    
    if SENDGRID_ENABLED:
        try:
            from sendgrid.helpers.mail import Content, Mail as MailClass
            
            message = MailClass(
                from_email=FROM_EMAIL,
                to_emails=to_email,
                subject=subject
            )
            
            # Add both plain text and HTML versions (improves deliverability)
            message.add_content(Content("text/plain", text_content.strip()))
            message.add_content(Content("text/html", html_content.strip()))
            
            # Add custom headers to improve deliverability
            message.reply_to = FROM_EMAIL
            
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            response = sg.send(message)
            
            logger.info(f"✓ Email sent to {to_email}, status: {response.status_code}")
            return True
            
        except Exception as e:
            logger.error(f"✗ Failed to send email to {to_email}: {str(e)}")
            return False
    else:
        # Fallback: Log email content when SendGrid not configured
        logger.info(f"[EMAIL PREVIEW] Would send invitation to {to_email}")
        logger.info(f"[EMAIL PREVIEW] Subject: {subject}")
        logger.info(f"[EMAIL PREVIEW] Link: {invitation_link}")
        return True


async def send_trial_ending_email(to_email: str, team_name: str, days_remaining: int) -> bool:
    """
    Send a trial ending reminder email.
    
    Args:
        to_email: Recipient email address
        team_name: Name of the team
        days_remaining: Number of days until trial ends
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = f"Your BioTrack trial ends in {days_remaining} days"
    
    body = f"""
    Hi,
    
    Your free trial for "{team_name}" on BioTrack will end in {days_remaining} days.
    
    To continue using BioTrack without interruption, please upgrade to a paid plan.
    
    Visit your team settings to manage your subscription:
    {FRONTEND_URL}/team/settings
    
    Best regards,
    The BioTrack Team
    """
    
    # TODO: Implement SendGrid email sending
    logger.info(f"[EMAIL] Would send trial reminder to {to_email}")
    logger.info(f"[EMAIL] Subject: {subject}")
    
    return True


async def send_payment_failed_email(to_email: str, team_name: str) -> bool:
    """
    Send a payment failure notification email.
    
    Args:
        to_email: Recipient email address
        team_name: Name of the team
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = "Payment failed for your BioTrack subscription"
    
    body = f"""
    Hi,
    
    We were unable to process the payment for your BioTrack subscription for "{team_name}".
    
    Please update your payment method to avoid service interruption:
    {FRONTEND_URL}/team/settings
    
    If you have any questions, please contact our support team.
    
    Best regards,
    The BioTrack Team
    """
    
    # TODO: Implement SendGrid email sending
    logger.info(f"[EMAIL] Would send payment failed notification to {to_email}")
    logger.info(f"[EMAIL] Subject: {subject}")
    
    return True


async def send_subscription_cancelled_email(to_email: str, team_name: str) -> bool:
    """
    Send a subscription cancellation confirmation email.
    
    Args:
        to_email: Recipient email address
        team_name: Name of the team
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    subject = "Your BioTrack subscription has been cancelled"
    
    body = f"""
    Hi,
    
    Your subscription for "{team_name}" on BioTrack has been cancelled.
    
    You will continue to have access until the end of your current billing period.
    
    If this was a mistake, you can reactivate your subscription at any time:
    {FRONTEND_URL}/team/settings
    
    Best regards,
    The BioTrack Team
    """
    
    # TODO: Implement SendGrid email sending
    logger.info(f"[EMAIL] Would send cancellation confirmation to {to_email}")
    logger.info(f"[EMAIL] Subject: {subject}")
    
    return True


async def send_verification_email(to_email: str, token: str) -> bool:
    """
    Send email verification link to new users.
    
    Args:
        to_email: Recipient email address
        token: Email verification token
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    verification_link = f"{FRONTEND_URL}/verify-email/{token}"
    
    subject = "Verify your BioTrack email address"
    
    # Plain text version
    text_content = f"""
Hi,

Thank you for signing up for BioTrack!

Please verify your email address by clicking the link below:
{verification_link}

This link will expire in 24 hours.

If you didn't create an account on BioTrack, please ignore this email.

Best regards,
BioTrack Team
    """
    
    # HTML version
    html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 0;">
                <table role="presentation" style="width: 600px; max-width: 100%; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 20px 40px;">
                            <h1 style="margin: 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">Verify Your Email</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 40px 40px;">
                            <p style="margin: 0 0 16px 0; color: #4a4a4a; font-size: 16px; line-height: 24px;">
                                Thank you for signing up for BioTrack!
                            </p>
                            <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 24px;">
                                Please verify your email address to start using BioTrack.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" style="margin: 32px 0;">
                                <tr>
                                    <td style="border-radius: 6px; background-color: #2563eb;">
                                        <a href="{verification_link}" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 500;">Verify Email Address</a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 24px 0 8px 0; color: #6b6b6b; font-size: 14px; line-height: 20px;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="margin: 0 0 24px 0; padding: 12px; background-color: #f8f8f8; border-radius: 4px; color: #2563eb; font-size: 14px; word-break: break-all;">
                                {verification_link}
                            </p>
                            
                            <p style="margin: 0 0 8px 0; color: #6b6b6b; font-size: 14px; line-height: 20px;">
                                This link will expire in 24 hours.
                            </p>
                            <p style="margin: 0; color: #6b6b6b; font-size: 14px; line-height: 20px;">
                                If you didn't create an account on BioTrack, please ignore this email.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 32px 40px; border-top: 1px solid #e5e5e5;">
                            <p style="margin: 0; color: #9b9b9b; font-size: 13px; line-height: 18px;">
                                Best regards,<br>
                                BioTrack Team
                            </p>
                        </td>
                    </tr>
                </table>
                
                <!-- Email footer -->
                <table role="presentation" style="width: 600px; max-width: 100%; margin-top: 24px;">
                    <tr>
                        <td style="padding: 0 20px; text-align: center;">
                            <p style="margin: 0; color: #9b9b9b; font-size: 12px; line-height: 16px;">
                                This is an automated email. Please do not reply.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    """
    
    if SENDGRID_ENABLED:
        try:
            from sendgrid.helpers.mail import Content, Mail as MailClass
            
            message = MailClass(
                from_email=FROM_EMAIL,
                to_emails=to_email,
                subject=subject
            )
            
            # Add both plain text and HTML versions
            message.add_content(Content("text/plain", text_content.strip()))
            message.add_content(Content("text/html", html_content.strip()))
            
            # Add custom headers
            message.reply_to = FROM_EMAIL
            
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            response = sg.send(message)
            
            logger.info(f"✓ Verification email sent to {to_email}, status: {response.status_code}")
            return True
            
        except Exception as e:
            logger.error(f"✗ Failed to send verification email to {to_email}: {str(e)}")
            return False
    else:
        # Fallback: Log email content when SendGrid not configured
        logger.info(f"[EMAIL PREVIEW] Would send verification email to {to_email}")
        logger.info(f"[EMAIL PREVIEW] Subject: {subject}")
        logger.info(f"[EMAIL PREVIEW] Link: {verification_link}")
        return True
